import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { sendLeadEmails } from "./channels/email";
import type {
  ChannelResult,
  LeadForNotification,
  LeadNotificationConfig,
} from "./types";

// SMS / Slack / WhatsApp channel imports to be added in later steps.

export async function dispatchLeadNotifications(
  lead: LeadForNotification,
  config: LeadNotificationConfig,
): Promise<ChannelResult[]> {
  const tasks: Promise<ChannelResult[]>[] = [];

  if (config.emails && config.emails.length > 0) {
    tasks.push(sendLeadEmails(lead, config.emails));
  }

  // Each settled promise returns an array; other channels wired in later steps:
  //   if (config.sms) tasks.push(sendLeadSms(lead, config.sms));
  //   if (config.slack_webhook) tasks.push(postLeadToSlack(lead, config.slack_webhook));
  //   if (config.whatsapp) tasks.push(sendLeadWhatsapp(lead, config.whatsapp));

  const settled = await Promise.allSettled(tasks);
  const results: ChannelResult[] = settled.flatMap((s) =>
    s.status === "fulfilled"
      ? s.value
      : [
          {
            channel: "email",
            recipient: "unknown",
            status: "failed",
            error: s.reason instanceof Error ? s.reason.message : String(s.reason),
          } as ChannelResult,
        ],
  );

  await persistNotificationLog(lead.id, results);

  return results;
}

async function persistNotificationLog(
  leadId: string,
  results: ChannelResult[],
): Promise<void> {
  if (results.length === 0) return;

  const supabase = createSupabaseServiceClient();
  const rows = results.map((r) => ({
    lead_id: leadId,
    channel: r.channel,
    recipient: r.recipient,
    status: r.status,
    error: r.error ?? null,
    provider_message_id: r.provider_message_id ?? null,
    sent_at: r.status === "sent" ? new Date().toISOString() : null,
  }));

  const { error } = await supabase.from("notification_log").insert(rows);
  if (error) {
    console.error("Failed to persist notification_log", error);
  }
}
