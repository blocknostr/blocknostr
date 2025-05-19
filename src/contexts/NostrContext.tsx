
import React, { createContext, useContext, useState, useEffect } from 'react';
import { NostrProfile } from '@/lib/nostr/types';
import { nostrService } from '@/lib/nostr';
import { toast } from '@/components/ui/use-toast';

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
        if (nostrService.isLoggedIn()) {
          const pubkey = nostrService.publicKey;
          setPublicKey(pubkey);
          setIsAuthenticated(true);
          
          // Fetch profile data
          const userProfile = await nostrService.getUserProfile(pubkey);
          
          if (userProfile) {
            setProfile({
              pubkey,
              npub: nostrService.getNpubFromHex(pubkey),
              name: userProfile.name,
              displayName: userProfile.display_name,
              about: userProfile.about,
              picture: userProfile.picture,
              banner: userProfile.banner,
              nip05: userProfile.nip05,
              lud16: userProfile.lud16,
              website: userProfile.website
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
        const userProfile = await nostrService.getUserProfile(pubkey);
        
        if (userProfile) {
          setProfile({
            pubkey,
            npub: nostrService.getNpubFromHex(pubkey),
            name: userProfile.name,
            displayName: userProfile.display_name,
            about: userProfile.about,
            picture: userProfile.picture,
            banner: userProfile.banner,
            nip05: userProfile.nip05,
            lud16: userProfile.lud16,
            website: userProfile.website
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
      nostrService.logout();
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
      const profileUpdate = {
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
      const success = await nostrService.updateProfile(profileUpdate);
      
      if (success) {
        // Update local state
        setProfile(updatedProfile);
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully"
        });
        return true;
      } else {
        toast({
          title: "Update failed",
          description: "Failed to update profile. Please try again.",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update error",
        description: "An error occurred while updating your profile",
        variant: "destructive"
      });
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
