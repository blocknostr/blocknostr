
import { NostrEvent } from "@/lib/nostr";

export interface Message {
  id: string;
  content: string;
  sender: string;
  recipient: string;
  created_at: number;
}

export interface Contact {
  pubkey: string;
  profile?: {
    name?: string;
    display_name?: string;
    picture?: string;
    nip05?: string;
  };
  lastMessage?: string;
  lastMessageTime?: number;
}
