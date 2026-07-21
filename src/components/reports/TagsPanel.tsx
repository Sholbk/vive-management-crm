"use client";

import { useState } from "react";
import type { SourceRow } from "@/lib/reports/queries";

type SortMode = "count_desc" | "count_asc" | "alpha";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "count_desc", label: "Most leads" },
  { value: "count_asc", label: "Fewest leads" },
  { value: "alpha", label: "A–Z" },
];

function sortRows(rows: SourceRow[], mode: SortMode): SourceRow[] {
  const sorted = [...rows];
  switch (mode) {
    case "count_desc":
      sorted.sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
      break;
    case "count_asc":
      sorted.sort((a, b) => a.count - b.count || a.key.localeCompare(b.key));
      break;
    case "alpha":
      sorted.sort((a, b) => a.key.localeCompare(b.key));
      break;
  }
  return sorted;
}

export default function TagsPanel({
  byTag,
  untaggedCount,
  total,
}: {
  byTag: SourceRow[];
  untaggedCount: number;
  total: number;
}) {
  const [sort, setSort] = useState<SortMode>("count_desc");
  const rows = sortRows(byTag, sort);

  return (
    <section className="bg-white border border-border rounded-lg p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold">Leads by Tag</h3>
        {byTag.length > 1 && (
          <label className="flex items-center gap-2 text-sm text-text-muted">
            Sort:
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortMode)}
              className="border border-border rounded-md px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {byTag.length === 0 ? (
        <p className="text-sm text-text-muted">
          No tagged leads in this range. Add tags on an opportunity&apos;s
          detail page to see them here.
        </p>
      ) : (
        <>
          {rows.map((row) => {
            const pct = total > 0 ? (row.count / total) * 100 : 0;
            return (
              <div className="mb-2" key={row.key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text">{row.key}</span>
                  <span className="text-text-muted">{row.count}</span>
                </div>
                <div className="h-2 bg-surface-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-accent rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
          {untaggedCount > 0 && (
            <p className="mt-3 text-xs text-text-muted">
              {untaggedCount} lead{untaggedCount === 1 ? " has" : "s have"} no
              tags.
            </p>
          )}
        </>
      )}
    </section>
  );
}
