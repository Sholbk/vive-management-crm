import {
  uploadLeadAttachment,
  deleteLeadAttachment,
} from "@/app/leads/[id]/actions";

export interface LeadAttachment {
  id: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
  signed_url: string | null;
}

function fmtSize(bytes: number | null): string {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function DocumentsSection({
  leadId,
  attachments,
}: {
  leadId: string;
  attachments: LeadAttachment[];
}) {
  return (
    <section className="bg-white border border-border rounded-lg p-5">
      <h3 className="text-lg font-semibold mb-3">Documents</h3>

      <form
        action={uploadLeadAttachment.bind(null, leadId)}
        className="mb-4 flex flex-wrap items-center gap-2"
      >
        <input
          type="file"
          name="file"
          required
          className="text-sm file:mr-3 file:px-3 file:py-2 file:border-0 file:rounded-md file:bg-brand-accent file:text-white file:font-semibold file:cursor-pointer"
        />
        <button
          type="submit"
          className="px-3 py-2 bg-brand-accent text-white text-sm font-semibold rounded-md hover:opacity-90"
        >
          Upload
        </button>
        <span className="w-full text-xs text-text-muted">
          Up to 25 MB — IDs, proof of funds, signed documents, etc.
        </span>
      </form>

      {attachments.length === 0 ? (
        <p className="text-sm text-text-muted">No documents uploaded yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {attachments.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-3 py-2"
            >
              <div className="min-w-0">
                {a.signed_url ? (
                  <a
                    href={a.signed_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-brand-accent hover:underline truncate block"
                  >
                    {a.file_name}
                  </a>
                ) : (
                  <span className="text-sm font-medium truncate block">
                    {a.file_name}
                  </span>
                )}
                <span className="text-xs text-text-muted">
                  {[fmtSize(a.size_bytes), fmtDate(a.created_at)]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
              <form action={deleteLeadAttachment.bind(null, leadId, a.id)}>
                <button
                  type="submit"
                  className="text-xs text-red-600 hover:underline shrink-0"
                >
                  Delete
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
