// Store types - defined here to avoid circular imports
export type RootState = any; // Will be properly typed in store/index.ts
export type AppDispatch = any; // Will be properly typed in store/index.ts

// RTK Query tag types for cache invalidation
export const TAG_TYPES = {
  NOSTR_EVENT: 'NostrEvent',
  NOSTR_RELAY: 'NostrRelay',
  NOSTR_SUBSCRIPTION: 'NostrSubscription',
  NOSTR_PROFILE: 'NostrProfile',
  DAO: 'DAO',
  DAO_PROPOSAL: 'DAOProposal',
  DAO_COMMUNITY_POST: 'DAOCommunityPost',
  DAO_PENDING_POST: 'DAOPendingPost',
  DAO_MEMBER: 'DAOMember',
  DAO_MODERATION: 'DAOModeration',
  DAO_BAN: 'DAOBan',
  DAO_REPORT: 'DAOReport',
  DAO_INVITE: 'DAOInvite',
  WALLET: 'Wallet',
  WALLET_TOKEN: 'WalletToken',
  WALLET_TRANSACTION: 'WalletTransaction',
  WALLET_CONNECTION: 'WalletConnection',
  WALLET_BALANCE: 'WalletBalance',
  WALLET_PREFERENCES: 'WalletPreferences',
  TOKEN: 'Token',
  USER_PROFILE: 'UserProfile',
  COMMUNITY_POST: 'CommunityPost',
} as const;

export type TagType = typeof TAG_TYPES[keyof typeof TAG_TYPES];

// Common state patterns
export interface AsyncState<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

export interface PaginatedState<T = any> extends AsyncState<T[]> {
  hasMore: boolean;
  page: number;
  total: number;
}

export interface EntityState<T = any> {
  entities: Record<string, T>;
  ids: string[];
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

// Feature flags interface
export interface FeatureFlags {
  // Core Redux features
  useReduxForUI: boolean;
  
  // LocalStorage features
  useReduxForLocalStorage: boolean;
  useReduxForNotebin: boolean;
  useReduxForWalletPreferences: boolean;
  useReduxForThemePreferences: boolean;
  
  // RTK Query features
  useRTKQueryForProfiles: boolean;
  useRTKQueryForEvents: boolean;
  
  // Core features
  useReduxForNostr: boolean;
  useReduxForWallet: boolean;
  useReduxForProfiles: boolean;
}

// Performance tracking
export interface PerformanceMetrics {
  cacheHitRate: number;
  averageQueryTime: number;
  activeQueries: number;
  totalCacheSize: number;
  lastReset: number;
}

// Nostr-specific types for Redux state
export interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
  // Redux-specific metadata
  _meta?: {
    seen_on: string[]; // relays where this event was seen
    cached_at: number;
    verified: boolean;
  };
}

export interface NostrRelay {
  url: string;
  status: 'connected' | 'connecting' | 'disconnected' | 'failed';
  read: boolean;
  write: boolean;
  score?: number;
  avgResponse?: number;
  supportedNips?: number[];
  load?: number;
  // Redux-specific metadata
  _meta: {
    connected_at?: number;
    last_seen?: number;
    error_count: number;
    success_count: number;
  };
}

export interface NostrProfile {
  pubkey: string;
  name?: string;
  display_name?: string;
  about?: string;
  picture?: string;
  banner?: string;
  lud16?: string;
  website?: string;
  // Additional metadata
  _meta: {
    cached_at: number;
    followers_count?: number;
    following_count?: number;
  };
}

export interface NostrFilter {
  ids?: string[];
  authors?: string[];
  kinds?: number[];
  '#e'?: string[];
  '#p'?: string[];
  '#t'?: string[];
  since?: number;
  until?: number;
  limit?: number;
  [key: string]: any;
}

export interface NostrSubscription {
  id: string;
  filters: NostrFilter[];
  relays: string[];
  status: 'active' | 'paused' | 'closed';
  created_at: number;
  events_received: number;
  last_event_at?: number;
  auto_close_at?: number;
  renewable: boolean;
}

