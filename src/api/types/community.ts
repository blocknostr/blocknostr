import { NostrEvent } from "@/lib/nostr";

// Community-focused types (abstraction layer over DAO types)
// This provides a clean, universal interface while maintaining backward compatibility

export interface Community {
  id: string;
  name: string;
  description: string;
  image: string;
  creator: string;
  createdAt: number;
  members: string[];
  moderators: string[];
  bannedMembers: string[];
  guidelines?: string;
  isPrivate?: boolean;
  treasury: {
    balance: number;
    tokenSymbol: string;
  };
  proposalCount: number; // Renamed from 'proposals'
  activeProposalCount: number; // Renamed from 'activeProposals'
  tags: string[];
}

export interface CommunityProposal {
  id: string;
  communityId: string; // Renamed from 'daoId'
  title: string;
  description: string;
  options: string[];
  createdAt: number;
  endsAt: number;
  creator: string;
  votes: Record<string, number>;
  status: "active" | "passed" | "rejected" | "canceled";
}

export interface CommunityMember {
  pubkey: string;
  joinedAt: number;
  role: 'creator' | 'moderator' | 'member';
  communityId: string;
}

export interface CommunityInvite {
  id: string;
  communityId: string;
  creatorPubkey: string;
  createdAt: number;
  expiresAt?: number;
  maxUses?: number;
  usedCount: number;
}

// Redux-compatible community types
export interface ReduxCommunity {
  id: string;
  name: string;
  description: string;
  image: string;
  creator: string;
  createdAt: number;
  members: string[];
  moderators: string[];
  bannedMembers: string[];
  guidelines?: string;
  isPrivate?: boolean;
  treasury: {
    balance: number;
    tokenSymbol: string;
  };
  proposalCount: number;
  activeProposalCount: number;
  tags: string[];
  // Redux-specific metadata
  _meta: {
    cached_at: number;
    member_count: number;
    user_is_member: boolean;
    user_is_moderator: boolean;
    user_is_creator: boolean;
    last_activity?: number;
    trending_score?: number;
  };
}

export interface ReduxCommunityProposal {
  id: string;
  communityId: string;
  title: string;
  description: string;
  options: string[];
  createdAt: number;
  endsAt: number;
  creator: string;
  votes: number[];
  status: "active" | "passed" | "rejected" | "canceled";
  // Redux-specific metadata
  _meta: {
    cached_at: number;
    vote_count: number;
    user_voted: boolean;
    user_vote_option?: number | null;
    time_remaining: number;
    participation_rate: number;
    is_kick_proposal: boolean;
    target_member?: string;
  };
}

// Type adapters for backward compatibility
export interface CommunityAdapter {
  // Convert DAO types to Community types
  fromDAO: (dao: any) => Community;
  toDAO: (community: Community) => any;
  
  // Convert DAO proposal types to Community proposal types
  fromDAOProposal: (proposal: any) => CommunityProposal;
  toDAOProposal: (proposal: CommunityProposal) => any;
}

// Search and discovery types
export interface CommunitySearchFilters {
  query?: string;
  categories?: string[];
  tags?: string[];
  minMembers?: number;
  maxMembers?: number;
  isPrivate?: boolean;
  sortBy?: 'newest' | 'members' | 'activity' | 'alphabetical';
  sortOrder?: 'asc' | 'desc';
  hasRecentActivity?: boolean;
}

export interface CommunitySearchResult extends Community {
  matchScore: number;
  excerpt?: string;
}

export interface FeaturedCommunity {
  communityId: string;
  reason: 'trending' | 'new' | 'recommended' | 'featured';
  score: number;
  timestamp: number;
}

export interface CommunityRecommendation {
  community: Community;
  reason: string;
  score: number;
  basedOn: 'tags' | 'members' | 'activity' | 'manual';
}

// Analytics and metrics
export interface CommunityMetrics {
  id: string;
  memberCount: number;
  totalPosts: number;
  totalProposals: number;
  activeMembers: number;
  avgPostsPerDay: number;
  lastActivity: number;
  growthRate: number;
  engagementRate: number;
}

export interface CommunityWithMetrics extends Community {
  metrics: CommunityMetrics;
  category?: string;
  featured?: FeaturedCommunity;
  isRecommended?: boolean;
}

// State interfaces for Redux
export interface CommunitiesState {
  entities: Record<string, ReduxCommunity>;
  ids: string[];
  loading: boolean;
  loadingMyCommunities: boolean;
  loadingTrending: boolean;
  error: string | null;
  
  myCommunities: {
    ids: string[];
    cachedAt: number | null;
    isCacheFresh: boolean;
  };
  trendingCommunities: {
    ids: string[];
    cachedAt: number | null;
  };
  featuredCommunities: {
    ids: string[];
    cachedAt: number | null;
  };
  
  currentCommunityId: string | null;
  
  searchResults: {
    query: string;
    results: string[];
    loading: boolean;
  };
  
  metrics: {
    totalCommunities: number;
    userMemberships: number;
    averageLoadTime: number;
    cacheHitRate: number;
  };
}

export interface CommunityProposalsState {
  entities: Record<string, ReduxCommunityProposal>;
  ids: string[];
  loading: boolean;
  loadingVotes: Record<string, boolean>;
  error: string | null;
  voteErrors: Record<string, string>;
  
  proposalsByCommunity: Record<string, {
    proposalIds: string[];
    kickProposalIds: string[];
    cachedAt: number;
  }>;
  
  userVotes: Record<string, {
    proposalId: string;
    optionIndex: number;
    votedAt: number;
  }>;
  
  activeSubscriptions: Record<string, {
    communityId: string;
    subscriptionId: string;
    lastUpdate: number;
  }>;
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

