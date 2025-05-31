// NIP-72 compliant DAO/Community types
export interface DAO {
  id: string;            // Event ID of the community definition event
  name: string;          // Community name
  description: string;   // Community description
  image: string;         // Community image URL (legacy - use avatar for new implementations)
  avatar?: string;       // Community avatar/logo URL (recommended: 200x200px, max 500KB)
  banner?: string;       // Community banner image URL (recommended: 1200x400px, max 1MB)
  creator: string;       // Pubkey of the community creator
  createdAt: number;     // Timestamp of community creation
  members: string[];     // List of member pubkeys
  moderators: string[];  // List of moderator pubkeys (NIP-72)
  bannedMembers: string[]; // List of banned member pubkeys
  guidelines?: string;   // Community guidelines (optional)
  isPrivate?: boolean;   // Whether the community is private (invitation only)
  treasury: {
    balance: number;
    tokenSymbol: string;
  };
  proposals: number;     // Total number of proposals
  activeProposals: number; // Number of active proposals
  tags: string[];       // Community tags
}

export interface DAOProposal {
  id: string;           // Event ID of the proposal
  daoId: string;        // Reference to community
  title: string;        // Proposal title
  description: string;  // Proposal description
  options: string[];    // Voting options
  createdAt: number;    // Timestamp of proposal creation
  endsAt: number;       // Timestamp when voting ends
  creator: string;      // Pubkey of the proposal creator
  votes: Record<string, number>; // Mapping of pubkey to option index
  status: "active" | "passed" | "rejected" | "canceled";
}

// NIP-72 Community Post Types
export interface CommunityPost {
  id: string;           // Event ID of the post
  communityId: string;  // Community this post was submitted to
  content: string;      // Post content
  title?: string;       // Optional post title
  author: string;       // Pubkey of the post author
  createdAt: number;    // Timestamp of post creation
  kind: number;         // Original event kind (1 for text notes, etc.)
  tags: string[][];     // Original event tags
  approvals: PostApproval[]; // List of moderator approvals
  isApproved: boolean;  // Whether the post has been approved
  approvedBy?: string;  // Pubkey of the moderator who approved
  approvedAt?: number;  // Timestamp of approval
}

export interface PostApproval {
  id: string;           // Event ID of the approval (kind 4550)
  postId: string;       // Reference to the original post
  communityId: string;  // Community the post was approved for
  moderator: string;    // Pubkey of the moderator who approved
  approvedAt: number;   // Timestamp of approval
  originalPost: string; // Stringified original post event (NIP-18 style)
}

export interface PendingPost {
  id: string;           // Event ID of the post
  communityId: string;  // Community this post was submitted to
  content: string;      // Post content
  title?: string;       // Optional post title
  author: string;       // Pubkey of the post author
  createdAt: number;    // Timestamp of post creation
  kind: number;         // Original event kind
  tags: string[][];     // Original event tags
}

export interface DAOMember {
  pubkey: string;
  joinedAt: number;
  role: 'creator' | 'moderator' | 'member';
}

export interface DAOInvite {
  id: string;
  daoId: string;
  creatorPubkey: string;
  createdAt: number;
  expiresAt?: number;
  maxUses?: number;
  usedCount: number;
}

// Enhanced Post Types with Rejection Support
export interface PostRejection {
  id: string;           // Event ID of the rejection (kind 4551)
  postId: string;       // Reference to the original post
  communityId: string;  // Community the post was rejected from
  moderator: string;    // Pubkey of the moderator who rejected
  rejectedAt: number;   // Timestamp of rejection
  reason: string;       // Reason for rejection
  originalPost: string; // Stringified original post event
}

export interface RejectedPost extends PendingPost {
  rejection: PostRejection;
  isRejected: boolean;
}

// Moderation Action Types
export interface ModerationAction {
  id: string;           // Event ID of the moderation action
  communityId: string;  // Community where action was taken
  moderator: string;    // Pubkey of the moderator
  target: string;       // Target pubkey or content ID
  action: 'ban' | 'unban' | 'mute' | 'unmute' | 'kick' | 'approve_post' | 'reject_post' | 'delete_post';
  reason?: string;      // Reason for the action
  duration?: number;    // Duration in seconds (for temporary actions)
  timestamp: number;    // When the action was taken
  metadata?: any;       // Additional action-specific data
}

// Member Ban Information
export interface MemberBan {
  id: string;           // Event ID of the ban
  communityId: string;  // Community where ban applies
  bannedUser: string;   // Pubkey of banned user
  moderator: string;    // Pubkey of moderator who issued ban
  reason: string;       // Reason for ban
  bannedAt: number;     // Timestamp of ban
  expiresAt?: number;   // Optional expiration timestamp
  isActive: boolean;    // Whether ban is currently active
}