// DAO-specific types for Redux state
export interface ReduxDAO {
  id: string;
  name: string;
  description: string;
  image: string;         // Legacy field - use avatar for new implementations
  avatar?: string;       // Community avatar/logo URL (recommended: 200x200px, max 500KB)
  banner?: string;       // Community banner image URL (recommended: 1200x400px, max 1MB)
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
  proposals: number;
  activeProposals: number;
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

export interface ReduxDAOProposal {
  id: string;
  daoId: string;
  title: string;
  description: string;
  options: string[];
  createdAt: number;
  endsAt: number;
  creator: string;
  votes: number[]; // Array of vote counts per option (simplified for Redux)
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

export interface ReduxCommunityPost {
  id: string;
  communityId: string;
  content: string;
  title?: string;
  author: string;
  createdAt: number;
  kind: number;
  tags: string[][];
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: number;
  // Redux-specific metadata
  _meta: {
    cached_at: number;
    approval_status: 'pending' | 'approved' | 'rejected';
    moderation_notes?: string;
    engagement_count?: number;
  };
}

export interface ReduxPendingPost {
  id: string;
  communityId: string;
  content: string;
  title?: string;
  author: string;
  createdAt: number;
  kind: number;
  tags: string[][];
  // Redux-specific metadata
  _meta: {
    cached_at: number;
    review_priority: 'low' | 'normal' | 'high';
    flagged_content: boolean;
    auto_approved: boolean;
  };
}

export interface ReduxModerationAction {
  id: string;
  communityId: string;
  moderator: string;
  target: string;
  action: 'ban' | 'unban' | 'mute' | 'unmute' | 'kick' | 'approve_post' | 'reject_post' | 'delete_post';
  reason?: string;
  duration?: number;
  timestamp: number;
  metadata?: any;
  // Redux-specific metadata
  _meta: {
    cached_at: number;
    is_automated: boolean;
    appeal_status?: 'none' | 'pending' | 'approved' | 'denied';
  };
}

export interface ReduxMemberBan {
  id: string;
  communityId: string;
  bannedUser: string;
  moderator: string;
  reason: string;
  bannedAt: number;
  expiresAt?: number;
  isActive: boolean;
  // Redux-specific metadata
  _meta: {
    cached_at: number;
    ban_duration?: number;
    appeal_count: number;
    is_permanent: boolean;
  };
}

export interface ReduxContentReport {
  id: string;
  communityId: string;
  reporter: string;
  targetId: string;
  targetType: 'post' | 'comment' | 'user';
  category: 'spam' | 'harassment' | 'inappropriate' | 'misinformation' | 'other';
  reason: string;
  reportedAt: number;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reviewedBy?: string;
  reviewedAt?: number;
  resolution?: string;
  // Redux-specific metadata
  _meta: {
    cached_at: number;
    priority_score: number;
    similar_reports: number;
    auto_flagged: boolean;
  };
}

// DAO State Interfaces for Redux Slices
export interface DAOCommunitiesState {
  // Entity adapter state
  entities: Record<string, ReduxDAO>;
  ids: string[];
  
  // Loading states (matching useDAO hook structure)
  loading: boolean;
  loadingMyDAOs: boolean;
  loadingTrending: boolean;
  
  // Error handling
  error: string | null;
  
  // Discovery and categorization
  myDAOs: {
    ids: string[];
    cachedAt: number | null;
    isCacheFresh: boolean;
  };
  trendingDAOs: {
    ids: string[];
    cachedAt: number | null;
  };
  featuredDAOs: {
    ids: string[];
    cachedAt: number | null;
  };
  
  // Current viewing context
  currentDAOId: string | null;
  
  // Search and filtering
  searchResults: {
    query: string;
    results: string[];
    loading: boolean;
  };
  
  // Performance metrics
  metrics: {
    totalCommunities: number;
    userMemberships: number;
    averageLoadTime: number;
    cacheHitRate: number;
  };
}

export interface DAOProposalsState {
  // Entity adapter state
  entities: Record<string, ReduxDAOProposal>;
  ids: string[];
  
  // Loading states
  loading: boolean;
  loadingVotes: Record<string, boolean>; // Track voting operations per proposal
  
  // Error handling
  error: string | null;
  voteErrors: Record<string, string>; // Track voting errors per proposal
  
  // Proposals by DAO
  proposalsByDAO: Record<string, {
    proposalIds: string[];
    kickProposalIds: string[];
    cachedAt: number;
  }>;
  
  // Voting state
  userVotes: Record<string, {
    proposalId: string;
    optionIndex: number;
    votedAt: number;
  }>;
  
  // Real-time updates
  activeSubscriptions: Record<string, {
    daoId: string;
    subscriptionId: string;
    lastUpdate: number;
  }>;
}

export interface DAOCommunityPostsState {
  // Entity adapters for different post states
  approvedPosts: {
    entities: Record<string, ReduxCommunityPost>;
    ids: string[];
  };
  pendingPosts: {
    entities: Record<string, ReduxPendingPost>;
    ids: string[];
  };
  rejectedPosts: {
    entities: Record<string, ReduxCommunityPost>;
    ids: string[];
  };
  
  // Loading states (matching useDAO structure)
  loadingPosts: boolean;
  loadingPendingPosts: boolean;
  loadingRejectedPosts: boolean;
  
