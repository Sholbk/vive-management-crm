import "server-only";
import type { ChannelResult, LeadForNotification } from "../types";

export async function postLeadToN8n(
  lead: LeadForNotification,
  webhookUrl: string,
): Promise<ChannelResult[]> {
  if (!webhookUrl) return [];

  const payload = {
    event: "lead.created",
    sent_at: new Date().toISOString(),
    lead,
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.N8N_WEBHOOK_SECRET
          ? { "X-Webhook-Secret": process.env.N8N_WEBHOOK_SECRET }
          : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return [
        {
          channel: "n8n_webhook",
          recipient: webhookUrl,
          status: "failed",
          error: `HTTP ${res.status}${text ? `: ${text.slice(0, 200)}` : ""}`,
        },
      ];
    }

    return [
      {
        channel: "n8n_webhook",
        recipient: webhookUrl,
        status: "sent",
      },
    ];
  } catch (err) {
    return [
      {
        channel: "n8n_webhook",
        recipient: webhookUrl,
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
      },
    ];
  }
}
