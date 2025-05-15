
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { useProfileFetcher } from "../feed/hooks/use-profile-fetcher";
import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict } from "date-fns";
import { Link } from "react-router-dom";
import { cacheManager } from "@/lib/utils/cacheManager";

// Display profiles with verified NIP-05 identities
const TrendingSection: React.FC = () => {
  const [verifiedProfiles, setVerifiedProfiles] = React.useState<Array<{
    pubkey: string;
    profile: any;
    lastActivity?: number;
  }>>([]);
  
  const [loading, setLoading] = React.useState(true);
  const { profiles, fetchProfileData } = useProfileFetcher();
  
  React.useEffect(() => {
    // Try to load from cache first
    const cachedProfiles = cacheManager.get<Array<{ pubkey: string; profile: any; lastActivity?: number }>>('verified-profiles');
    
    if (cachedProfiles && cachedProfiles.length > 0) {
      setVerifiedProfiles(cachedProfiles);
      setLoading(false);
      
      // Also refresh each profile data
      cachedProfiles.forEach(item => {
        fetchProfileData(item.pubkey);
      });
    }
    
    // Simulate getting verified profiles from relays
    // In a real implementation, this would query multiple relays for profiles with NIP-05
    const fetchVerifiedProfiles = async () => {
      setLoading(true);
      
      // This is just placeholder data - in a real implementation we'd query relays
      // for profiles with valid nip05 fields
      const mockVerifiedProfiles = [
        { 
          pubkey: "npub1sg6plzptd64u62a878hep2kev88swjh3tw00gjsfl8f237lmu63q0uf63m", 
          lastActivity: Date.now() - 1000 * 60 * 30 
        },
        { 
          pubkey: "npub1j8tkc5cmjqmtdw7m7vjhw2vca3fheqwmvy8qmc0qg579tn0n588sgca8fw", 
          lastActivity: Date.now() - 1000 * 60 * 60 * 2
        },
        { 
          pubkey: "npub1s5yq6wadwrxde4lhfs56gn64hwzuhnfa6r9mj476r5s4hkunzgzqrs0mxa", 
          lastActivity: Date.now() - 1000 * 60 * 15
        }
      ];
      
      // Fetch profile data for each mock profile
      for (const item of mockVerifiedProfiles) {
        fetchProfileData(item.pubkey);
      }
      
      // Wait for profiles to load
      setTimeout(() => {
        const profilesWithData = mockVerifiedProfiles
          .map(item => ({
            pubkey: item.pubkey,
            profile: profiles[item.pubkey],
            lastActivity: item.lastActivity
          }))
          .filter(item => item.profile && item.profile.nip05);
        
        setVerifiedProfiles(profilesWithData);
        setLoading(false);
        
        // Cache the result
        cacheManager.set('verified-profiles', profilesWithData, 10 * 60 * 1000); // 10 minutes
      }, 1000);
    };
    
    if (!cachedProfiles || cachedProfiles.length === 0) {
      fetchVerifiedProfiles();
    }
  }, [fetchProfileData]);

  // Update profiles when they load
  React.useEffect(() => {
    if (Object.keys(profiles).length > 0 && verifiedProfiles.length > 0) {
      setVerifiedProfiles(prev => 
        prev.map(item => ({
          ...item,
          profile: profiles[item.pubkey] || item.profile
        }))
      );
    }
  }, [profiles]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>Verified Profiles</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-2">
        {loading ? (
          <div className="py-6 flex items-center justify-center">
            <div className="animate-pulse text-primary opacity-50">Loading...</div>
          </div>
        ) : verifiedProfiles.length > 0 ? (
          <div className="space-y-3 pt-1">
            {verifiedProfiles.map((item) => (
              <Link
                key={item.pubkey}
                to={`/profile/${item.pubkey}`}
                className="flex items-center gap-2 rounded-md p-1.5 hover:bg-muted/50 transition-colors"
              >
                {item.profile?.picture ? (
                  <img
                    src={item.profile.picture}
                    alt={item.profile.display_name || item.profile.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-xs">{(item.profile?.name || item.profile?.display_name || "?")[0]}</span>
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {item.profile?.display_name || item.profile?.name || item.pubkey.substring(0, 9)}
                  </div>
                  
                  <div className="text-xs text-muted-foreground flex items-center">
                    <span className={cn(
                      "inline-flex items-center mr-1",
                      "text-emerald-600 dark:text-emerald-500"
                    )}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1"></span>
                      {item.profile?.nip05}
                    </span>
                  </div>
                </div>
                
                {item.lastActivity && (
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNowStrict(item.lastActivity, { addSuffix: true })}
                  </div>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No verified profiles found
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrendingSection;
