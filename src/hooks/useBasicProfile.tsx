
import { useState, useEffect } from "react";
import { simpleProfileService } from "@/lib/services/profile/simpleProfileService";

/**
 * Simple hook to fetch basic profile information
 */
export function useBasicProfile(pubkeyOrNpub: string | undefined) {
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pubkeyOrNpub) return;
    
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const profileData = await simpleProfileService.getProfileMetadata(pubkeyOrNpub);
        setProfile(profileData);
      } catch (error) {
        console.error("Error fetching basic profile:", error);
        setError(error instanceof Error ? error.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [pubkeyOrNpub]);

  return { profile, loading, error };
}
