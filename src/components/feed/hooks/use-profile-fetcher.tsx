
import * as React from "react";
import { profileDataService } from "@/lib/services/ProfileDataService";

export function useProfileFetcher() {
  const [profiles, setProfiles] = React.useState<Record<string, any>>({});
  const [fetchErrors, setFetchErrors] = React.useState<Record<string, string>>({});
  
  const fetchProfileData = React.useCallback(async (pubkey: string) => {
    if (!pubkey) {
      console.warn("useProfileFetcher: No pubkey provided");
      return;
    }
    
    if (profiles[pubkey]) {
      console.log("useProfileFetcher: Profile already loaded:", pubkey);
      return;
    }
    
    console.log("useProfileFetcher: Fetching profile for:", pubkey);
    
    try {
      // This will trigger the profile data service to load the data
      const data = await profileDataService.loadProfileData(pubkey, null);
      
      if (data && data.metadata) {
        console.log("useProfileFetcher: Profile loaded:", data.metadata.name || data.metadata.display_name || pubkey);
        setProfiles(prev => ({
          ...prev,
          [pubkey]: data.metadata
        }));
        
        // Clear any previous errors
        if (fetchErrors[pubkey]) {
          setFetchErrors(prev => {
            const newErrors = {...prev};
            delete newErrors[pubkey];
            return newErrors;
          });
        }
      } else {
        console.warn("useProfileFetcher: No metadata returned for:", pubkey);
        setFetchErrors(prev => ({
          ...prev,
          [pubkey]: "No profile data found"
        }));
      }
    } catch (error) {
      console.error(`Error fetching profile for ${pubkey}:`, error);
      setFetchErrors(prev => ({
        ...prev,
        [pubkey]: error instanceof Error ? error.message : "Unknown error"
      }));
    }
  }, [profiles, fetchErrors]);
  
  return {
    profiles,
    fetchProfileData,
    fetchErrors
  };
}
