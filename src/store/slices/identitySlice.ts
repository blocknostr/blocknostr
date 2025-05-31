import { createSlice, createAsyncThunk, createEntityAdapter, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';

// Identity verification interfaces
export interface IdentityVerification {
  id: string;
  pubkey: string;
  type: 'nip05' | 'social' | 'domain' | 'pgp' | 'github' | 'twitter' | 'lightning';
  identifier: string; // email, domain, username, etc.
  status: 'pending' | 'verified' | 'failed' | 'expired';
  verifiedAt?: number;
  expiresAt?: number;
  proof?: string; // Verification proof/signature
  metadata?: Record<string, any>;
  // Trust metrics
  trustScore: number; // 0-100
  verificationStrength: 'weak' | 'medium' | 'strong';
  // Social proof data
  socialProof?: {
    platform: string;
    username: string;
    followers?: number;
    verified?: boolean;
    profileUrl?: string;
  };
}

export interface ReputationScore {
  pubkey: string;
  overallScore: number; // 0-1000
  components: {
    identity: number; // Identity verification score
    social: number; // Social connections score
    activity: number; // Activity consistency score
    trust: number; // Community trust score
    longevity: number; // Account age score
  };
  badges: string[]; // Achievement badges
  rank: 'newcomer' | 'contributor' | 'trusted' | 'veteran' | 'legend';
  lastUpdated: number;
  history: Array<{
    timestamp: number;
    score: number;
    reason: string;
  }>;
}

export interface IdentityBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  criteria: {
    type: 'verification' | 'activity' | 'social' | 'contribution';
    requirements: Record<string, any>;
  };
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  issuedCount: number;
  holders: string[]; // pubkeys
}

export interface IdentityState {
  // Verification entities
  verifications: Record<string, IdentityVerification>;
  verificationIds: string[];
  // User verifications by pubkey
  userVerifications: Record<string, string[]>; // pubkey -> verification IDs
  // Reputation scores
  reputationScores: Record<string, ReputationScore>;
  // Badges
  badges: Record<string, IdentityBadge>;
  badgeIds: string[];
  userBadges: Record<string, string[]>; // pubkey -> badge IDs
  // Loading states
  loading: boolean;
  verifying: Record<string, boolean>; // verification ID -> loading state
  calculatingReputation: Record<string, boolean>; // pubkey -> loading state
  error: string | null;
  // Verification process
  activeVerification: {
    type: IdentityVerification['type'] | null;
    step: number;
    data: Record<string, any>;
  };
  // Trust network
  trustNetwork: {
    trustedBy: Record<string, string[]>; // pubkey -> trusted by pubkeys
    trusts: Record<string, string[]>; // pubkey -> trusts pubkeys
    webOfTrust: {
      nodes: Array<{ id: string; trust: number; verified: boolean }>;
      edges: Array<{ from: string; to: string; weight: number }>;
    };
  };
  // Analytics
  verificationStats: {
    totalVerifications: number;
    verificationsByType: Record<IdentityVerification['type'], number>;
    averageTrustScore: number;
    topVerifiedUsers: Array<{
      pubkey: string;
      verificationCount: number;
      trustScore: number;
    }>;
  };
  // Settings
  verificationSettings: {
    autoVerifyNip05: boolean;
    requireVerificationForTrust: boolean;
    minimumTrustScore: number;
    enableReputationSystem: boolean;
  };
}

// Entity adapters
const verificationsAdapter = createEntityAdapter<IdentityVerification>({
  selectId: (verification) => verification.id,
  sortComparer: (a, b) => {
    // Sort by verification strength, then by verified date
    const strengthOrder = { strong: 3, medium: 2, weak: 1 };
    if (strengthOrder[a.verificationStrength] !== strengthOrder[b.verificationStrength]) {
      return strengthOrder[b.verificationStrength] - strengthOrder[a.verificationStrength];
    }
    return (b.verifiedAt || 0) - (a.verifiedAt || 0);
  },
});

const badgesAdapter = createEntityAdapter<IdentityBadge>({
  selectId: (badge) => badge.id,
  sortComparer: (a, b) => {
    const rarityOrder = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
    return rarityOrder[b.rarity] - rarityOrder[a.rarity];
  },
});

