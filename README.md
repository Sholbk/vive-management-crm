# Real Estate CRM

Central CRM receiving leads from 3 housing-development marketing sites. Phase 1: sales CRM. Phase 2 (later): property management (tenants, leases, maintenance).

## Stack

- Next.js 16, React 19, Tailwind 4, TypeScript
- Supabase (Postgres + Auth + RLS)
- Resend (email), Twilio (SMS + WhatsApp — later), Slack webhooks (later)
- Netlify

## Setup

1. Create a Supabase project. Run `supabase/migrations/0001_init.sql`.
2. Seed at least one row in `developments` (slug must match the marketing site's `developmentSlug`).
3. Copy `.env.example` → `.env.local`, fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_CRM_URL` (e.g. `http://localhost:3000` locally)
   - `LEAD_INTAKE_ALLOWED_ORIGINS` (comma-separated origins of marketing sites)
   - `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
   - `TURNSTILE_SECRET_KEY` (optional — leave unset to skip Turnstile
     verification on `/api/leads`; set it once the marketing sites render the
     widget and send real tokens)
4. Per-development notification recipients live in `developments.lead_notification_channels` (JSON), e.g.:

   ```json
   {
     "emails": ["sales@company.com"],
     "slack_webhook": null,
     "sms": [],
     "whatsapp": []
   }
   ```

5. `npm install && npm run dev`.

## Intake endpoint

`POST /api/leads` — called by marketing sites. CORS-locked to `LEAD_INTAKE_ALLOWED_ORIGINS`.

Payload shape is the Zod schema in `src/lib/leads/schema.ts`.

Abuse protection:

- **Rate limiting** (always on): 8 requests / 10 min per IP + 100 requests /
  hour globally, counted in the `api_rate_limits` table
  (`consume_rate_limit()` Postgres function, migration `0011`). Returns
  `429 rate_limited`. Fails open if the counter itself errors.
- **Cloudflare Turnstile** (on when `TURNSTILE_SECRET_KEY` is set): the
  payload's `turnstileToken` is verified against Cloudflare siteverify;
  failures return `403 turnstile_failed`. The marketing site renders the
  widget when `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set (same Cloudflare
  widget, two keys).

## Security boundaries

- **RLS is the real security model.** Every table is RLS-enabled. Never disable.
- **Service-role client** in `src/lib/supabase/service.ts` bypasses RLS. Only imported by API routes and notification dispatchers. An ESLint rule blocks imports from `src/app/(app)/**`.
- **Marketing role** reads the `leads_marketing_aggregate` view (PII-stripped), not the `leads` table directly.
