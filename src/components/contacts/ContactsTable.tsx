"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteContacts } from "@/app/contacts/actions";
import ConfirmDialog from "@/components/ConfirmDialog";
import type { ContactType } from "@/app/contacts/types";

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

export default function ContactsTable({ rows }: { rows: ContactListRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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
