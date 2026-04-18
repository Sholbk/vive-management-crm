import "server-only";
import { Resend } from "resend";
import type { ChannelResult, LeadForNotification } from "../types";

let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("Missing RESEND_API_KEY");
    resendClient = new Resend(key);
  }
  return resendClient;
}

function formatSubject(lead: LeadForNotification): string {
  const name = [lead.first_name, lead.last_name].filter(Boolean).join(" ").trim() || "Unknown";
  return `New lead: ${name} — ${lead.development_name}`;
}

function formatHtml(lead: LeadForNotification, crmUrl: string): string {
  const rows: [string, string | null][] = [
    ["Development", lead.development_name],
    ["Lot", lead.lot_title ?? lead.lot_external_id ?? "—"],
    ["Name", [lead.first_name, lead.last_name].filter(Boolean).join(" ") || "—"],
    ["Email", lead.email ?? "—"],
    ["Phone", lead.phone ?? "—"],
    ["Source", lead.source],
    ["UTM Source", lead.utm_source ?? "—"],
    ["UTM Campaign", lead.utm_campaign ?? "—"],
  ];
  const body = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#666;font-family:sans-serif;font-size:14px;">${label}</td><td style="padding:6px 0;font-family:sans-serif;font-size:14px;">${escape(value ?? "—")}</td></tr>`,
    )
    .join("");
  const message = lead.message
    ? `<p style="font-family:sans-serif;font-size:14px;margin-top:16px;"><strong>Message</strong><br/>${escape(lead.message).replace(/\n/g, "<br/>")}</p>`
    : "";
  return `
    <div style="max-width:560px;margin:0 auto;padding:24px;">
      <h2 style="font-family:sans-serif;">New lead — ${escape(lead.development_name)}</h2>
      <table style="border-collapse:collapse;">${body}</table>
      ${message}
      <p style="font-family:sans-serif;font-size:14px;margin-top:24px;">
        <a href="${crmUrl}/leads/${lead.id}">Open in CRM →</a>
      </p>
    </div>
  `;
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendLeadEmails(
  lead: LeadForNotification,
  recipients: string[],
): Promise<ChannelResult[]> {
  if (recipients.length === 0) return [];

  const from = process.env.RESEND_FROM_EMAIL;
  const crmUrl = process.env.NEXT_PUBLIC_CRM_URL ?? "";
  if (!from) {
    return recipients.map((r) => ({
      channel: "email" as const,
      recipient: r,
      status: "failed" as const,
      error: "Missing RESEND_FROM_EMAIL",
    }));
  }

  const resend = getResend();
  const subject = formatSubject(lead);
  const html = formatHtml(lead, crmUrl);

  const results = await Promise.all(
    recipients.map(async (to): Promise<ChannelResult> => {
      try {
        const { data, error } = await resend.emails.send({
          from,
          to,
          subject,
          html,
        });
        if (error) {
          return {
            channel: "email",
            recipient: to,
            status: "failed",
            error: error.message,
          };
        }
        return {
          channel: "email",
          recipient: to,
          status: "sent",
          provider_message_id: data?.id,
        };
      } catch (err) {
        return {
          channel: "email",
          recipient: to,
          status: "failed",
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }),
  );

  return results;
}
