import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { nostrService } from "@/lib/nostr";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";
import { useProfileData } from "@/hooks/useProfileData";
import YouHeader from "@/components/you/YouHeader";
import EditProfileSection from "@/components/you/EditProfileSection";
import ProfilePreview from "@/components/you/ProfilePreview";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { forceRefreshProfile } from "@/components/you/profile/profileUtils";

const YouPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileKey, setProfileKey] = useState(() => Date.now());
  const [showDebug, setShowDebug] = useState(false);
  const currentUserPubkey = nostrService.publicKey;
  const refreshTimeoutRef = useRef<number | null>(null);
  const profileSavedTimeRef = useRef<number | null>(null);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!currentUserPubkey) {
      toast.error("You must be logged in to view your profile", { duration: 8000 });
      navigate("/");
      return;
    }
    setLoading(false);
  }, [currentUserPubkey, navigate]);

  // Profile data hook
  const profileData = useProfileData({
    npub: currentUserPubkey ? nostrService.formatPubkey(currentUserPubkey) : undefined,
    currentUserPubkey,
    debugMode: false
  });

  const [isEditing, setIsEditing] = useState(false);
  
  // Event listeners
  useEffect(() => {
    const handleProfileRefreshed = (e: CustomEvent) => {
      console.log("[YOU PAGE] Received profileRefreshed event", e.detail);
      setProfileKey(Date.now());
    };
    
    const handleProfilePublished = (e: CustomEvent) => {
      console.log("[YOU PAGE] Received profilePublished event", e.detail);
      profileSavedTimeRef.current = Date.now();
      const eventId = e.detail?.eventId;
      if (eventId) {
        console.log(`[YOU PAGE] Profile published with event ID: ${eventId}`);
      }
    };
    
    window.addEventListener('profileRefreshed', handleProfileRefreshed as EventListener);
    window.addEventListener('profilePublished', handleProfilePublished as EventListener);
    
    return () => {
      window.removeEventListener('profileRefreshed', handleProfileRefreshed as EventListener);
      window.removeEventListener('profilePublished', handleProfilePublished as EventListener);
    };
  }, []);

  // Handle connection errors
  useEffect(() => {
    if (profileData.error) {
      toast.error(profileData.error, { duration: 8000 });
    }
  }, [profileData.error]);
  
  // Manual refresh
  const handleRefreshProfile = async () => {
    if (!currentUserPubkey) {
      console.log("[YOU PAGE] No current user pubkey, cannot refresh profile");
      return;
    }
    
    try {
      setRefreshing(true);
      console.log(`[YOU PAGE] Starting manual profile refresh for: ${currentUserPubkey}`);
      
      const relaysBefore = nostrService.getRelayStatus();
      console.log("[YOU PAGE] Relay status before refresh:", relaysBefore);
      
      const refreshResult = await forceRefreshProfile(currentUserPubkey);
      
      if (!refreshResult) {
        console.log("[YOU PAGE] Profile refresh failed, attempting to reconnect relays");
        await nostrService.connectToDefaultRelays();
        await forceRefreshProfile(currentUserPubkey);
      }
      
      console.log("[YOU PAGE] Calling profile data refresh method");
      await profileData.refreshProfile();
      
      console.log("[YOU PAGE] Updating profile key to force re-render");
      setProfileKey(Date.now());
      
      toast.success("Profile refreshed successfully");
    } catch (error) {
      console.error("[YOU PAGE] Error refreshing profile:", error);
      toast.error("Failed to refresh profile", { duration: 8000 });
    } finally {
      setRefreshing(false);
    }
  };

  // Handle profile save
  const handleProfileSaved = useCallback(async () => {
    console.log("[YOU PAGE] Profile saved, exiting edit mode");
    setIsEditing(false);
    
    const shouldRefresh = !profileSavedTimeRef.current || 
                         (Date.now() - profileSavedTimeRef.current) > 2000;
    
    if (shouldRefresh) {
      console.log("[YOU PAGE] Setting timeout to refresh profile after save");
      
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      refreshTimeoutRef.current = window.setTimeout(async () => {
        try {
          console.log("[YOU PAGE] Starting profile refresh after save");
          setRefreshing(true);
          
          console.log("[YOU PAGE] Waiting for relay propagation before refreshing");
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          if (currentUserPubkey) {
            console.log(`[YOU PAGE] Forcing refresh for pubkey: ${currentUserPubkey}`);
            const refreshResult = await forceRefreshProfile(currentUserPubkey);
            
            if (!refreshResult) {
              console.log("[YOU PAGE] Initial refresh failed, trying to reconnect relays");
              await nostrService.connectToDefaultRelays();
              await forceRefreshProfile(currentUserPubkey);
            }
            
            console.log("[YOU PAGE] Force refresh completed, refreshing profile data");
            await profileData.refreshProfile();
            console.log("[YOU PAGE] Profile data refresh completed");
          }
          
          console.log("[YOU PAGE] Updating profile key to force re-render");
          setProfileKey(Date.now());
          toast.success("Profile updated and refreshed successfully");
        } catch (error) {
          console.error("[YOU PAGE] Error refreshing after save:", error);
          toast.error("Profile saved but failed to refresh. Try refreshing manually.", { duration: 8000 });
        } finally {
          setRefreshing(false);
          console.log("[YOU PAGE] Profile refresh after save completed");
        }
      }, 3000);
    } else {
      console.log("[YOU PAGE] Skipping refresh as we just received a profilePublished event");
    }
    
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [profileData, currentUserPubkey]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 ml-0 md:ml-64 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading your profile...</span>
        </div>
      </div>
    );
  }

  if (!currentUserPubkey) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 ml-0 md:ml-64">
        <header className="sticky top-0 bg-background/80 backdrop-blur-sm z-10 border-b">
          <div className="flex items-center justify-between h-14 px-4">
            <h1 className="font-semibold">Your Profile</h1>
            <div className="flex space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleRefreshProfile}
                disabled={refreshing || profileData.loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing || profileData.loading ? 'animate-spin' : ''}`} />
                Refresh Profile
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowDebug(!showDebug)}
              >
                {showDebug ? 'Hide Debug' : 'Show Debug'}
              </Button>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-6">
          <YouHeader 
            profileData={profileData} 
            isEditing={isEditing} 
            toggleEditing={() => setIsEditing(!isEditing)} 
          />

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-6">
              {isEditing ? (
                <EditProfileSection 
                  profileData={profileData.profileData} 
                  onSaved={handleProfileSaved} 
                />
              ) : (
                <div className="space-y-6">
                  {profileData.profileData?.about && (
                    <div className="bg-card rounded-lg p-6 shadow">
                      <h2 className="text-lg font-medium mb-2">About</h2>
                      <p className="whitespace-pre-wrap text-card-foreground">{profileData.profileData.about}</p>
                    </div>
                  )}
                  <div className="bg-card rounded-lg p-6 shadow">
                    <h2 className="text-lg font-medium mb-4">Stats</h2>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold">{profileData.events.length}</div>
                        <div className="text-sm text-muted-foreground">Posts</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{profileData.following.length}</div>
                        <div className="text-sm text-muted-foreground">Following</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{profileData.followers.length}</div>
                        <div className="text-sm text-muted-foreground">Followers</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="lg:col-span-2">
              <ProfilePreview profileData={{...profileData, key: profileKey}} />
            </div>
          </div>

          {showDebug && (
            <div className="bg-card p-4 rounded-lg shadow mt-4">
              <h2 className="text-lg font-medium mb-2">Debug Info</h2>
              <pre className="text-sm overflow-auto">
                {JSON.stringify({
                  relayStatus: nostrService.getRelayStatus(),
                  recentErrors: profileData.error || 'None',
                  profileData: profileData.profileData,
                }, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default YouPage;