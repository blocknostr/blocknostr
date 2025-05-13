// Add missing QuickReply type

export interface ZapInfo {
  amount: number;
  sender?: string;
  recipient: string;
  comment?: string;
  eventId?: string;
}

export interface QuickReply {
  id: string;
  content: string;
  category: string;
  createdAt: number;
}
