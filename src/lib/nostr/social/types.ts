
import { NostrEvent } from "../types";

/**
 * Social interaction types for Nostr-compliant social features
 */

// NIP-25 Reaction types
export interface ReactionEvent {
  eventId: string;
  reaction: string;
  pubkey: string;
  createdAt: number;
}

// NIP-01 Text Note types
export interface TextNoteOptions {
  content: string;
  tags?: string[][];
  createdAt?: number;
  kind?: number;
}

// NIP-10 Reply types
export interface ReplyOptions {
  rootId?: string;
  replyId: string;
  content: string;
  mentions?: string[];
}

// NIP-02 Contact list types
export interface ContactListItem {
  pubkey: string;
  relay?: string;
  petname?: string;
}

// NIP-36 Content Warning types
export type ContentWarningType = 
  | "nudity" 
  | "sexual" 
  | "gore" 
  | "self-harm" 
  | "violence" 
  | string;

/**
 * Interface for event validation results
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface EventValidation {
  compliant: boolean;
  results: Record<string, ValidationResult>;
}
