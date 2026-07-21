"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteLead } from "@/app/leads/actions";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function DeleteLeadButton({
  leadId,
  leadTitle,
}: {
  leadId: string;
  leadTitle: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteLead(leadId);
      setConfirming(false);
      if (!result.ok) {
        setDeleteError(result.error);
        return;
      }
      router.push("/leads");
      router.refresh();
    });
  }

  return (
    <div>
      {deleteError && (
        <div className="mb-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {deleteError}
        </div>
      )}
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={isPending}
        className="px-3 py-1.5 border border-red-300 text-red-600 text-sm font-semibold rounded-md hover:bg-red-50 disabled:opacity-50"
      >
        Delete opportunity
      </button>

      <ConfirmDialog
        open={confirming}
        title="Delete opportunity"
        message={`Delete ${leadTitle}? This can't be undone. Its tasks, notes, appointments, payments, and documents are deleted with it. Linked contacts are kept.`}
        confirmLabel="Delete opportunity"
        busy={isPending}
        onConfirm={handleDelete}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}