  // Error handling
  error: string | null;
  
  // Posts by community
  postsByDAO: Record<string, {
    approvedIds: string[];
    pendingIds: string[];
    rejectedIds: string[];
    cachedAt: number;
  }>;
  
  // Moderation workflow
  moderationQueue: {
    priorityPostIds: string[];
    autoFlaggedIds: string[];
    reportedIds: string[];
  };
  
  // Performance tracking
  metrics: {
    totalPosts: number;
    approvalRate: number;
    averageReviewTime: number;
    pendingCount: number;
  };
}

export interface DAOModerationState {
  // Entity adapters
  moderationActions: {
    entities: Record<string, ReduxModerationAction>;
    ids: string[];
  };
  memberBans: {
    entities: Record<string, ReduxMemberBan>;
    ids: string[];
  };
  contentReports: {
    entities: Record<string, ReduxContentReport>;
    ids: string[];
  };
  
  // Loading states (matching useDAO structure)
  loadingBannedMembers: boolean;
  loadingReports: boolean;
  loadingModerationLogs: boolean;
  
  // Error handling
  error: string | null;
  
  // Moderation data by community
  moderationByDAO: Record<string, {
    actionIds: string[];
    banIds: string[];
    reportIds: string[];
    cachedAt: number;
  }>;
  
  // Real-time moderation
  activeAlerts: {
    highPriorityReports: string[];
    escalatedIssues: string[];
    autoActions: string[];
  };
  
  // Moderation analytics
  analytics: {
    totalActions: number;
    activeBans: number;
    pendingReports: number;
    responseTime: number;
  };
}

// Wallet-specific types for Redux state (Phase 4)
export interface ReduxWallet {
  address: string;
  label: string;
  network: WalletType;
  isWatchOnly: boolean;
  isConnected: boolean;
  dateAdded: number;
  lastUpdated: number;
  
  // Balance information
  balance: {
    balance: number;
    lockedBalance: number;
    utxoNum: number;
    usdValue?: number;
  };
  
  // Nostr integration
  locked?: {
    isLocked: boolean;
    eventId?: string;
    lockedAt?: number;
  };
  
  // Performance metrics
  stats: {
    transactionCount: number;
    receivedAmount: number;
    sentAmount: number;
    tokenCount: number;
    nftCount: number;
    totalValueUSD: number;
    totalValueALPH: number;
    lastActivity: number;
  };
  
  // Redux-specific metadata
  _meta: {
    cached_at: number;
    is_stale: boolean;
    retry_count: number;
    last_refresh: number;
    refresh_interval: number;
    auto_refresh: boolean;
    is_refreshing: boolean;
    error_count: number;
    performance_score: number;
    cache_hit_rate: number;
  };
}

export interface ReduxWalletToken {
  id: string;
  walletAddress: string;
  tokenId: string;
  name: string;
  symbol: string;
  decimals: number;
  amount: string;
  formattedAmount: string;
  logoURI?: string;
  isNFT: boolean;
  usdValue?: number;
  alphValue?: number;
  
  // Token analytics
  analytics: {
    price24hChange?: number;
    price7dChange?: number;
    volume24h?: number;
    marketCap?: number;
    rank?: number;
    allTimeHigh?: number;
    allTimeLow?: number;
  };
  
  // Risk and verification
  riskLevel: 'low' | 'medium' | 'high' | 'unknown';
  isVerified: boolean;
  category: 'token' | 'nft' | 'lp' | 'other';
  
  // Redux-specific metadata
  _meta: {
    cached_at: number;
    price_last_updated?: number;
    source: 'api' | 'cache' | 'estimate';
    confidence_score: number;
  };
}

export interface ReduxWalletTransaction {
  id: string;
  walletAddress: string;
  hash: string;
  blockHash: string;
  timestamp: number;
  type: 'received' | 'sent' | 'contract' | 'token' | 'nft';
  amount: number;
  fee?: number;
  from?: string;
  to?: string;
  status: 'confirmed' | 'pending' | 'failed';
  
  // Token-specific data
  tokenTransfers?: {
    tokenId: string;
    amount: string;
    from: string;
    to: string;
  }[];
  
  // NFT-specific data
  nftTransfers?: {
    tokenId: string;
    tokenIndex: string;
    from: string;
    to: string;
  }[];
  
  // Redux-specific metadata
  _meta: {
    cached_at: number;
    confirmation_count?: number;
    usd_value_at_time?: number;
    gas_used?: number;
    category: 'incoming' | 'outgoing' | 'internal';
  };
}

export interface ReduxWalletConnection {
  id: string;
  type: 'alephium' | 'extension' | 'walletconnect' | 'manual';
  address?: string;
  publicKey?: string;
  isConnected: boolean;
  connectedAt?: number;
  lastSeen?: number;
  
