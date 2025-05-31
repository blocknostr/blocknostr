import { createSlice, createAsyncThunk, createEntityAdapter, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';
import { createSelector } from 'reselect';

// NIP-39: External Identity Proofs
// https://github.com/nostr-protocol/nips/blob/master/39.md
// NIP-58: Badges
// https://github.com/nostr-protocol/nips/blob/master/58.md

// NOTE: NIP-05 verification is handled in identitySlice.ts to avoid conflicts
// This slice focuses on external platform identity proofs (GitHub, Twitter, etc.)

// Identity verification interfaces (NIP-05 removed)
export interface ExternalIdentityProof {
  id: string;
  pubkey: string;
  platform: 'github' | 'twitter' | 'mastodon' | 'telegram' | 'website' | 'other';
  identity: string; // username or identifier on the platform
  proofUrl: string; // URL to the proof
  claimUrl?: string; // URL where the claim is made
  verified: boolean;
  verificationDate?: number;
  lastChecked: number;
  // Proof metadata
  proofType: 'profile_description' | 'gist' | 'tweet' | 'post' | 'dns_txt' | 'other';
  proofContent?: string;
  // Platform-specific data
  platformData?: {
    userId?: string;
    profilePicture?: string;
    followerCount?: number;
    accountAge?: number;
    isVerified?: boolean; // Platform's own verification
  };
  // Verification status
  status: 'pending' | 'verified' | 'failed' | 'expired';
  errorMessage?: string;
  trustScore: number; // 0-100
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  image: string;
  thumbImage?: string;
  // Badge metadata
  issuer: string; // pubkey of issuer
  recipient?: string; // pubkey of recipient
  badgeDefinitionEventId: string; // kind:30009 event
  badgeAwardEventId?: string; // kind:8 event
  // Badge properties
  category: 'verification' | 'achievement' | 'role' | 'certification' | 'custom';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  transferable: boolean;
  revocable: boolean;
  expiresAt?: number;
  issuedAt: number;
  // Verification criteria
  criteria?: {
    type: 'external_proof' | 'social_graph' | 'activity' | 'manual';
    requirements: Record<string, any>;
  };
  // Display properties
  color?: string;
  shape?: 'circle' | 'square' | 'shield' | 'star' | 'diamond';
  animation?: string;
}

export interface UserIdentity {
  pubkey: string;
  displayName?: string;
  // Verification status
  hasExternalProofs: boolean;
  hasBadges: boolean;
  verificationLevel: 'none' | 'basic' | 'verified' | 'premium';
  trustScore: number; // Composite score 0-100
  verificationScore: number; // Based on verifications 0-100
  // Identity components
  externalProofs: string[]; // IDs of proofs
  badges: string[]; // IDs of badges
  // Metadata
  createdAt: number;
  lastUpdated: number;
  lastVerificationCheck: number;
}

export interface IdentityVerificationState {
  // Verification entities
  externalProofs: Record<string, ExternalIdentityProof>;
  badges: Record<string, Badge>;
  userIdentities: Record<string, UserIdentity>;
  // Badge definitions (kind:30009 events)
  badgeDefinitions: Record<string, Badge>;
  // Loading states
  loading: boolean;
  verifyingExternalProof: Record<string, boolean>;
  fetchingBadges: boolean;
  error: string | null;
  // Verification queue
  verificationQueue: Array<{
    id: string;
    type: 'external_proof';
    pubkey: string;
    identifier: string;
    priority: 'low' | 'normal' | 'high';
    createdAt: number;
  }>;
  // Configuration
  verificationConfig: {
    checkInterval: number; // in milliseconds
    maxRetries: number;
    timeoutDuration: number;
    trustedDomains: string[];
    blockedDomains: string[];
  };
  // Statistics
  verificationStats: {
    totalExternalProofs: number;
    totalBadges: number;
    verificationSuccessRate: number;
    averageVerificationTime: number;
    platformDistribution: Record<string, number>;
  };
  // Cache
  dnsCache: Record<string, { data: any; expires: number }>;
  platformCache: Record<string, { data: any; expires: number }>;
}

// Entity adapters
const externalProofAdapter = createEntityAdapter<ExternalIdentityProof>({
  selectId: (proof) => proof.id,
  sortComparer: (a, b) => b.trustScore - a.trustScore,
});

const badgeAdapter = createEntityAdapter<Badge>({
  selectId: (badge) => badge.id,
  sortComparer: (a, b) => b.issuedAt - a.issuedAt,
});

// Initial state
const initialState: IdentityVerificationState = {
  ...externalProofAdapter.getInitialState(),
  badges: {},
  userIdentities: {},
  badgeDefinitions: {},
  loading: false,
  verifyingExternalProof: {},
  fetchingBadges: false,
  error: null,
  verificationQueue: [],
  verificationConfig: {
    checkInterval: 24 * 60 * 60 * 1000, // 24 hours
    maxRetries: 3,
    timeoutDuration: 30000, // 30 seconds
    trustedDomains: ['github.com', 'twitter.com', 'mastodon.social'],
    blockedDomains: [],
  },
  verificationStats: {
    totalExternalProofs: 0,
    totalBadges: 0,
    verificationSuccessRate: 0,
    averageVerificationTime: 0,
    platformDistribution: {},
  },
  dnsCache: {},
  platformCache: {},
};

// Async thunk for external identity verification
export const verifyExternalIdentity = createAsyncThunk(
  'identityVerification/verifyExternalIdentity',
  async (params: {
    pubkey: string;
    platform: ExternalIdentityProof['platform'];
    identity: string;
    proofUrl: string;
  }, { rejectWithValue }) => {
    try {
      const { pubkey, platform, identity, proofUrl } = params;

      // Platform-specific verification logic
      let verified = false;
      let proofContent = '';
      let platformData: ExternalIdentityProof['platformData'] = {};

      switch (platform) {
        case 'github':
          const githubResult = await verifyGithubIdentity(pubkey, identity, proofUrl);
          verified = githubResult.verified;
          proofContent = githubResult.content;
          platformData = githubResult.platformData;
          break;

        case 'twitter':
          const twitterResult = await verifyTwitterIdentity(pubkey, identity, proofUrl);
          verified = twitterResult.verified;
          proofContent = twitterResult.content;
          platformData = twitterResult.platformData;
          break;

        case 'website':
          const websiteResult = await verifyWebsiteIdentity(pubkey, identity, proofUrl);
          verified = websiteResult.verified;
          proofContent = websiteResult.content;
          break;

        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }

      const proof: ExternalIdentityProof = {
        id: `proof_${platform}_${identity}_${Date.now()}`,
        pubkey,
        platform,
        identity,
        proofUrl,
        verified,
        verificationDate: verified ? Date.now() : undefined,
        lastChecked: Date.now(),
        proofType: 'profile_description',
        proofContent,
        platformData,
        status: verified ? 'verified' : 'failed',
        errorMessage: verified ? undefined : 'Proof not found or invalid',
        trustScore: calculateTrustScore(platform, verified, platformData),
      };

      return proof;
    } catch (error) {
      console.error('External identity verification failed:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Verification failed');
    }
  }
);

// Async thunk for fetching badges
export const fetchUserBadges = createAsyncThunk(
  'identityVerification/fetchUserBadges',
  async (params: { pubkey: string; relays?: string[] }, { rejectWithValue }) => {
    try {
      const { pubkey, relays = [] } = params;

      // Fetch badge award events (kind:8)
      const badgeAwards = await fetchNostrEvents({
        kinds: [8],
        '#p': [pubkey],
        limit: 100,
      }, relays);

      // Fetch badge definition events (kind:30009)
      const badgeDefinitionIds = badgeAwards.map(award => {
        const aTag = award.tags.find(tag => tag[0] === 'a');
        return aTag ? aTag[1] : null;
      }).filter(Boolean);

      const badgeDefinitions = await fetchNostrEvents({
        kinds: [30009],
        '#d': badgeDefinitionIds,
        limit: 100,
      }, relays);

      const badges: Badge[] = [];

      for (const award of badgeAwards) {
        const aTag = award.tags.find(tag => tag[0] === 'a');
        if (!aTag) continue;

        const definitionId = aTag[1];
        const definition = badgeDefinitions.find(def => {
          const dTag = def.tags.find(tag => tag[0] === 'd');
          return dTag && dTag[1] === definitionId;
        });

        if (!definition) continue;

        // Parse badge definition
        const nameTag = definition.tags.find(tag => tag[0] === 'name');
        const descTag = definition.tags.find(tag => tag[0] === 'description');
        const imageTag = definition.tags.find(tag => tag[0] === 'image');
        const thumbTag = definition.tags.find(tag => tag[0] === 'thumb');

        const badge: Badge = {
          id: `badge_${award.id}`,
          name: nameTag ? nameTag[1] : 'Unknown Badge',
          description: descTag ? descTag[1] : '',
          image: imageTag ? imageTag[1] : '',
          thumbImage: thumbTag ? thumbTag[1] : undefined,
          issuer: definition.pubkey,
          recipient: pubkey,
          badgeDefinitionEventId: definition.id,
          badgeAwardEventId: award.id,
          category: 'achievement',
          rarity: 'common',
          transferable: false,
          revocable: true,
          issuedAt: award.created_at * 1000,
        };

        badges.push(badge);
      }

      return { badges, badgeDefinitions };
    } catch (error) {
      console.error('Error fetching badges:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch badges');
    }
  }
);

// Helper functions for platform verification
async function verifyGithubIdentity(pubkey: string, username: string, proofUrl: string) {
  // GitHub verification logic
  // Check if pubkey is mentioned in profile, gist, or repo
  try {
    const response = await fetch(proofUrl);
    const content = await response.text();
    
    const verified = content.includes(pubkey);
    
    return {
      verified,
      content: content.substring(0, 500), // First 500 chars
      platformData: {
        userId: username,
        // Additional GitHub API data could be fetched here
      },
    };
  } catch (error) {
    return { verified: false, content: '', platformData: {} };
  }
}

async function verifyTwitterIdentity(pubkey: string, username: string, proofUrl: string) {
  // Twitter verification logic
  // Note: Twitter API access would be required for full verification
  try {
    const response = await fetch(proofUrl);
    const content = await response.text();
    
    const verified = content.includes(pubkey);
    
    return {
      verified,
      content: content.substring(0, 500),
      platformData: {
        userId: username,
      },
    };
  } catch (error) {
    return { verified: false, content: '', platformData: {} };
  }
}

async function verifyWebsiteIdentity(pubkey: string, domain: string, proofUrl: string) {
  // Website verification logic
  try {
    const response = await fetch(proofUrl);
    const content = await response.text();
    
    const verified = content.includes(pubkey);
    
    return {
      verified,
      content: content.substring(0, 500),
    };
  } catch (error) {
    return { verified: false, content: '' };
  }
}

function calculateTrustScore(
  platform: ExternalIdentityProof['platform'],
  verified: boolean,
  platformData?: ExternalIdentityProof['platformData']
): number {
  if (!verified) return 0;

  let baseScore = 50;

  // Platform-specific scoring
  switch (platform) {
    case 'github':
      baseScore = 80;
      break;
    case 'twitter':
      baseScore = 70;
      break;
    case 'website':
      baseScore = 60;
      break;
    default:
      baseScore = 40;
  }

  // Adjust based on platform data
  if (platformData?.isVerified) {
    baseScore += 20;
  }

  if (platformData?.accountAge && platformData.accountAge > 365 * 24 * 60 * 60 * 1000) {
    baseScore += 10; // Account older than 1 year
  }

  if (platformData?.followerCount && platformData.followerCount > 1000) {
    baseScore += 10; // Popular account
  }

  return Math.min(100, baseScore);
}

async function fetchNostrEvents(filter: any, relays: string[]): Promise<any[]> {
  // Placeholder for actual Nostr event fetching
  return [];
}

// Identity Verification Slice
const identityVerificationSlice = createSlice({
  name: 'identityVerification',
  initialState,
  reducers: {
    // External proofs management
    addExternalProof: (state, action: PayloadAction<ExternalIdentityProof>) => {
      const proof = action.payload;
      state.externalProofs[proof.id] = proof;
      
      // Update user identity
      const pubkey = proof.pubkey;
      if (!state.userIdentities[pubkey]) {
        state.userIdentities[pubkey] = {
          pubkey,
          hasExternalProofs: false,
          hasBadges: false,
          verificationLevel: 'none',
          trustScore: 0,
          verificationScore: 0,
          externalProofs: [],
          badges: [],
          createdAt: Date.now(),
          lastUpdated: Date.now(),
          lastVerificationCheck: Date.now(),
        };
      }
      
      state.userIdentities[pubkey].hasExternalProofs = true;
      state.userIdentities[pubkey].externalProofs.push(proof.id);
      state.userIdentities[pubkey].lastUpdated = Date.now();
    },

    updateExternalProof: (state, action: PayloadAction<{ id: string; changes: Partial<ExternalIdentityProof> }>) => {
      const { id, changes } = action.payload;
      const existing = state.externalProofs[id];
      if (existing) {
        state.externalProofs[id] = {
          ...existing,
          ...changes,
          lastChecked: Date.now(),
        };
      }
    },

    removeExternalProof: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const proof = state.externalProofs[id];
      
      delete state.externalProofs[id];
      
      if (proof) {
        const pubkey = proof.pubkey;
        const userIdentity = state.userIdentities[pubkey];
        if (userIdentity) {
          userIdentity.externalProofs = userIdentity.externalProofs.filter(pId => pId !== id);
          userIdentity.hasExternalProofs = userIdentity.externalProofs.length > 0;
          userIdentity.lastUpdated = Date.now();
        }
      }
    },

    // Badge management
    addBadge: (state, action: PayloadAction<Badge>) => {
      const badge = action.payload;
      state.badges[badge.id] = badge;
      
      // Update user identity
      if (badge.recipient) {
        const pubkey = badge.recipient;
        if (!state.userIdentities[pubkey]) {
          state.userIdentities[pubkey] = {
            pubkey,
            hasExternalProofs: false,
            hasBadges: false,
            verificationLevel: 'none',
            trustScore: 0,
            verificationScore: 0,
            externalProofs: [],
            badges: [],
            createdAt: Date.now(),
            lastUpdated: Date.now(),
            lastVerificationCheck: Date.now(),
          };
        }
        
        state.userIdentities[pubkey].hasBadges = true;
        state.userIdentities[pubkey].badges.push(badge.id);
        state.userIdentities[pubkey].lastUpdated = Date.now();
      }
    },

    addMultipleBadges: (state, action: PayloadAction<Badge[]>) => {
      action.payload.forEach(badge => {
        state.badges[badge.id] = badge;
      });
    },

    addBadgeDefinition: (state, action: PayloadAction<Badge>) => {
      const definition = action.payload;
      state.badgeDefinitions[definition.id] = definition;
    },

    // Verification queue management
    addToVerificationQueue: (state, action: PayloadAction<{
      type: 'external_proof';
      pubkey: string;
      identifier: string;
      priority?: 'low' | 'normal' | 'high';
    }>) => {
      const { type, pubkey, identifier, priority = 'normal' } = action.payload;
      state.verificationQueue.push({
        id: `${type}_${pubkey}_${Date.now()}`,
        type,
        pubkey,
        identifier,
        priority,
        createdAt: Date.now(),
      });
    },

    removeFromVerificationQueue: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      state.verificationQueue = state.verificationQueue.filter(item => item.id !== id);
    },

    clearVerificationQueue: (state) => {
      state.verificationQueue = [];
    },

    // Configuration
    updateVerificationConfig: (state, action: PayloadAction<Partial<IdentityVerificationState['verificationConfig']>>) => {
      state.verificationConfig = { ...state.verificationConfig, ...action.payload };
    },

    addTrustedDomain: (state, action: PayloadAction<string>) => {
      const domain = action.payload;
      if (!state.verificationConfig.trustedDomains.includes(domain)) {
        state.verificationConfig.trustedDomains.push(domain);
      }
    },

    removeTrustedDomain: (state, action: PayloadAction<string>) => {
      const domain = action.payload;
      state.verificationConfig.trustedDomains = state.verificationConfig.trustedDomains.filter(d => d !== domain);
    },

    addBlockedDomain: (state, action: PayloadAction<string>) => {
      const domain = action.payload;
      if (!state.verificationConfig.blockedDomains.includes(domain)) {
        state.verificationConfig.blockedDomains.push(domain);
      }
    },

    removeBlockedDomain: (state, action: PayloadAction<string>) => {
      const domain = action.payload;
      state.verificationConfig.blockedDomains = state.verificationConfig.blockedDomains.filter(d => d !== domain);
    },

    // Cache management
    updateDnsCache: (state, action: PayloadAction<{ domain: string; data: any; ttl: number }>) => {
      const { domain, data, ttl } = action.payload;
      state.dnsCache[domain] = {
        data,
        expires: Date.now() + ttl,
      };
    },

    updatePlatformCache: (state, action: PayloadAction<{ key: string; data: any; ttl: number }>) => {
      const { key, data, ttl } = action.payload;
      state.platformCache[key] = {
        data,
        expires: Date.now() + ttl,
      };
    },

    clearExpiredCache: (state) => {
      const now = Date.now();
      
      // Clear expired DNS cache
      Object.keys(state.dnsCache).forEach(domain => {
        if (state.dnsCache[domain].expires < now) {
          delete state.dnsCache[domain];
        }
      });
      
      // Clear expired platform cache
      Object.keys(state.platformCache).forEach(key => {
        if (state.platformCache[key].expires < now) {
          delete state.platformCache[key];
        }
      });
    },

    // Statistics
    updateVerificationStats: (state, action: PayloadAction<Partial<IdentityVerificationState['verificationStats']>>) => {
      state.verificationStats = { ...state.verificationStats, ...action.payload };
    },

    // Error handling
    clearError: (state) => {
      state.error = null;
    },

    // Loading states
    setVerifyingExternalProof: (state, action: PayloadAction<{ id: string; loading: boolean }>) => {
      const { id, loading } = action.payload;
      state.verifyingExternalProof[id] = loading;
    },
  },
  extraReducers: (builder) => {
    builder
      // External identity verification
      .addCase(verifyExternalIdentity.pending, (state, action) => {
        const { pubkey, platform, identity } = action.meta.arg;
        const id = `${platform}_${identity}`;
        state.verifyingExternalProof[id] = true;
        state.error = null;
      })
      .addCase(verifyExternalIdentity.fulfilled, (state, action) => {
        const proof = action.payload;
        const id = `${proof.platform}_${proof.identity}`;
        
        state.externalProofs[proof.id] = proof;
        state.verifyingExternalProof[id] = false;
        
        // Update user identity
        const pubkey = proof.pubkey;
        if (!state.userIdentities[pubkey]) {
          state.userIdentities[pubkey] = {
            pubkey,
            hasExternalProofs: false,
            hasBadges: false,
            verificationLevel: 'none',
            trustScore: 0,
            verificationScore: 0,
            externalProofs: [],
            badges: [],
            createdAt: Date.now(),
            lastUpdated: Date.now(),
            lastVerificationCheck: Date.now(),
          };
        }
        
        state.userIdentities[pubkey].hasExternalProofs = true;
        state.userIdentities[pubkey].externalProofs.push(proof.id);
        state.userIdentities[pubkey].lastUpdated = Date.now();
      })
      .addCase(verifyExternalIdentity.rejected, (state, action) => {
        const { platform, identity } = action.meta.arg;
        const id = `${platform}_${identity}`;
        state.verifyingExternalProof[id] = false;
        state.error = action.payload as string;
      })
      
      // Badge fetching
      .addCase(fetchUserBadges.pending, (state) => {
        state.fetchingBadges = true;
        state.error = null;
      })
      .addCase(fetchUserBadges.fulfilled, (state, action) => {
        state.fetchingBadges = false;
        const { badges, badgeDefinitions } = action.payload;
        
        // Add badges
        badges.forEach(badge => {
          state.badges[badge.id] = badge;
        });
        
        // Add badge definitions
        badgeDefinitions.forEach(definition => {
          state.badgeDefinitions[definition.id] = definition;
        });
        
        // Update user identity
        if (badges.length > 0) {
          const pubkey = badges[0].recipient;
          if (pubkey && !state.userIdentities[pubkey]) {
            state.userIdentities[pubkey] = {
              pubkey,
              hasExternalProofs: false,
              hasBadges: false,
              verificationLevel: 'none',
              trustScore: 0,
              verificationScore: 0,
              externalProofs: [],
              badges: [],
              createdAt: Date.now(),
              lastUpdated: Date.now(),
              lastVerificationCheck: Date.now(),
            };
          }
          
          if (pubkey) {
            state.userIdentities[pubkey].hasBadges = true;
            state.userIdentities[pubkey].badges = badges.map(b => b.id);
            state.userIdentities[pubkey].lastUpdated = Date.now();
          }
        }
      })
      .addCase(fetchUserBadges.rejected, (state, action) => {
        state.fetchingBadges = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const {
  addExternalProof,
  updateExternalProof,
  removeExternalProof,
  addBadge,
  addMultipleBadges,
  addBadgeDefinition,
  addToVerificationQueue,
  removeFromVerificationQueue,
  clearVerificationQueue,
  updateVerificationConfig,
  addTrustedDomain,
  removeTrustedDomain,
  addBlockedDomain,
  removeBlockedDomain,
  updateDnsCache,
  updatePlatformCache,
  clearExpiredCache,
  updateVerificationStats,
  clearError,
  setVerifyingExternalProof,
} = identityVerificationSlice.actions;

// Export selectors
export const {
  selectAll: selectAllExternalProofs,
  selectById: selectExternalProofById,
  selectIds: selectExternalProofIds,
  selectEntities: selectExternalProofEntities,
  selectTotal: selectTotalExternalProofs,
} = externalProofAdapter.getSelectors((state: RootState) => state.identityVerification);

// Base selectors
const selectIdentityVerificationState = (state: RootState) => state.identityVerification;
const selectUserIdentities = (state: RootState) => state.identityVerification.userIdentities;
const selectExternalProofs = (state: RootState) => state.identityVerification.externalProofs;
const selectBadges = (state: RootState) => state.identityVerification.badges;

// Memoized custom selectors
export const selectUserIdentity = createSelector(
  [selectUserIdentities, (_: RootState, pubkey: string) => pubkey],
  (userIdentities, pubkey) => userIdentities[pubkey] || null
);

export const selectUserExternalProofs = createSelector(
  [selectUserIdentity, selectExternalProofs],
  (userIdentity, externalProofs) => {
    if (!userIdentity) return [];
    
    return userIdentity.externalProofs
      .map(id => externalProofs[id])
      .filter(Boolean);
  }
);

export const selectUserBadges = createSelector(
  [selectUserIdentity, selectBadges],
  (userIdentity, badges) => {
    if (!userIdentity) return [];
    
    return userIdentity.badges
      .map(id => badges[id])
      .filter(Boolean);
  }
);

export const selectVerificationLoadingState = createSelector(
  [selectIdentityVerificationState],
  (state) => ({
    loading: state.loading,
    fetchingBadges: state.fetchingBadges,
    verifyingExternalProof: state.verifyingExternalProof,
    error: state.error,
  })
);

export const selectVerificationStats = createSelector(
  [selectIdentityVerificationState],
  (state) => state.verificationStats
);

export const selectVerificationQueue = createSelector(
  [selectIdentityVerificationState],
  (state) => state.verificationQueue
);

export const selectVerificationConfig = createSelector(
  [selectIdentityVerificationState],
  (state) => state.verificationConfig
);

// Composite selectors
export const selectUserVerificationSummary = createSelector(
  [selectUserIdentity, selectUserExternalProofs, selectUserBadges],
  (userIdentity, externalProofs, badges) => {
    if (!userIdentity) {
      return {
        hasVerifications: false,
        externalProofCount: 0,
        badgeCount: 0,
        verificationLevel: 'none' as const,
        trustScore: 0,
      };
    }
    
    return {
      hasVerifications: userIdentity.hasExternalProofs || userIdentity.hasBadges,
      externalProofCount: externalProofs.length,
      badgeCount: badges.length,
      verificationLevel: userIdentity.verificationLevel,
      trustScore: userIdentity.trustScore,
    };
  }
);

export default identityVerificationSlice.reducer; 

