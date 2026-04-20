"use client";

import { useState } from "react";
import { updateNote } from "@/app/leads/[id]/actions";

export default function NoteItem({
  leadId,
  noteId,
  body: initialBody,
  createdAt,
  deleteAction,
}: {
  leadId: string;
  noteId: string;
  body: string;
  createdAt: string;
  deleteAction: () => void;
}) {
  const [isEditing, setEditing] = useState(false);
  const [body, setBody] = useState(initialBody);

  async function handleSave(formData: FormData) {
    const next = (formData.get("body") as string) ?? "";
    setBody(next);
    setEditing(false);
    await updateNote(leadId, noteId, formData);
  }

  return (
    <li className="border-l-2 border-brand-accent pl-3 py-1">
      {isEditing ? (
        <form action={handleSave} className="space-y-2">
          <textarea
            name="body"
            defaultValue={body}
            rows={3}
            className="w-full px-3 py-2 border border-border rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-3 py-1 bg-brand-accent text-white text-xs font-semibold rounded-md hover:opacity-90"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-3 py-1 text-xs text-text-muted hover:text-text"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <p className="text-sm whitespace-pre-wrap">{body}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-text-muted">
              {new Date(createdAt).toLocaleString()}
            </span>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-xs text-text-muted hover:text-text"
            >
              Edit
            </button>
            <form action={deleteAction} className="inline">
              <button
                type="submit"
                className="text-xs text-text-muted hover:text-red-600"
              >
                Delete
              </button>
            </form>
          </div>
        </>
      )}
    </li>
  );
}
