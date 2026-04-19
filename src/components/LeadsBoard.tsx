"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { STAGES, type Stage, updateLeadStage } from "@/app/leads/actions";

export interface BoardLead {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  stage: Stage;
  source: string;
  budget_max_cents: number | null;
  created_at: string;
  development_id: string;
  developments: { name: string; slug: string } | null;
}

export interface Development {
  id: string;
  slug: string;
  name: string;
}

const STAGE_LABELS: Record<Stage, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  showing: "Showing",
  offer: "Offer",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
};

function formatMoney(cents: number | null | undefined): string {
  if (!cents) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function LeadCard({ lead }: { lead: BoardLead }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: lead.id });

  const name =
    [lead.first_name, lead.last_name].filter(Boolean).join(" ") || "Unknown";

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-white border border-border rounded-md p-3 mb-2 shadow-sm cursor-grab active:cursor-grabbing text-sm ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <p className="font-semibold text-text">{name}</p>
      {lead.email && (
        <p className="text-text-muted text-xs truncate">{lead.email}</p>
      )}
      <div className="flex items-center justify-between mt-2 text-xs text-text-muted">
        <span>{lead.developments?.name ?? "—"}</span>
        {lead.budget_max_cents != null && (
          <span className="font-semibold text-text">
            {formatMoney(lead.budget_max_cents)}
          </span>
        )}
      </div>
    </div>
  );
}

function StageColumn({
  stage,
  leads,
}: {
  stage: Stage;
  leads: BoardLead[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const total = leads.reduce((sum, l) => sum + (l.budget_max_cents ?? 0), 0);

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-72 bg-surface-muted rounded-lg p-3 ${
        isOver ? "ring-2 ring-brand-accent" : ""
      }`}
    >
      <div className="mb-3">
        <h3 className="font-semibold text-text">{STAGE_LABELS[stage]}</h3>
        <p className="text-xs text-text-muted">
          {leads.length} Opportunit{leads.length === 1 ? "y" : "ies"} &bull;{" "}
          {formatMoney(total)}
        </p>
      </div>
      <div className="min-h-20">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
      </div>
    </div>
  );
}

export default function LeadsBoard({
  leads: initialLeads,
  developments,
  selectedDevelopment,
}: {
  leads: BoardLead[];
  developments: Development[];
  selectedDevelopment: string;
}) {
  const router = useRouter();
  const [leads, setLeads] = useState(initialLeads);
  const [, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const leadId = event.active.id as string;
    const overId = event.over?.id;
    if (!overId) return;
    const newStage = overId as Stage;

    const current = leads.find((l) => l.id === leadId);
    if (!current || current.stage === newStage) return;

    // Optimistic update
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, stage: newStage } : l)),
    );

    startTransition(async () => {
      try {
        await updateLeadStage(leadId, newStage);
      } catch {
        // Rollback on failure
        setLeads((prev) =>
          prev.map((l) =>
            l.id === leadId ? { ...l, stage: current.stage } : l,
          ),
        );
      }
    });
  }

  function handlePipelineChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const slug = e.target.value;
    const qs = slug === "all" ? "" : `?pipeline=${encodeURIComponent(slug)}`;
    router.push(`/leads${qs}`);
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <label className="text-sm text-text-muted font-medium">Pipeline:</label>
        <select
          value={selectedDevelopment}
          onChange={handlePipelineChange}
          className="border border-border rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent"
        >
          <option value="all">All Developments</option>
          {developments.map((d) => (
            <option key={d.id} value={d.slug}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <StageColumn
              key={stage}
              stage={stage}
              leads={leads.filter((l) => l.stage === stage)}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
