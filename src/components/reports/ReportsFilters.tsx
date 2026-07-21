"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Range } from "@/lib/reports/queries";

const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "all", label: "All time" },
];

interface Props {
  range: Range;
  ownerId: string | null;
  developmentId: string | null;
  from: string | null;
  to: string | null;
  selectedTags: string[];
  tagOptions: string[];
  agents: { id: string; label: string }[];
  developments: { id: string; name: string }[];
}

interface FilterState {
  range: Range;
  ownerId: string | null;
  developmentId: string | null;
  from: string | null;
  to: string | null;
  tags: string[];
}

function buildHref(p: FilterState) {
  const sp = new URLSearchParams();
  const custom = Boolean(p.from || p.to);
  if (!custom && p.range !== "all") sp.set("range", p.range);
  if (p.from) sp.set("from", p.from);
  if (p.to) sp.set("to", p.to);
  if (p.ownerId) sp.set("owner", p.ownerId);
  if (p.developmentId) sp.set("development", p.developmentId);
  if (p.tags.length > 0) sp.set("tags", p.tags.join(","));
  const q = sp.toString();
  return q ? `/reports?${q}` : "/reports";
}

export default function ReportsFilters({
  range,
  ownerId,
  developmentId,
  from,
  to,
  selectedTags,
  tagOptions,
  agents,
  developments,
}: Props) {
  const router = useRouter();
  const isCustom = Boolean(from || to);
  const [customOpen, setCustomOpen] = useState(isCustom);
  const [tagsOpen, setTagsOpen] = useState(false);
  const tagsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tagsOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (tagsRef.current && !tagsRef.current.contains(e.target as Node)) {
        setTagsOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [tagsOpen]);

  const current: FilterState = {
    range,
    ownerId,
    developmentId,
    from,
    to,
    tags: selectedTags,
  };

  const push = (next: Partial<FilterState>) =>
    router.push(buildHref({ ...current, ...next }));

  const toggleTag = (tag: string) => {
    const key = tag.toLowerCase();
    const has = selectedTags.some((t) => t.toLowerCase() === key);
    push({
      tags: has
        ? selectedTags.filter((t) => t.toLowerCase() !== key)
        : [...selectedTags, tag],
    });
  };

  const selectCls =
    "text-sm px-3 py-1.5 border border-border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent";

  return (
    <div className="mb-6 pb-4 border-b border-border">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-text-muted">Salesperson:</span>
          <select
            value={ownerId ?? ""}
            onChange={(e) => push({ ownerId: e.target.value || null })}
            className={selectCls}
          >
            <option value="">All</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <span className="text-text-muted">Development:</span>
          <select
            value={developmentId ?? ""}
            onChange={(e) => push({ developmentId: e.target.value || null })}
            className={selectCls}
          >
            <option value="">All</option>
            {developments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>

        <div className="relative text-sm" ref={tagsRef}>
          <button
            type="button"
            onClick={() => setTagsOpen((v) => !v)}
            className={`${selectCls} ${
              selectedTags.length > 0 ? "border-brand-accent text-brand-accent font-semibold" : ""
            }`}
          >
            Tags:{" "}
            {selectedTags.length === 0 ? "All" : `${selectedTags.length} selected`}{" "}
            ▾
          </button>
          {tagsOpen && (
            <div className="absolute z-30 mt-1 w-56 max-h-64 overflow-y-auto rounded-md border border-border bg-white p-2 shadow-lg">
              {tagOptions.length === 0 ? (
                <p className="px-2 py-1 text-text-muted text-xs">
                  No tags yet — add tags on an opportunity&apos;s detail page.
                </p>
              ) : (
                <>
                  {selectedTags.length > 0 && (
                    <button
                      type="button"
                      onClick={() => push({ tags: [] })}
                      className="w-full text-left px-2 py-1 rounded text-xs text-brand-accent hover:bg-surface-muted"
                    >
                      Clear tags
                    </button>
                  )}
                  {tagOptions.map((tag) => {
                    const checked = selectedTags.some(
                      (t) => t.toLowerCase() === tag.toLowerCase(),
                    );
                    return (
                      <label
                        key={tag}
                        className="flex items-center gap-2 px-2 py-1 rounded hover:bg-surface-muted cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleTag(tag)}
                          className="accent-brand-accent"
                        />
                        <span className="truncate">{tag}</span>
                      </label>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 ml-auto text-sm">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setCustomOpen(false);
                push({ range: opt.value, from: null, to: null });
              }}
              className={`px-3 py-1 rounded-md ${
                !isCustom && range === opt.value
                  ? "bg-brand-accent text-white"
                  : "text-text-muted hover:text-text"
              }`}
            >
              {opt.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCustomOpen(true)}
            className={`px-3 py-1 rounded-md ${
              isCustom || customOpen
                ? "bg-brand-accent text-white"
                : "text-text-muted hover:text-text"
            }`}
          >
            Custom
          </button>
        </div>
      </div>

      {(customOpen || isCustom) && (
        <div className="flex flex-wrap items-center gap-3 mt-3 justify-end text-sm">
          <label className="flex items-center gap-2">
            <span className="text-text-muted">From:</span>
            <input
              type="date"
              value={from ?? ""}
              max={to ?? undefined}
              onChange={(e) => push({ from: e.target.value || null })}
              className={selectCls}
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="text-text-muted">To:</span>
            <input
              type="date"
              value={to ?? ""}
              min={from ?? undefined}
              onChange={(e) => push({ to: e.target.value || null })}
              className={selectCls}
            />
          </label>
        </div>
      )}
    </div>
  );
}
