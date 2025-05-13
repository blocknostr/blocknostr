
import * as React from "react";
import { profileDataService } from "@/lib/services/ProfileDataService";

export function useProfileFetcher() {
  const [profiles, setProfiles] = React.useState<Record<string, any>>({});
  
  const fetchProfileData = React.useCallback(async (pubkey: string) => {
    if (!pubkey || profiles[pubkey]) return;
    
    try {
      // This will trigger the profile data service to load the data
      const data = await profileDataService.loadProfileData(pubkey, null);
      
      if (data && data.metadata) {
        setProfiles(prev => ({
          ...prev,
          [pubkey]: data.metadata
        }));
      }
    } catch (error) {
      console.error(`Error fetching profile for ${pubkey}:`, error);
    }
  }, [profiles]);
  
  return {
    profiles,
    fetchProfileData
  };
}