// Content Report Types
export interface ContentReport {
  id: string;           // Event ID of the report
  communityId: string;  // Community where content is located
  reporter: string;     // Pubkey of user making report
  targetId: string;     // ID of reported content (post, comment, etc.)
  targetType: 'post' | 'comment' | 'user';
  category: 'spam' | 'harassment' | 'inappropriate' | 'misinformation' | 'other';
  reason: string;       // Detailed reason for report
  reportedAt: number;   // Timestamp of report
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reviewedBy?: string;  // Moderator who reviewed
  reviewedAt?: number;  // When it was reviewed
  resolution?: string;  // What action was taken
}

// Moderation Log Entry
export interface ModerationLogEntry {
  id: string;
  communityId: string;
  moderator: string;
  action: string;
  target: string;
  reason?: string;
  timestamp: number;
  metadata?: any;
}

// Community Discovery & Analytics Types
export interface CommunityCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  subcategories?: string[];
}

export interface CommunityMetrics {
  id: string;
  memberCount: number;
  totalPosts: number;
  totalProposals: number;
  activeMembers: number; // Members active in last 30 days
  avgPostsPerDay: number;
  lastActivity: number; // Timestamp of last activity
  growthRate: number; // Member growth rate (%)
  engagementRate: number; // Posts per member ratio
}

export interface CommunitySearchFilters {
  query?: string;
  categories?: string[];
  tags?: string[];
  minMembers?: number;
  maxMembers?: number;
  isPrivate?: boolean;
  sortBy?: 'newest' | 'members' | 'activity' | 'alphabetical';
  sortOrder?: 'asc' | 'desc';
  hasRecentActivity?: boolean; // Active in last 7 days
}

export interface CommunitySearchResult extends DAO {
  metrics: CommunityMetrics;
  matchScore: number; // Relevance score for search results
  excerpt?: string; // Highlighted search excerpt
}

export interface FeaturedCommunity {
  communityId: string;
  reason: 'trending' | 'new' | 'recommended' | 'featured';
  score: number;
  timestamp: number;
}

export interface CommunityRecommendation {
  community: DAO;
  reason: string;
  score: number;
  basedOn: 'tags' | 'members' | 'activity' | 'manual';
}

export interface PopularTag {
  tag: string;
  count: number;
  growthRate: number;
  category?: string;
}

// Enhanced DAO type with discovery metadata
export interface DAOWithMetrics extends DAO {
  metrics: CommunityMetrics;
  category?: string;
  featured?: FeaturedCommunity;
  isRecommended?: boolean;
}

// Community Analytics & Insights Types (Phase 4)
export interface MemberAnalytics {
  memberPubkey: string;
  joinedAt: number;
  totalPosts: number;
  totalComments: number;
  totalReactions: number;
  avgPostsPerDay: number;
  lastActivity: number;
  engagementScore: number; // Calculated based on interactions
  contributionRank: number; // Rank among community members
  streakDays: number; // Consecutive days with activity
  favoriteTopics: string[]; // Based on post tags/content
  interactionStats: {
    postsLiked: number;
    postsShared: number;
    commentsReceived: number;
    reactionsReceived: number;
  };
}

export interface PostAnalytics {
  postId: string;
  communityId: string;
  author: string;
  createdAt: number;
  views: number;
  reactions: number;
  comments: number;
  shares: number;
  engagementRate: number;
  reachScore: number; // How far the post spread
  topInteractors: string[]; // Top users who engaged
  peakEngagementTime: number; // When engagement was highest
  tags: string[];
  contentLength: number;
  hasMedia: boolean;
}

export interface CommunityEngagementMetrics {
  communityId: string;
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  startDate: number;
  endDate: number;
  
  // Growth Metrics
  memberGrowth: {
    newMembers: number;
    churnedMembers: number;
    netGrowth: number;
    growthRate: number;
  };
  
  // Activity Metrics
  activity: {
    totalPosts: number;
    totalComments: number;
    totalReactions: number;
    uniqueActiveMembers: number;
    avgSessionDuration: number;
    peakActivityHour: number;
  };
  
  // Engagement Metrics
  engagement: {
    avgPostEngagement: number;
    avgMemberEngagement: number;
    engagementTrend: number; // +/- percentage change
    viralPosts: number; // Posts with high engagement
    topPerformingTags: string[];
  };
  
  // Content Metrics
  content: {
    avgPostLength: number;
    mediaPostsRatio: number;
    mostUsedTags: Array<{ tag: string; count: number }>;
    contentCategories: Array<{ category: string; percentage: number }>;
  };
  