  // Connection details
  metadata: {
    name?: string;
    icon?: string;
    description?: string;
    url?: string;
    version?: string;
  };
  
  // Capabilities
  capabilities: {
    canSign: boolean;
    canSendTransaction: boolean;
    canSignMessage: boolean;
    supportedMethods: string[];
  };
  
  // Redux-specific metadata
  _meta: {
    cached_at: number;
    connection_attempts: number;
    last_error?: string;
    stability_score: number;
  };
}

// Wallet type definitions
export type WalletType = "Bitcoin" | "Alephium" | "Ergo";

export interface ReduxWalletPreferences {
  defaultWallet?: string;
  selectedNetwork: WalletType;
  autoRefresh: boolean;
  refreshInterval: number;
  showTestNetworks: boolean;
  priceDisplayCurrency: 'USD' | 'EUR' | 'BTC' | 'ALPH';
  
  // Privacy settings
  hideSmallBalances: boolean;
  hideTokensBelow: number;
  showDetailedTransactions: boolean;
  
  // Notification preferences
  enableTransactionNotifications: boolean;
  enablePriceAlerts: boolean;
  enableSecurityAlerts: boolean;
  
  // Performance settings
  cacheStrategy: 'aggressive' | 'balanced' | 'minimal';
  maxCacheSize: number;
  preloadTokenData: boolean;
}

// State interfaces for wallet Redux slices
export interface WalletManagementState {
  // Entity adapter state
  entities: Record<string, ReduxWallet>;
  ids: string[];
  
  // Loading states
  loading: boolean;
  loadingBalances: Record<string, boolean>;
  loadingTokens: Record<string, boolean>;
  loadingTransactions: Record<string, boolean>;
  
  // Error handling
  error: string | null;
  walletErrors: Record<string, string>;
  
  // Selection and focus
  selectedWallet: string | null;
  connectedWallet: string | null;
  
  // Bulk operations
  bulkOperations: {
    refreshing: string[];
    importing: string[];
    exporting: string[];
  };
  
  // Performance metrics
  metrics: {
    totalWallets: number;
    connectedWallets: number;
    averageRefreshTime: number;
    cacheHitRate: number;
    totalValueTracked: number;
  };
}

export interface WalletTokensState {
  // Entity adapter state for tokens
  entities: Record<string, ReduxWalletToken>;
  ids: string[];
  
  // Loading states
  loading: boolean;
  loadingPrices: Record<string, boolean>;
  
  // Error handling
  error: string | null;
  
  // Tokens by wallet
  tokensByWallet: Record<string, {
    tokenIds: string[];
    nftIds: string[];
    cachedAt: number;
    totalValue: number;
  }>;
  
  // Price tracking
  priceUpdates: Record<string, {
    lastUpdate: number;
    source: string;
    confidence: number;
  }>;
  
  // Categories and filtering
  categories: {
    verified: string[];
    lpTokens: string[];
    experimental: string[];
    nfts: string[];
  };
}

export interface WalletTransactionsState {
  // Entity adapter state for transactions
  entities: Record<string, ReduxWalletTransaction>;
  ids: string[];
  
  // Loading states
  loading: boolean;
  loadingHistory: Record<string, boolean>;
  
  // Error handling
  error: string | null;
  
  // Transactions by wallet
  transactionsByWallet: Record<string, {
    transactionIds: string[];
    hasMore: boolean;
    page: number;
    cachedAt: number;
    totalCount: number;
  }>;
  
  // Transaction categories
  categories: {
    pending: string[];
    recent: string[];
    failed: string[];
  };
  
  // Analytics
  analytics: Record<string, {
    totalSent: number;
    totalReceived: number;
    totalFees: number;
    transactionCount: number;
    averageValue: number;
  }>;
}

export interface WalletConnectionsState {
  // Entity adapter state for connections
  entities: Record<string, ReduxWalletConnection>;
  ids: string[];
  
  // Loading states
  connecting: boolean;
  disconnecting: boolean;
  
  // Error handling
  error: string | null;
  connectionErrors: Record<string, string>;
  
  // Active connections
  activeConnections: string[];
  primaryConnection: string | null;
  
  // Connection discovery
  availableConnections: {
    discovered: ReduxWalletConnection[];
    lastScan: number;
    scanning: boolean;
  };
  
  // Session management
  session: {
    isActive: boolean;
    startedAt?: number;
    lastActivity?: number;
    autoDisconnectAt?: number;
  };
}

export interface WalletPreferencesState {
  preferences: ReduxWalletPreferences;
  loading: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
  lastSaved: number | null;
} 

