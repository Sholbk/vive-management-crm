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

## Security boundaries

- **RLS is the real security model.** Every table is RLS-enabled. Never disable.
- **Service-role client** in `src/lib/supabase/service.ts` bypasses RLS. Only imported by API routes and notification dispatchers. An ESLint rule blocks imports from `src/app/(app)/**`.
- **Marketing role** reads the `leads_marketing_aggregate` view (PII-stripped), not the `leads` table directly.
