"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addContactToPipeline,
  deleteContacts,
  markContactAsClient,
} from "@/app/contacts/actions";
import ConfirmDialog from "@/components/ConfirmDialog";
import type { ContactType } from "@/app/contacts/types";

export type DevelopmentOption = { id: string; name: string };

export type ContactListRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  contact_source: string | null;
  contact_type: ContactType;
  created_at: string;
};

const TYPE_LABELS: Record<ContactType, string> = {
  lead: "Lead",
  client: "Client",
  vendor: "Vendor",
  other: "Other",
};

const TYPE_COLORS: Record<ContactType, string> = {
  lead: "bg-blue-100 text-blue-800",
  client: "bg-green-100 text-green-800",
  vendor: "bg-amber-100 text-amber-800",
  other: "bg-gray-100 text-gray-700",
};

export default function ContactsTable({
  rows,
  developments,
}: {
  rows: ContactListRow[];
  developments: DevelopmentOption[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pipelineFor, setPipelineFor] = useState<ContactListRow | null>(null);
  const [pipelineDevId, setPipelineDevId] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  function openPipelineDialog(row: ContactListRow) {
    setActionError(null);
    setPipelineDevId(developments.length === 1 ? developments[0].id : "");
    setPipelineFor(row);
  }

  function handleAddToPipeline() {
    if (!pipelineFor) return;
    if (!pipelineDevId) {
      setActionError("Pick a development.");
      return;
    }
    startTransition(async () => {
      const result = await addContactToPipeline(pipelineFor.id, pipelineDevId);
      if (!result.ok) {
        setActionError(result.error);
        return;
      }
      setPipelineFor(null);
      router.refresh();
    });
  }

  function handleMakeClient(row: ContactListRow) {
    setDeleteError(null);
    startTransition(async () => {
      const result = await markContactAsClient(row.id);
      if (!result.ok) {
        setDeleteError(result.error);
        return;
      }
      router.refresh();
    });
  }

  // Only count selections that are still visible (the filter chips re-render
  // this table with a different row set without unmounting it).
  const selectedIds = rows.filter((r) => selected.has(r.id)).map((r) => r.id);
  const allSelected = rows.length > 0 && selectedIds.length === rows.length;

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  }

  function handleDelete() {
    const ids = selectedIds;
    startTransition(async () => {
      const result = await deleteContacts(ids);
      setConfirming(false);
      if (!result.ok) {
        setDeleteError(result.error);
        return;
      }
      setDeleteError(null);
      setSelected(new Set());
      router.refresh();
    });
  }

  const count = selectedIds.length;

  return (
    <>
      {deleteError && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {deleteError}
        </div>
      )}

      {count > 0 && (
        <div className="flex items-center justify-between mb-3 rounded-md border border-border bg-surface-muted px-3 py-2">
          <span className="text-sm text-text-muted">
            {count} selected
          </span>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={isPending}
            className="px-3 py-1.5 bg-red-600 text-white text-sm font-semibold rounded-md hover:opacity-90 disabled:opacity-50"
          >
            Delete selected ({count})
          </button>
        </div>
      )}

      <div className="border border-border bg-white rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted text-text-muted">
            <tr>
              <th className="px-3 py-2 w-8">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all contacts"
                  className="accent-brand-accent align-middle"
                />
              </th>
              <th className="text-left px-3 py-2 font-medium">Name</th>
              <th className="text-left px-3 py-2 font-medium">Email</th>
              <th className="text-left px-3 py-2 font-medium">Phone</th>
              <th className="text-left px-3 py-2 font-medium">Type</th>
              <th className="text-left px-3 py-2 font-medium">Source</th>
              <th className="text-left px-3 py-2 font-medium">Added</th>
              <th className="text-left px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const name =
                [c.first_name, c.last_name].filter(Boolean).join(" ") || "—";
              return (
                <tr
                  key={c.id}
                  className="border-t border-border hover:bg-surface-muted/50"
                >
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selected.has(c.id)}
                      onChange={() => toggleRow(c.id)}
                      aria-label={`Select ${name}`}
                      className="accent-brand-accent align-middle"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <a
                      href={`/contacts/${c.id}`}
                      className="text-brand-accent hover:underline font-medium"
                    >
                      {name}
                    </a>
                  </td>
                  <td className="px-3 py-2 text-text-muted">
                    {c.email ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-text-muted">
                    {c.phone ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        TYPE_COLORS[c.contact_type]
                      }`}
                    >
                      {TYPE_LABELS[c.contact_type]}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-text-muted">
                    {c.contact_source ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-text-muted whitespace-nowrap">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {c.contact_type === "lead" ? (
                      <span className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openPipelineDialog(c)}
                          disabled={isPending}
                          className="px-2 py-1 border border-brand-accent text-brand-accent text-xs font-semibold rounded hover:bg-brand-accent/10 disabled:opacity-50"
                        >
                          Add to Pipeline
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMakeClient(c)}
                          disabled={isPending}
                          className="px-2 py-1 border border-green-600 text-green-700 text-xs font-semibold rounded hover:bg-green-50 disabled:opacity-50"
                        >
                          Make Client
                        </button>
                      </span>
                    ) : (
                      <span className="text-xs text-text-muted">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pipelineFor && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Add to pipeline"
          onClick={isPending ? undefined : () => setPipelineFor(null)}
        >
          <div
            className="w-full max-w-sm rounded-lg border border-border bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-text mb-1">
              Add to Pipeline
            </h3>
            <p className="text-sm text-text-muted mb-4">
              {[pipelineFor.first_name, pipelineFor.last_name]
                .filter(Boolean)
                .join(" ") || "This contact"}{" "}
              will appear on the board as a new opportunity.
            </p>

            {actionError && (
              <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {actionError}
              </div>
            )}

            <label className="block text-sm mb-4">
              <span className="text-text-muted">Development</span>
              <select
                value={pipelineDevId}
                onChange={(e) => setPipelineDevId(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-border rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
              >
                <option value="">Select a development…</option>
                {developments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPipelineFor(null)}
                disabled={isPending}
                className="px-3 py-1.5 text-sm text-text-muted hover:text-text disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddToPipeline}
                disabled={isPending}
                className="px-3 py-1.5 bg-brand-accent text-white text-sm font-semibold rounded-md hover:opacity-90 disabled:opacity-50"
              >
                {isPending ? "Adding…" : "Add to Pipeline"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirming}
        title="Delete contacts"
        message={`Delete ${count} contact${count === 1 ? "" : "s"}? This can't be undone. Linked pipeline entries are kept but unlinked.`}
        confirmLabel={`Delete ${count} contact${count === 1 ? "" : "s"}`}
        busy={isPending}
        onConfirm={handleDelete}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
