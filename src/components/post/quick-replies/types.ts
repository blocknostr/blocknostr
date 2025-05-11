
import { QuickReply } from '@/lib/nostr/social/types';

export interface QuickRepliesProps {
  onReplySelected: (text: string) => void;
}

export interface QuickReplyItemProps {
  reply: QuickReply;
  onSelect: (text: string) => void;
  onDelete?: (id: string) => void;
}

export interface AddReplyDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddReply: (text: string, category: QuickReply['category']) => void;
}

export interface SuggestedRepliesProps {
  suggestions: string[];
  onSelect: (text: string) => void;
}

export interface CategoryTabProps {
  replies: QuickReply[];
  category?: QuickReply['category'];
  onSelect: (text: string) => void;
  onDelete?: (id: string) => void;
}
