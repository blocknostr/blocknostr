
import { create } from 'zustand';
import { ProfileData, ProfileLoadingState } from '@/lib/services/profile/types';
import { profileDataService } from '@/lib/services/ProfileDataService';

export interface ProfileState {
  // Core data
  profileData: ProfileData | null;
  currentPubkey: string | null;
  
  // Status
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  loadingStates: Record<string, ProfileLoadingState>;
  
  // Actions
  loadProfile: (npub: string | undefined, currentUserPubkey: string | null) => Promise<ProfileData | null>;
  refreshProfile: (npub: string | undefined, currentUserPubkey: string | null) => Promise<void>;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  setRefreshing: (isRefreshing: boolean) => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  // Core data
  profileData: null,
  currentPubkey: null,
  
  // Status
  loading: true,
  refreshing: false,
  error: null,
  loadingStates: {},
  
  // Actions
  loadProfile: async (npub, currentUserPubkey) => {
    set({ loading: true, error: null });
    
    try {
      const data = await profileDataService.loadProfileData(npub, currentUserPubkey);
      set({ 
        profileData: data, 
        loading: false, 
        currentPubkey: data.hexPubkey 
      });
      return data;
    } catch (error) {
      console.error("Error loading profile:", error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load profile data',
        loading: false 
      });
      return null;
    }
  },
  
  refreshProfile: async (npub, currentUserPubkey) => {
    set({ refreshing: true, error: null });
    
    try {
      await profileDataService.refreshProfileData(npub, currentUserPubkey);
      // Note: Data updates will happen through events - no need to set profileData here
    } catch (error) {
      console.error("Error refreshing profile:", error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to refresh profile data',
        refreshing: false 
      });
    }
  },
  
  setError: (error) => set({ error }),
  setLoading: (isLoading) => set({ loading: isLoading }),
  setRefreshing: (isRefreshing) => set({ refreshing: isRefreshing })
}));
