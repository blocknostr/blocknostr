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
import { retry } from "@/lib/utils/retry";

const YouPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileKey, setProfileKey] = useState(() => Date.now());
  const currentUserPubkey = nostrService.publicKey;
  const refreshTimeoutRef = useRef<number | null>(null);
  const profileSavedTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!currentUserPubkey) {
      toast.error("You must be logged in to view your profile");
      navigate("/");
      return;
    }
    setLoading(false);
  }, [currentUserPubkey, navigate]);

  const profileData = useProfileData({
    npub: currentUserPubkey ? nostrService.formatPubkey(currentUserPubkey) : undefined,
    currentUserPubkey,
    debugMode: false
  });

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const handleProfileRefreshed = (e: CustomEvent) => {
      console.log("[YOU PAGE] Received profileRefreshed event", e.detail);
      setProfileKey(Date.now());
    };

    const handleProfilePublished = (e: CustomEvent) => {
      console.log("[YOU PAGE] Received profilePublished event", e.detail);
      profileSavedTimeRef.current = Date.now();
    };

    window.addEventListener('profileRefreshed', handleProfileRefreshed as EventListener);
    window.addEventListener('profilePublished', handleProfilePublished as EventListener);

    return () => {
      window.removeEventListener('profileRefreshed', handleProfileRefreshed as EventListener);
      window.removeEventListener('profilePublished', handleProfilePublished as EventListener);
    };
  }, []);

  useEffect(() => {
    if (profileData.error) {
      toast.error(profileData.error);
    }
  }, [profileData.error]);

  const handleRefreshProfile = async () => {
    if (!currentUserPubkey) {
      console.log("[YOU PAGE] No current user pubkey, cannot refresh profile");
      return;
    }

    try {
      setRefreshing(true);
      console.log(`[YOU PAGE] Starting manual profile refresh for: ${currentUserPubkey}`);

      const refreshResult = await forceRefreshProfile(currentUserPubkey);

      if (!refreshResult) {
        console.log("[YOU PAGE] Profile refresh failed, attempting to reconnect relays");
        await nostrService.connectToDefaultRelays();
        await forceRefreshProfile(currentUserPubkey);
      }

      await profileData.refreshProfile();
      setProfileKey(Date.now());
      toast.success("Profile refreshed successfully");
    } catch (error) {
      console.error("[YOU PAGE] Error refreshing profile:", error);
      toast.error("Failed to refresh profile");
    } finally {
      setRefreshing(false);
    }
  };

  // Enhanced logging for signing and saving process
  const handleProfileSaved = useCallback(async () => {
    console.log("[YOU PAGE] Profile saved, exiting edit mode");
    setIsEditing(false);

    const shouldRefresh = !profileSavedTimeRef.current ||
      (Date.now() - profileSavedTimeRef.current) > 2000;

    console.log("[YOU PAGE] Should refresh:", shouldRefresh);

    if (shouldRefresh) {
      console.log("[YOU PAGE] Setting timeout to refresh profile after save");

      if (refreshTimeoutRef.current) {
        console.log("[YOU PAGE] Clearing existing refresh timeout");
        clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = window.setTimeout(async () => {
        try {
          console.log("[YOU PAGE] Starting profile refresh after save");
          setRefreshing(true);

          await new Promise(resolve => setTimeout(resolve, 1500));

          if (currentUserPubkey) {
            console.log(`[YOU PAGE] Forcing refresh for pubkey: ${currentUserPubkey}`);

            // Retry mechanism for relay connection and PoW handling
            await retry(async () => {
              console.log("[YOU PAGE] Attempting forceRefreshProfile");
              const refreshResult = await forceRefreshProfile(currentUserPubkey);

              console.log("[YOU PAGE] forceRefreshProfile result:", refreshResult);

              if (!refreshResult) {
                console.log("[YOU PAGE] Initial refresh failed, trying to reconnect relays");
                await nostrService.connectToDefaultRelays();
                console.log("[YOU PAGE] Reconnected to relays, retrying forceRefreshProfile");
                await forceRefreshProfile(currentUserPubkey);
              }
            }, {
              maxAttempts: 3,
              baseDelay: 2000,
              onRetry: (attempt) => {
                console.log(`[YOU PAGE] Retry attempt ${attempt} for profile refresh`);
                toast.info("Retrying profile refresh...");
              },
            });

            console.log("[YOU PAGE] Refreshing profile data");
            await profileData.refreshProfile();
          }

          setProfileKey(Date.now());
          console.log("[YOU PAGE] Profile refresh completed successfully");
        } catch (error) {
          if (error.message.includes("Unauthorized address")) {
            console.error("[YOU PAGE] Unauthorized address error:", error);
            console.log("[YOU PAGE] Expected address:", "d4AQouU6pE74tjvLdDhkkywUH1sESdVH9v96UofXMwUs");
            console.log("[YOU PAGE] Actual address:", error.actualAddress || "Unknown");
            toast.error("Unauthorized address. Please check your signing credentials.");
          } else {
            console.error("[YOU PAGE] Error refreshing after save:", error);
            toast.error("Failed to refresh profile. Please try again later.");
          }
        } finally {
          console.log("[YOU PAGE] Resetting refreshing state");
          setRefreshing(false);
        }
      }, 2500);
    }
  }, [profileData, currentUserPubkey]);

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  const handleImageError = (event) => {
    event.target.src = "/placeholder.svg"; // Use a placeholder image
    console.warn("[YOU PAGE] Image not found, using placeholder.");
  };

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
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefreshProfile}
              disabled={refreshing || profileData.loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing || profileData.loading ? 'animate-spin' : ''}`} />
              Refresh Profile
            </Button>
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
              <ProfilePreview profileData={{ ...profileData, key: profileKey }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YouPage;