# Vive CRM — Supabase Auth email templates

Branded HTML for the Supabase Auth transactional emails (project `lrevlofzivhpocuktbna`).
Palette: navy `#1a437b`, orange `#ef6c26`, white `#fefefe`. Logo loads from
`https://management.viverealestate.mx/vive-management-logo.png` (email clients can't use
data URIs reliably, so it must stay a hosted URL). System font stack — Gmail strips webfonts.

These live in **Supabase → Authentication → Email Templates**, not in the app runtime.
This folder is the source of record so they're version-controlled.

## Templates

| Dashboard tab | File | Subject |
|---|---|---|
| Confirm signup | `confirmation.html` | Confirm your email address |
| Invite user | `invite.html` | You've been invited to the Vive Real Estate CRM |
| Magic Link | `magic_link.html` | Your Vive CRM sign-in link |
| Reset Password | `recovery.html` | Reset your Vive CRM password |
| Change Email Address | `email_change.html` | Confirm your new email address |

## Applying / updating

All five (subjects + bodies) are set in one Management API call. The assembled payload is
kept at `~/vive-auth-templates.json` (regenerate it from these files if you edit them):

```bash
curl -X PATCH "https://api.supabase.com/v1/projects/lrevlofzivhpocuktbna/config/auth" \
  -H "Authorization: Bearer sbp_YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  --data @~/vive-auth-templates.json
```

`PATCH` is partial — it only touches the mailer fields, not SMTP or URL config.
All buttons link to `{{ .ConfirmationURL }}`; the app's `/auth/callback` handles the
resulting hash/token_hash/code (see `src/app/auth/callback/page.tsx`).