  // Health Score (0-100)
  healthScore: number;
  healthIndicators: {
    memberRetention: number;
    contentQuality: number;
    moderationEfficiency: number;
    communityGrowth: number;
  };
}

export interface CommunityInsights {
  communityId: string;
  generatedAt: number;
  
  // Key Performance Indicators
  kpis: {
    totalMembers: number;
    activeMembers: number;
    memberRetentionRate: number;
    avgDailyPosts: number;
    engagementRate: number;
    healthScore: number;
  };
  
  // Trends (week over week)
  trends: {
    memberGrowth: number;
    activityGrowth: number;
    engagementGrowth: number;
  };
  
  // Top Performers
  topMembers: Array<{
    pubkey: string;
    metric: 'posts' | 'engagement' | 'influence';
    value: number;
  }>;
  
  topPosts: Array<{
    postId: string;
    metric: 'engagement' | 'reach' | 'comments';
    value: number;
  }>;
  
  // Recommendations
  recommendations: Array<{
    type: 'growth' | 'engagement' | 'content' | 'moderation';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    actionable: boolean;
  }>;
  
  // Activity Patterns
  activityPatterns: {
    peakHours: number[]; // Hours of day with most activity
    peakDays: number[]; // Days of week (0-6) with most activity
    seasonalTrends: Array<{ period: string; activity: number }>;
  };
}

export interface AnalyticsDashboardData {
  communityId: string;
  timeRange: '7d' | '30d' | '90d' | '1y';
  lastUpdated: number;
  
  // Overview Cards
  overview: {
    totalMembers: number;
    memberChange: number;
    totalPosts: number;
    postChange: number;
    engagementRate: number;
    engagementChange: number;
    healthScore: number;
    healthChange: number;
  };
  
  // Chart Data
  charts: {
    memberGrowth: Array<{ date: string; members: number; newMembers: number }>;
    activityTrend: Array<{ date: string; posts: number; comments: number; reactions: number }>;
    engagementHeatmap: Array<{ hour: number; day: number; value: number }>;
    topTags: Array<{ tag: string; count: number; growth: number }>;
    membershipFunnel: Array<{ stage: string; count: number; percentage: number }>;
  };
  
  // Recent Highlights
  highlights: {
    topPost: { id: string; title: string; engagement: number };
    newMemberSpike: { date: string; count: number };
    mostActiveDay: { date: string; activity: number };
    risingTopic: { tag: string; growth: number };
  };
}

export interface AnalyticsExport {
  communityId: string;
  exportType: 'members' | 'posts' | 'engagement' | 'full';
  format: 'csv' | 'json' | 'xlsx';
  dateRange: { start: number; end: number };
  includePersonalData: boolean;
  requestedBy: string;
  requestedAt: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
}

// Analytics Configuration
export interface AnalyticsConfig {
  communityId: string;
  isEnabled: boolean;
  retentionPeriod: number; // Days to keep detailed analytics
  publicMetrics: boolean; // Whether basic metrics are public
  allowMemberInsights: boolean; // Whether members can see their own analytics
  allowExports: boolean; // Whether data exports are allowed
  automatedReports: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[]; // Pubkeys of moderators/admins
  };
  privacySettings: {
    anonymizeMembers: boolean;
    aggregateOnly: boolean;
    excludeSensitiveData: boolean;
  };
}

// Real-time Analytics Events
export interface AnalyticsEvent {
  id: string;
  communityId: string;
  eventType: 'member_join' | 'member_leave' | 'post_created' | 'post_reaction' | 'post_comment' | 'member_active';
  userId?: string;
  targetId?: string; // Post ID, comment ID, etc.
  timestamp: number;
  metadata?: Record<string, any>;
}

// Comparative Analytics
export interface CommunityComparison {
  communityId: string;
  compareWith: 'similar' | 'trending' | 'category_average';
  metrics: {
    memberCount: { value: number; percentile: number; trend: number };
    activityLevel: { value: number; percentile: number; trend: number };
    engagementRate: { value: number; percentile: number; trend: number };
    growthRate: { value: number; percentile: number; trend: number };
  };
  strengths: string[];
  opportunities: string[];
  benchmarkScore: number; // 0-100 compared to similar communities
}

// Analytics Alerts
export interface AnalyticsAlert {
  id: string;
  communityId: string;
  alertType: 'growth_spike' | 'growth_decline' | 'engagement_drop' | 'spam_detected' | 'health_warning';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  metric: string;
  threshold: number;
  currentValue: number;
  triggeredAt: number;
  acknowledged: boolean;
  acknowledgedBy?: string;
  actions: Array<{
    type: string;
    label: string;
    action: string;
  }>;
}

