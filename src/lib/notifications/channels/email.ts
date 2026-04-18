import "server-only";
import sgMail from "@sendgrid/mail";
import type { ChannelResult, LeadForNotification } from "../types";

let configured = false;

function configureSendgrid(): void {
  if (configured) return;
  const key = process.env.SENDGRID_API_KEY;
  if (!key) throw new Error("Missing SENDGRID_API_KEY");
  sgMail.setApiKey(key);
  configured = true;
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

function formatText(lead: LeadForNotification, crmUrl: string): string {
  const name = [lead.first_name, lead.last_name].filter(Boolean).join(" ").trim() || "Unknown";
  const lines = [
    `New lead — ${lead.development_name}`,
    "",
    `Name: ${name}`,
    `Email: ${lead.email ?? "—"}`,
    `Phone: ${lead.phone ?? "—"}`,
    `Lot: ${lead.lot_title ?? lead.lot_external_id ?? "—"}`,
    `Source: ${lead.source}`,
    `UTM Source: ${lead.utm_source ?? "—"}`,
    `UTM Campaign: ${lead.utm_campaign ?? "—"}`,
  ];
  if (lead.message) {
    lines.push("", "Message:", lead.message);
  }
  lines.push("", `Open in CRM: ${crmUrl}/leads/${lead.id}`);
  return lines.join("\n");
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

  const from = process.env.SENDGRID_FROM_EMAIL;
  const crmUrl = process.env.NEXT_PUBLIC_CRM_URL ?? "";
  if (!from) {
    return recipients.map((r) => ({
      channel: "email" as const,
      recipient: r,
      status: "failed" as const,
      error: "Missing SENDGRID_FROM_EMAIL",
    }));
  }

  try {
    configureSendgrid();
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return recipients.map((r) => ({
      channel: "email" as const,
      recipient: r,
      status: "failed" as const,
      error,
    }));
  }

  const subject = formatSubject(lead);
  const html = formatHtml(lead, crmUrl);
  const text = formatText(lead, crmUrl);

  const results = await Promise.all(
    recipients.map(async (to): Promise<ChannelResult> => {
      try {
        const [response] = await sgMail.send({
          from,
          to,
          subject,
          html,
          text,
        });
        return {
          channel: "email",
          recipient: to,
          status: "sent",
          provider_message_id: response.headers["x-message-id"] as string | undefined,
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
