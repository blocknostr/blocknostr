import { 
  createSlice, 
  PayloadAction,
  createSelector,
  createEntityAdapter
} from '@reduxjs/toolkit';
import { ProfileData } from '@/lib/services/profile/types';
import { RootState } from '../index';

// Entity adapter for normalized profile storage
const profilesAdapter = createEntityAdapter<ProfileData>({
  selectId: (profile) => profile.pubkey,
});

// ✅ SIMPLIFIED PROFILE STATE - RTK Query as single source of truth
interface ProfileState {
  // Sync state only - RTK Query handles fetching
  entities: Record<string, ProfileData>;
  ids: string[];
  
  // UI state only
  updating: Record<string, boolean>;
  
  // Cache management (passive)
  cacheTimestamps: Record<string, number>;
}

const initialState: ProfileState = profilesAdapter.getInitialState({
  updating: {},
  cacheTimestamps: {},
});

// ✅ SIMPLIFIED PROFILE SLICE - No thunks, just sync operations
const profileSlice = createSlice({
  name: 'profiles',
  initialState,
  reducers: {
    // ✅ Optimistic sync with RTK Query (no race conditions)
    profileSynced: (state, action: PayloadAction<ProfileData>) => {
      const profile = action.payload;
      profilesAdapter.upsertOne(state, profile);
      state.cacheTimestamps[profile.pubkey] = Date.now();
    },
    
    // ✅ Batch sync for multiple profiles
    profilesBatchSynced: (state, action: PayloadAction<ProfileData[]>) => {
      const profiles = action.payload;
      profilesAdapter.upsertMany(state, profiles);
      profiles.forEach(profile => {
        state.cacheTimestamps[profile.pubkey] = Date.now();
      });
    },
    
    // ✅ UI-only updates
    setUpdating: (state, action: PayloadAction<{ pubkey: string; updating: boolean }>) => {
      const { pubkey, updating } = action.payload;
      state.updating[pubkey] = updating;
    },
    
    // ✅ Local profile updates (optimistic updates)
    profileUpdated: (state, action: PayloadAction<{ pubkey: string; updates: Partial<ProfileData> }>) => {
      const { pubkey, updates } = action.payload;
      const existingProfile = state.entities[pubkey];
      if (existingProfile) {
        profilesAdapter.updateOne(state, {
          id: pubkey,
          changes: updates
        });
        state.cacheTimestamps[pubkey] = Date.now();
      }
    },
    
    // ✅ Clear cache for refresh
    clearProfileCache: (state, action: PayloadAction<string>) => {
      const pubkey = action.payload;
      delete state.cacheTimestamps[pubkey];
    },
  },
});

export const { 
  profileSynced, 
  profilesBatchSynced, 
  setUpdating, 
  profileUpdated, 
  clearProfileCache 
} = profileSlice.actions;

// ✅ Entity adapter selectors
export const {
  selectAll: selectAllProfiles,
  selectById: selectProfile,
  selectIds: selectProfileIds,
  selectEntities: selectProfileEntities,
} = profilesAdapter.getSelectors((state: RootState) => state.profiles);

// ✅ Simplified selectors (UI state only)
export const selectProfileUpdating = (state: RootState, pubkey: string) => 
  state.profiles.updating[pubkey] || false;

export const selectProfileCacheTimestamp = (state: RootState, pubkey: string) => 
  state.profiles.cacheTimestamps[pubkey] || 0;

// ✅ Helper selectors
export const selectProfilesCount = createSelector(
  [selectAllProfiles],
  (profiles) => profiles.length
);

export const selectProfilesWithPictures = createSelector(
  [selectAllProfiles],
  (profiles) => profiles.filter(p => p.picture)
);

export default profileSlice.reducer; 
