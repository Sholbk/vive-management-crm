import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { leadPayloadSchema } from "@/lib/leads/schema";
import { corsHeaders, resolveCorsOrigin } from "@/lib/leads/cors";
import { dispatchLeadNotifications } from "@/lib/notifications/dispatcher";
import type {
  LeadForNotification,
  LeadNotificationConfig,
} from "@/lib/notifications/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS(req: NextRequest) {
  const origin = resolveCorsOrigin(req.headers.get("origin"));
  if (!origin) {
    return new NextResponse(null, { status: 403 });
  }
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST(req: NextRequest) {
  const origin = resolveCorsOrigin(req.headers.get("origin"));
  if (!origin) {
    return NextResponse.json(
      { error: "origin_not_allowed" },
      { status: 403 },
    );
  }
  const headers = corsHeaders(origin);

  // 1. Parse + validate
  let parsed;
  try {
    const body = await req.json();
    parsed = leadPayloadSchema.safeParse(body);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400, headers });
  }
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_payload", issues: parsed.error.issues },
      { status: 400, headers },
    );
  }
  const payload = parsed.data;

  // Turnstile verification will be added in a later step.

  const supabase = createSupabaseServiceClient();

  // 2. Resolve development_id from slug
  const { data: dev, error: devErr } = await supabase
    .from("developments")
    .select("id, name, slug, active, lead_notification_channels")
    .eq("slug", payload.developmentSlug)
    .maybeSingle();

  if (devErr) {
    console.error("Development lookup failed", devErr);
    return NextResponse.json({ error: "server_error" }, { status: 500, headers });
  }
  if (!dev || !dev.active) {
    return NextResponse.json(
      { error: "unknown_development" },
      { status: 400, headers },
    );
  }

  // 3. Resolve lot_id if lotExternalId provided
  let lotId: string | null = null;
  let lotTitle: string | null = null;
  if (payload.lotExternalId) {
    const { data: lot, error: lotErr } = await supabase
      .from("lots")
      .select("id, title")
      .eq("development_id", dev.id)
      .eq("external_id", payload.lotExternalId)
      .maybeSingle();
    if (lotErr) {
      console.error("Lot lookup failed", lotErr);
    } else if (lot) {
      lotId = lot.id;
      lotTitle = lot.title;
    }
  }

  // 4. Light duplicate guard: same email + development in last 24h
  let duplicateOf: string | null = null;
  if (payload.email) {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existing } = await supabase
      .from("leads")
      .select("id")
      .eq("development_id", dev.id)
      .ilike("email", payload.email)
      .gte("created_at", oneDayAgo)
      .limit(1)
      .maybeSingle();
    if (existing) {
      duplicateOf = existing.id;
    }
  }

  // 5. Insert lead
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null;
  const userAgent = req.headers.get("user-agent");

  const insertRow = {
    development_id: dev.id,
    lot_id: lotId,
    first_name: payload.firstName,
    last_name: payload.lastName || null,
    email: payload.email,
    phone: payload.phone ?? null,
    message: payload.message ?? null,
    budget_min_cents: payload.budgetMinCents ?? null,
    budget_max_cents: payload.budgetMaxCents ?? null,
    timeline: payload.timeline ?? null,
    financing: payload.financing ?? null,
    source: payload.source,
    utm_source: payload.utm?.source ?? null,
    utm_medium: payload.utm?.medium ?? null,
    utm_campaign: payload.utm?.campaign ?? null,
    utm_term: payload.utm?.term ?? null,
    utm_content: payload.utm?.content ?? null,
    referrer_url: payload.referrerUrl ?? null,
    landing_page: payload.landingPage ?? null,
    status: duplicateOf ? "duplicate" : "open",
    raw_payload: payload as unknown as Record<string, unknown>,
    ip_address: ip,
    user_agent: userAgent,
  };

  const { data: lead, error: insertErr } = await supabase
    .from("leads")
    .insert(insertRow)
    .select("id, created_at")
    .single();

  if (insertErr || !lead) {
    console.error("Lead insert failed", insertErr);
    return NextResponse.json({ error: "server_error" }, { status: 500, headers });
  }

  // 6. Fire-and-forget notifications (do not block response longer than necessary)
  if (!duplicateOf) {
    const notificationLead: LeadForNotification = {
      id: lead.id,
      development_id: dev.id,
      development_name: dev.name,
      development_slug: dev.slug,
      lot_external_id: payload.lotExternalId ?? null,
      lot_title: lotTitle,
      first_name: payload.firstName,
      last_name: payload.lastName || null,
      email: payload.email,
      phone: payload.phone ?? null,
      message: payload.message ?? null,
      source: payload.source,
      utm_source: payload.utm?.source ?? null,
      utm_campaign: payload.utm?.campaign ?? null,
      created_at: lead.created_at,
    };
    const config: LeadNotificationConfig =
      (dev.lead_notification_channels as LeadNotificationConfig) ?? {};

    // Await briefly so logs land; Netlify background functions will be introduced
    // in a later step once volume or provider latency demands it.
    await dispatchLeadNotifications(notificationLead, config).catch((err) => {
      console.error("Notification dispatch failed", err);
    });
  }

  return NextResponse.json(
    { ok: true, id: lead.id, duplicate: Boolean(duplicateOf) },
    { status: 201, headers },
  );
}