// Initial state
const initialState: IdentityState = {
  ...verificationsAdapter.getInitialState(),
  verifications: {},
  verificationIds: [],
  userVerifications: {},
  reputationScores: {},
  badges: {},
  badgeIds: [],
  userBadges: {},
  loading: false,
  verifying: {},
  calculatingReputation: {},
  error: null,
  activeVerification: {
    type: null,
    step: 0,
    data: {},
  },
  trustNetwork: {
    trustedBy: {},
    trusts: {},
    webOfTrust: {
      nodes: [],
      edges: [],
    },
  },
  verificationStats: {
    totalVerifications: 0,
    verificationsByType: {
      nip05: 0,
      social: 0,
      domain: 0,
      pgp: 0,
      github: 0,
      twitter: 0,
      lightning: 0,
    },
    averageTrustScore: 0,
    topVerifiedUsers: [],
  },
  verificationSettings: {
    autoVerifyNip05: true,
    requireVerificationForTrust: false,
    minimumTrustScore: 50,
    enableReputationSystem: true,
  },
};

// Async thunks
export const verifyNip05 = createAsyncThunk(
  'identity/verifyNip05',
  async ({ pubkey, nip05 }: { pubkey: string; nip05: string }) => {
    try {
      // Parse NIP-05 identifier
      const [name, domain] = nip05.split('@');
      if (!name || !domain) {
        throw new Error('Invalid NIP-05 format');
      }

      // Fetch .well-known/nostr.json
      const response = await fetch(`https://${domain}/.well-known/nostr.json`);
      if (!response.ok) {
        throw new Error('Failed to fetch NIP-05 verification');
      }

      const data = await response.json();
      const verifiedPubkey = data.names?.[name];

      if (verifiedPubkey !== pubkey) {
        throw new Error('NIP-05 verification failed: pubkey mismatch');
      }

      const verification: IdentityVerification = {
        id: `nip05_${pubkey}_${Date.now()}`,
        pubkey,
        type: 'nip05',
        identifier: nip05,
        status: 'verified',
        verifiedAt: Date.now(),
        trustScore: 75,
        verificationStrength: 'strong',
        proof: JSON.stringify(data),
      };

      return verification;
    } catch (error) {
      console.error('NIP-05 verification failed:', error);
      throw error;
    }
  }
);

export const verifySocialProof = createAsyncThunk(
  'identity/verifySocialProof',
  async ({ 
    pubkey, 
    platform, 
    username, 
    proofUrl 
  }: { 
    pubkey: string; 
    platform: string; 
    username: string; 
    proofUrl: string; 
  }) => {
    try {
      // In a real implementation, this would verify the social proof
      // For now, we'll create a mock verification
      const verification: IdentityVerification = {
        id: `social_${platform}_${pubkey}_${Date.now()}`,
        pubkey,
        type: 'social',
        identifier: `${platform}:${username}`,
        status: 'verified',
        verifiedAt: Date.now(),
        trustScore: 60,
        verificationStrength: 'medium',
        socialProof: {
          platform,
          username,
          profileUrl: proofUrl,
          verified: true,
        },
      };

      return verification;
    } catch (error) {
      console.error('Social proof verification failed:', error);
      throw error;
    }
  }
);

export const calculateReputationScore = createAsyncThunk(
  'identity/calculateReputationScore',
  async (pubkey: string, { getState }) => {
    try {
      const state = getState() as RootState;
      
      // Get user's verifications
      const userVerificationIds = state.identity.userVerifications[pubkey] || [];
      const verifications = userVerificationIds.map(id => state.identity.verifications[id]);
      
      // Calculate component scores
      const identityScore = Math.min(100, verifications.reduce((sum, v) => sum + v.trustScore, 0));
      const socialScore = 50; // Mock social connections score
      const activityScore = 60; // Mock activity score
      const trustScore = 70; // Mock community trust score
      const longevityScore = 40; // Mock account age score
      
      const overallScore = Math.round(
        (identityScore * 0.3 + socialScore * 0.2 + activityScore * 0.2 + trustScore * 0.2 + longevityScore * 0.1)
      );
      
      // Determine rank
      let rank: ReputationScore['rank'] = 'newcomer';
      if (overallScore >= 800) rank = 'legend';
      else if (overallScore >= 600) rank = 'veteran';
      else if (overallScore >= 400) rank = 'trusted';
      else if (overallScore >= 200) rank = 'contributor';
      
      // Award badges based on achievements
      const badges: string[] = [];
      if (identityScore >= 100) badges.push('verified_identity');
      if (verifications.some(v => v.type === 'nip05')) badges.push('nip05_verified');
      if (verifications.length >= 3) badges.push('multi_verified');
      
      const reputationScore: ReputationScore = {
        pubkey,
        overallScore,
        components: {
          identity: identityScore,
          social: socialScore,
          activity: activityScore,
          trust: trustScore,
          longevity: longevityScore,
        },
        badges,
        rank,
        lastUpdated: Date.now(),
        history: [{
          timestamp: Date.now(),
          score: overallScore,
          reason: 'Initial calculation',
        }],
      };
      
      return reputationScore;
    } catch (error) {
      console.error('Error calculating reputation score:', error);
      throw error;
    }
  }
);

