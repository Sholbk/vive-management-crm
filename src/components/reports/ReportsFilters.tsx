"use client";

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
  agents: { id: string; label: string }[];
  developments: { id: string; name: string }[];
}

function buildHref(params: {
  range: Range;
  ownerId: string | null;
  developmentId: string | null;
}) {
  const sp = new URLSearchParams();
  if (params.range !== "all") sp.set("range", params.range);
  if (params.ownerId) sp.set("owner", params.ownerId);
  if (params.developmentId) sp.set("development", params.developmentId);
  const q = sp.toString();
  return q ? `/reports?${q}` : "/reports";
}

export default function ReportsFilters({
  range,
  ownerId,
  developmentId,
  agents,
  developments,
}: Props) {
  const router = useRouter();

  const push = (next: {
    range?: Range;
    ownerId?: string | null;
    developmentId?: string | null;
  }) => {
    router.push(
      buildHref({
        range: next.range ?? range,
        ownerId: next.ownerId !== undefined ? next.ownerId : ownerId,
        developmentId:
          next.developmentId !== undefined
            ? next.developmentId
            : developmentId,
      }),
    );
  };

  const selectCls =
    "text-sm px-3 py-1.5 border border-border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent";

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-border">
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

      <div className="flex items-center gap-1 ml-auto text-sm">
        {RANGE_OPTIONS.map((opt) => (
          <a
            key={opt.value}
            href={buildHref({ range: opt.value, ownerId, developmentId })}
            className={`px-3 py-1 rounded-md ${
              range === opt.value
                ? "bg-brand-accent text-white"
                : "text-text-muted hover:text-text"
            }`}
          >
            {opt.label}
          </a>
        ))}
      </div>
    </div>
  );
}
