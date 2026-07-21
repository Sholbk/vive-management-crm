"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import {
  importContacts,
  type ImportedContactRow,
} from "@/app/contacts/actions";

// Header aliases, matched after lowercasing and stripping spaces/_/-.
const HEADER_MAP: Record<string, keyof ImportedContactRow | "name"> = {
  firstname: "first_name",
  first: "first_name",
  lastname: "last_name",
  last: "last_name",
  surname: "last_name",
  email: "email",
  emailaddress: "email",
  phone: "phone",
  phonenumber: "phone",
  mobile: "phone",
  tel: "phone",
  source: "contact_source",
  contactsource: "contact_source",
  leadsource: "contact_source",
  type: "contact_type",
  contacttype: "contact_type",
  notes: "notes",
  note: "notes",
  dateofbirth: "date_of_birth",
  dob: "date_of_birth",
  birthdate: "date_of_birth",
  name: "name",
  fullname: "name",
};

const TEMPLATE_CSV =
  "first_name,last_name,email,phone,source,type,date_of_birth,notes\n" +
  'Jane,Doe,jane@example.com,+1 555 0100,Walk in,lead,1980-04-12,"Interested in Loma del Mar"\n';

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[\s_-]+/g, "");
}

function parseRows(data: Record<string, string>[]): {
  rows: ImportedContactRow[];
  skippedInvalid: number;
  matchedColumns: string[];
} {
  const rows: ImportedContactRow[] = [];
  let skippedInvalid = 0;
  const matched = new Set<string>();

  for (const raw of data) {
    const row: ImportedContactRow = {
      first_name: null,
      last_name: null,
      email: null,
      phone: null,
      contact_source: null,
      contact_type: null,
      notes: null,
      date_of_birth: null,
    };
    for (const [header, value] of Object.entries(raw)) {
      const field = HEADER_MAP[normalizeHeader(header)];
      if (!field || typeof value !== "string" || !value.trim()) continue;
      matched.add(header.trim());
      if (field === "name") {
        // "Full Name" column: first word -> first name, rest -> last name.
        // Explicit first/last columns win if both are present.
        const parts = value.trim().split(/\s+/);
        if (!row.first_name) row.first_name = parts[0] ?? null;
        if (!row.last_name && parts.length > 1)
          row.last_name = parts.slice(1).join(" ");
      } else {
        row[field] = value.trim();
      }
    }
    if (!row.first_name && !row.last_name && !row.email) {
      skippedInvalid++;
      continue;
    }
    rows.push(row);
  }
  return { rows, skippedInvalid, matchedColumns: [...matched] };
}

type Parsed = {
  fileName: string;
  rows: ImportedContactRow[];
  skippedInvalid: number;
  matchedColumns: string[];
};

type Result = { inserted: number; skippedExisting: number };

export default function ImportContactsButton() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setParsed(null);
    setResult(null);
    setError(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  function close() {
    if (isPending) return;
    setOpen(false);
    reset();
  }

  function handleFile(file: File | undefined) {
    reset();
    if (!file) return;
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const { rows, skippedInvalid, matchedColumns } = parseRows(res.data);
        if (matchedColumns.length === 0) {
          setError(
            "No recognizable columns found. Use headers like first_name, last_name, email, phone, source, type, notes (or download the template below).",
          );
          return;
        }
        if (rows.length === 0) {
          setError(
            "No usable rows — every row needs at least a name or an email.",
          );
          return;
        }
        setParsed({ fileName: file.name, rows, skippedInvalid, matchedColumns });
      },
      error: (err) => setError(`Could not read the file: ${err.message}`),
    });
  }

  function handleImport() {
    if (!parsed) return;
    startTransition(async () => {
      const res = await importContacts(parsed.rows);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setError(null);
      setResult({ inserted: res.inserted, skippedExisting: res.skippedExisting });
      setParsed(null);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 border border-border text-sm font-semibold rounded-md hover:bg-surface-muted"
      >
        Import CSV
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Import contacts from CSV"
          onClick={close}
        >
          <div
            className="w-full max-w-md rounded-lg border border-border bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-text mb-1">
              Import contacts from CSV
            </h3>
            <p className="text-sm text-text-muted mb-4">
              Recognized columns: first_name, last_name (or a single name
              column), email, phone, source, type, date_of_birth, notes.
              Rows without a name or email are skipped; emails already in the
              CRM are skipped.
            </p>

            {error && (
              <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            {result ? (
              <>
                <div className="mb-4 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                  Imported {result.inserted} contact
                  {result.inserted === 1 ? "" : "s"}
                  {result.skippedExisting > 0 &&
                    ` — skipped ${result.skippedExisting} already in the CRM`}
                  .
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={close}
                    className="px-3 py-1.5 bg-brand-accent text-white text-sm font-semibold rounded-md hover:opacity-90"
                  >
                    Done
                  </button>
                </div>
              </>
            ) : (
              <>
                <input
                  ref={fileInput}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                  className="block w-full text-sm text-text-muted file:mr-3 file:px-3 file:py-1.5 file:border-0 file:rounded-md file:bg-brand-accent file:text-white file:text-sm file:font-semibold hover:file:opacity-90 mb-3"
                />

                <a
                  href={`data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE_CSV)}`}
                  download="contacts-template.csv"
                  className="text-xs text-brand-accent hover:underline"
                >
                  Download template CSV
                </a>

                {parsed && (
                  <div className="mt-4 rounded border border-border bg-surface-muted/50 p-3 text-sm">
                    <p className="font-medium text-text">{parsed.fileName}</p>
                    <p className="text-text-muted">
                      {parsed.rows.length} contact
                      {parsed.rows.length === 1 ? "" : "s"} ready to import
                      {parsed.skippedInvalid > 0 &&
                        ` (${parsed.skippedInvalid} row${
                          parsed.skippedInvalid === 1 ? "" : "s"
                        } skipped — no name or email)`}
                      .
                    </p>
                    <p className="text-text-muted text-xs mt-1">
                      Columns used: {parsed.matchedColumns.join(", ")}
                    </p>
                    <ul className="mt-2 text-xs text-text-muted list-disc pl-4">
                      {parsed.rows.slice(0, 5).map((r, i) => (
                        <li key={i}>
                          {[r.first_name, r.last_name].filter(Boolean).join(" ") ||
                            "(no name)"}
                          {r.email ? ` — ${r.email}` : ""}
                        </li>
                      ))}
                      {parsed.rows.length > 5 && (
                        <li>…and {parsed.rows.length - 5} more</li>
                      )}
                    </ul>
                  </div>
                )}

                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={close}
                    disabled={isPending}
                    className="px-3 py-1.5 text-sm text-text-muted hover:text-text disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={isPending || !parsed}
                    className="px-3 py-1.5 bg-brand-accent text-white text-sm font-semibold rounded-md hover:opacity-90 disabled:opacity-50"
                  >
                    {isPending
                      ? "Importing…"
                      : parsed
                        ? `Import ${parsed.rows.length} contact${
                            parsed.rows.length === 1 ? "" : "s"
                          }`
                        : "Import"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
