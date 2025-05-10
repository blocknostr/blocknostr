
import { NostrEvent } from "@/lib/nostr";

export type NotificationType = "mention" | "reply" | "like" | "repost" | "interaction";

export interface NotificationData {
  id: string;
  pubkey: string;
  createdAt: number;
  content: string;
  eventReference?: string;
}

export interface EnhancedNotification extends NostrEvent {
  notificationType: NotificationType;
}

export interface NotificationItemProps {
  notification: NostrEvent;
  profileData?: Record<string, any>;
  type?: NotificationType;
}
