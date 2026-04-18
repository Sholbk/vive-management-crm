export type NotificationChannel = "email" | "sms" | "slack" | "whatsapp";

export interface LeadNotificationConfig {
  emails?: string[];
  sms?: string[];
  whatsapp?: string[];
  slack_webhook?: string;
}

export interface LeadForNotification {
  id: string;
  development_id: string;
  development_name: string;
  development_slug: string;
  lot_external_id: string | null;
  lot_title: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  source: string;
  utm_source: string | null;
  utm_campaign: string | null;
  created_at: string;
}

export interface ChannelResult {
  channel: NotificationChannel;
  recipient: string;
  status: "sent" | "failed";
  error?: string;
  provider_message_id?: string;
}