export const fetchUserVerifications = createAsyncThunk(
  'identity/fetchUserVerifications',
  async (pubkey: string) => {
    try {
      // In a real implementation, this would fetch from Nostr relays
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Error fetching user verifications:', error);
      throw error;
    }
  }
);

// Slice definition
const identitySlice = createSlice({
  name: 'identity',
  initialState,
  reducers: {
    addVerification: (state, action: PayloadAction<IdentityVerification>) => {
      const verification = action.payload;
      state.verifications[verification.id] = verification;
      
      if (!state.userVerifications[verification.pubkey]) {
        state.userVerifications[verification.pubkey] = [];
      }
      state.userVerifications[verification.pubkey].push(verification.id);
      
      state.verificationStats.totalVerifications++;
      state.verificationStats.verificationsByType[verification.type]++;
    },
    
    updateVerification: (state, action: PayloadAction<{ id: string; changes: Partial<IdentityVerification> }>) => {
      const { id, changes } = action.payload;
      if (state.verifications[id]) {
        state.verifications[id] = { ...state.verifications[id], ...changes };
      }
    },
    
    removeVerification: (state, action: PayloadAction<string>) => {
      const verification = state.verifications[action.payload];
      if (verification) {
        delete state.verifications[action.payload];
        
        const userVerifications = state.userVerifications[verification.pubkey];
        if (userVerifications) {
          state.userVerifications[verification.pubkey] = userVerifications.filter(id => id !== action.payload);
        }
        
        state.verificationStats.totalVerifications--;
        state.verificationStats.verificationsByType[verification.type]--;
      }
    },
    
    setActiveVerification: (state, action: PayloadAction<Partial<IdentityState['activeVerification']>>) => {
      state.activeVerification = { ...state.activeVerification, ...action.payload };
    },
    
    clearActiveVerification: (state) => {
      state.activeVerification = {
        type: null,
        step: 0,
        data: {},
      };
    },
    
    addTrustRelation: (state, action: PayloadAction<{ truster: string; trusted: string }>) => {
      const { truster, trusted } = action.payload;
      
      if (!state.trustNetwork.trusts[truster]) {
        state.trustNetwork.trusts[truster] = [];
      }
      if (!state.trustNetwork.trustedBy[trusted]) {
        state.trustNetwork.trustedBy[trusted] = [];
      }
      
      if (!state.trustNetwork.trusts[truster].includes(trusted)) {
        state.trustNetwork.trusts[truster].push(trusted);
      }
      if (!state.trustNetwork.trustedBy[trusted].includes(truster)) {
        state.trustNetwork.trustedBy[trusted].push(truster);
      }
    },
    
    removeTrustRelation: (state, action: PayloadAction<{ truster: string; trusted: string }>) => {
      const { truster, trusted } = action.payload;
      
      if (state.trustNetwork.trusts[truster]) {
        state.trustNetwork.trusts[truster] = state.trustNetwork.trusts[truster].filter(p => p !== trusted);
      }
      if (state.trustNetwork.trustedBy[trusted]) {
        state.trustNetwork.trustedBy[trusted] = state.trustNetwork.trustedBy[trusted].filter(p => p !== truster);
      }
    },
    
    updateVerificationSettings: (state, action: PayloadAction<Partial<IdentityState['verificationSettings']>>) => {
      state.verificationSettings = { ...state.verificationSettings, ...action.payload };
    },
    
    awardBadge: (state, action: PayloadAction<{ pubkey: string; badgeId: string }>) => {
      const { pubkey, badgeId } = action.payload;
      
      if (!state.userBadges[pubkey]) {
        state.userBadges[pubkey] = [];
      }
      
      if (!state.userBadges[pubkey].includes(badgeId)) {
        state.userBadges[pubkey].push(badgeId);
        
        if (state.badges[badgeId]) {
          state.badges[badgeId].holders.push(pubkey);
          state.badges[badgeId].issuedCount++;
        }
      }
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Verify NIP-05
      .addCase(verifyNip05.pending, (state, action) => {
        state.verifying[`nip05_${action.meta.arg.pubkey}`] = true;
        state.error = null;
      })
      .addCase(verifyNip05.fulfilled, (state, action) => {
        const verification = action.payload;
        state.verifications[verification.id] = verification;
        
        if (!state.userVerifications[verification.pubkey]) {
          state.userVerifications[verification.pubkey] = [];
        }
        state.userVerifications[verification.pubkey].push(verification.id);
        
        state.verifying[`nip05_${verification.pubkey}`] = false;
        state.verificationStats.totalVerifications++;
        state.verificationStats.verificationsByType.nip05++;
      })
      .addCase(verifyNip05.rejected, (state, action) => {
        const pubkey = action.meta.arg.pubkey;
        state.verifying[`nip05_${pubkey}`] = false;
        state.error = action.error.message || 'NIP-05 verification failed';
      })
      
      // Verify social proof
      .addCase(verifySocialProof.pending, (state, action) => {
        const { pubkey, platform } = action.meta.arg;
        state.verifying[`social_${platform}_${pubkey}`] = true;
        state.error = null;
      })
      .addCase(verifySocialProof.fulfilled, (state, action) => {
        const verification = action.payload;
        state.verifications[verification.id] = verification;
        
        if (!state.userVerifications[verification.pubkey]) {
          state.userVerifications[verification.pubkey] = [];
        }
        state.userVerifications[verification.pubkey].push(verification.id);
        
        state.verifying[verification.id] = false;
        state.verificationStats.totalVerifications++;
        state.verificationStats.verificationsByType.social++;
      })
      .addCase(verifySocialProof.rejected, (state, action) => {
        const { pubkey, platform } = action.meta.arg;
        state.verifying[`social_${platform}_${pubkey}`] = false;
        state.error = action.error.message || 'Social proof verification failed';
      })
      
      // Calculate reputation
      .addCase(calculateReputationScore.pending, (state, action) => {
        state.calculatingReputation[action.meta.arg] = true;
      })
      .addCase(calculateReputationScore.fulfilled, (state, action) => {
        const reputation = action.payload;
        state.reputationScores[reputation.pubkey] = reputation;
        state.calculatingReputation[reputation.pubkey] = false;
      })
      .addCase(calculateReputationScore.rejected, (state, action) => {
        const pubkey = action.meta.arg;
        state.calculatingReputation[pubkey] = false;
        state.error = action.error.message || 'Failed to calculate reputation';
      });
  },
});

// Export actions
export const {
  addVerification,
  updateVerification,
  removeVerification,
  setActiveVerification,
  clearActiveVerification,
  addTrustRelation,
  removeTrustRelation,
  updateVerificationSettings,
  awardBadge,
} = identitySlice.actions;

// Export selectors
export const selectUserVerifications = (state: RootState, pubkey: string) => {
  const verificationIds = state.identity.userVerifications[pubkey] || [];
  return verificationIds.map(id => state.identity.verifications[id]).filter(Boolean);
};

export const selectUserReputation = (state: RootState, pubkey: string) => {
  return state.identity.reputationScores[pubkey];
};

export const selectUserBadges = (state: RootState, pubkey: string) => {
  const badgeIds = state.identity.userBadges[pubkey] || [];
  return badgeIds.map(id => state.identity.badges[id]).filter(Boolean);
};

export const selectVerificationStats = (state: RootState) => state.identity.verificationStats;

export const selectTrustNetwork = (state: RootState) => state.identity.trustNetwork;

export const selectIdentityLoadingState = (state: RootState) => ({
  loading: state.identity.loading,
  verifying: state.identity.verifying,
  calculatingReputation: state.identity.calculatingReputation,
  error: state.identity.error,
});

export const selectVerificationSettings = (state: RootState) => state.identity.verificationSettings;

export const selectActiveVerification = (state: RootState) => state.identity.activeVerification;

// Selector to get NIP-05 verification status for a specific pubkey
export const selectNip05VerificationStatus = (state: RootState, pubkey: string) => {
  const verificationIds = state.identity.userVerifications[pubkey] || [];
  const nip05Verification = verificationIds
    .map(id => state.identity.verifications[id])
    .find(verification => verification?.type === 'nip05');
  
  return {
    isVerified: nip05Verification?.status === 'verified',
    isVerifying: state.identity.verifying[`nip05_${pubkey}`] || false,
    verification: nip05Verification || null,
    error: nip05Verification?.status === 'failed' ? 'Verification failed' : null
  };
};

export default identitySlice.reducer; 
