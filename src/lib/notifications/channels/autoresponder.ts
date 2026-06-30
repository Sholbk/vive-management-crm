import "server-only";
import { getResend, getFromAddress, getReplyTo } from "../resend-client";
import type { ChannelResult, LeadForNotification } from "../types";

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function firstName(lead: LeadForNotification): string {
  return (lead.first_name ?? "").trim();
}

function ackSubject(lead: LeadForNotification): string {
  return `Thanks for your interest in ${lead.development_name}`;
}

function ackHtml(lead: LeadForNotification): string {
  const hi = firstName(lead) ? `Hi ${escape(firstName(lead))},` : "Hi,";
  const lot = lead.lot_title ? ` about <strong>${escape(lead.lot_title)}</strong>` : "";
  return `
    <div style="max-width:560px;margin:0 auto;padding:24px;font-family:sans-serif;color:#1a1a1a;line-height:1.55;">
      <p style="font-size:16px;">${hi}</p>
      <p style="font-size:15px;">
        Thank you for reaching out about <strong>${escape(lead.development_name)}</strong>${lot}.
        We've received your inquiry and a member of our team will be in touch with you shortly.
      </p>
      <p style="font-size:15px;">
        If you have anything to add in the meantime, just reply to this email and it will
        come straight to us.
      </p>
      <p style="font-size:15px;margin-top:24px;">Warm regards,<br/>The Vive Real Estate Team</p>
      <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0;" />
      <p style="font-size:12px;color:#888;">
        You're receiving this because you submitted an inquiry on our website.
      </p>
    </div>
  `;
}

function ackText(lead: LeadForNotification): string {
  const hi = firstName(lead) ? `Hi ${firstName(lead)},` : "Hi,";
  const lot = lead.lot_title ? ` about ${lead.lot_title}` : "";
  return [
    hi,
    "",
    `Thank you for reaching out about ${lead.development_name}${lot}. We've received your inquiry and a member of our team will be in touch with you shortly.`,
    "",
    "If you have anything to add in the meantime, just reply to this email and it will come straight to us.",
    "",
    "Warm regards,",
    "The Vive Real Estate Team",
  ].join("\n");
}

/**
 * Instant acknowledgment sent to the lead themselves. Longer drip / nurture
 * sequences live in N8N — this is only the immediate "we got it" reply.
 * `teamFallback` seeds the Reply-To when RESEND_REPLY_TO is unset.
 */
export async function sendLeadAcknowledgment(
  lead: LeadForNotification,
  teamFallback?: string | null,
): Promise<ChannelResult[]> {
  if (!lead.email) return [];

  let resend: ReturnType<typeof getResend>;
  let from: string;
  try {
    resend = getResend();
    from = getFromAddress();
  } catch (err) {
    return [
      {
        channel: "email",
        recipient: lead.email,
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
      },
    ];
  }

  const replyTo = getReplyTo(teamFallback);

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: lead.email,
      subject: ackSubject(lead),
      html: ackHtml(lead),
      text: ackText(lead),
      ...(replyTo ? { replyTo } : {}),
    });
    if (error) {
      return [{ channel: "email", recipient: lead.email, status: "failed", error: error.message }];
    }
    return [
      { channel: "email", recipient: lead.email, status: "sent", provider_message_id: data?.id },
    ];
  } catch (err) {
    return [
      {
        channel: "email",
        recipient: lead.email,
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
      },
    ];
  }
}
