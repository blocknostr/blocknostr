
import React, { createContext, useContext, useState } from "react";
import { nostrService } from "@/lib/nostr";
import { NostrProfile } from "@/types/nostr";

interface NostrContextType {
  isAuthenticated: boolean;
  profile: NostrProfile | null;
  publicKey: string | null;
  updateProfile: (profile: NostrProfile) => Promise<boolean>;
}

const NostrContext = createContext<NostrContextType>({
  isAuthenticated: false,
  profile: null,
  publicKey: null,
  updateProfile: async () => false
});

export const NostrProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<NostrProfile | null>(null);
  
  const isAuthenticated = !!nostrService.publicKey;
  const publicKey = nostrService.publicKey;
  
  const updateProfile = async (updatedProfile: NostrProfile): Promise<boolean> => {
    try {
      // Call the nostrService to update the profile
      const success = await nostrService.updateProfile(updatedProfile);
      
      if (success) {
        setProfile(updatedProfile);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Failed to update profile:", error);
      return false;
    }
  };
  
  return (
    <NostrContext.Provider value={{
      isAuthenticated,
      profile,
      publicKey,
      updateProfile
    }}>
      {children}
    </NostrContext.Provider>
  );
};

export const useNostr = () => useContext(NostrContext);
