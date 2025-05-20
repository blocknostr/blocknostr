import React, { createContext, useContext, useState, useEffect } from 'react';
import { NostrProfile } from '@/lib/nostr/types';
import { nostrService } from '@/lib/nostr';
import { toast } from "sonner";

interface NostrContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  profile: NostrProfile | null;
  publicKey: string | null;
  login: () => Promise<boolean>;
  logout: () => void;
  updateProfile: (updatedProfile: NostrProfile) => Promise<boolean>;
}

const NostrContext = createContext<NostrContextType>({
  isAuthenticated: false,
  isLoading: true,
  profile: null,
  publicKey: null,
  login: async () => false,
  logout: () => {},
  updateProfile: async () => false,
});

export const NostrProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [profile, setProfile] = useState<NostrProfile | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if logged in by verifying if publicKey is available
        if (nostrService.publicKey) {
          const pubkey = nostrService.publicKey;
          setPublicKey(pubkey);
          setIsAuthenticated(true);
          
          // Fetch profile data
          const userProfileData = await nostrService.getUserProfile(pubkey);
          
          if (userProfileData) {
            let nip05Verified = false;
            if (userProfileData.nip05 && pubkey) {
              nip05Verified = await nostrService.verifyNip05(userProfileData.nip05, pubkey);
            }
            setProfile({
              pubkey,
              npub: nostrService.getNpubFromHex(pubkey),
              name: userProfileData.name,
              displayName: userProfileData.display_name,
              about: userProfileData.about,
              picture: userProfileData.picture,
              banner: userProfileData.banner,
              nip05: userProfileData.nip05,
              nip05Verified: nip05Verified, // Set nip05Verified status
              lud16: userProfileData.lud16,
              website: userProfileData.website
            });
          }
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Try to login with nostr service
      const success = await nostrService.login();
      
      if (success) {
        const pubkey = nostrService.publicKey;
        setPublicKey(pubkey);
        setIsAuthenticated(true);
        
        // Fetch profile data
        const userProfileData = await nostrService.getUserProfile(pubkey);
        
        if (userProfileData) {
          let nip05Verified = false;
          if (userProfileData.nip05 && pubkey) {
            nip05Verified = await nostrService.verifyNip05(userProfileData.nip05, pubkey);
          }
          setProfile({
            pubkey,
            npub: nostrService.getNpubFromHex(pubkey),
            name: userProfileData.name,
            displayName: userProfileData.display_name,
            about: userProfileData.about,
            picture: userProfileData.picture,
            banner: userProfileData.banner,
            nip05: userProfileData.nip05,
            nip05Verified: nip05Verified, // Set nip05Verified status
            lud16: userProfileData.lud16,
            website: userProfileData.website
          });
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    try {
      // Use signOut method from adapter
      nostrService.signOut();
      setIsAuthenticated(false);
      setPublicKey(null);
      setProfile(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const updateProfile = async (updatedProfile: NostrProfile): Promise<boolean> => {
    if (!isAuthenticated || !publicKey) return false;
    
    try {
      // Convert profile fields to format expected by nostrService
      const profileUpdateData = {
        name: updatedProfile.name,
        display_name: updatedProfile.displayName,
        about: updatedProfile.about,
        picture: updatedProfile.picture,
        banner: updatedProfile.banner,
        nip05: updatedProfile.nip05,
        lud16: updatedProfile.lud16,
        website: updatedProfile.website
      };
      
      // Update profile through nostrService
      const success = await nostrService.updateProfile(profileUpdateData);
      
      if (success) {
        let nip05Verified = false;
        if (updatedProfile.nip05 && publicKey) {
          nip05Verified = await nostrService.verifyNip05(updatedProfile.nip05, publicKey);
        }
        // Update local state
        setProfile({...updatedProfile, nip05Verified}); // Update nip05Verified status
        toast("Profile updated successfully");
        return true;
      } else {
        toast("Failed to update profile. Please try again.");
        return false;
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast("An error occurred while updating your profile");
      return false;
    }
  };

  const value = {
    isAuthenticated,
    isLoading,
    profile,
    publicKey,
    login,
    logout,
    updateProfile
  };

  return (
    <NostrContext.Provider value={value}>
      {children}
    </NostrContext.Provider>
  );
};

export const useNostr = () => useContext(NostrContext);

export default NostrContext;
