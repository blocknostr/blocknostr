
import { NostrEvent } from "@/lib/nostr";

export interface Community {
  id: string;
  name: string;
  description: string;
  image: string;
  creator: string;
  createdAt: number;
  members: string[];
  uniqueId: string;
  isPrivate?: boolean; // Indicates if this is a private community
  moderators?: string[]; // List of moderator pubkeys
  guidelines?: string; // Community guidelines
  tags?: string[]; // Tags for better discovery
  minJoinTime?: number; // Minimum time required for new members before they can propose/vote
}

export interface Proposal {
  id: string;
  communityId: string;
  title: string;
  description: string;
  options: string[];
  createdAt: number;
  endsAt: number;
  creator: string;
  votes: Record<string, number>;
  category?: string; // Categorize proposals (governance, feature, etc.)
  minQuorum?: number; // Minimum percentage of members required to vote for the proposal to be valid
}

export interface KickProposal {
  id: string;
  communityId: string;
  targetMember: string;
  votes: string[];
  createdAt: number;
  reason?: string; // Reason for kick proposal
}

export interface PendingVotes {
  [proposalId: string]: NostrEvent[];
}

export interface InviteLink {
  id: string;
  communityId: string;
  creatorPubkey: string;
  createdAt: number;
  expiresAt?: number;
  maxUses?: number;
  usedCount: number;
}

export interface MemberActivity {
  pubkey: string;
  joinedAt: number;
  lastActive: number; 
  proposalsCreated: number;
  votesParticipated: number;
}

export type MemberRole = 'creator' | 'moderator' | 'member';
export type ProposalCategory = 'governance' | 'feature' | 'poll' | 'other';

// Vote throttling settings interface
export interface ThrottleSettings {
  proposalsPerDay?: number; // Max proposals per member per day
  kicksPerWeek?: number; // Max kick proposals per member per week
}
