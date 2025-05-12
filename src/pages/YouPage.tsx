
import { useState, useEffect, useCallback } from 'react';
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
  const [profileKey, setProfileKey] = useState(Date.now());
  const currentUserPubkey = nostrService.publicKey;
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!currentUserPubkey) {
      toast.error("You must be logged in to view your profile");
      navigate("/");
      return;
    }
    setLoading(false);
  }, [currentUserPubkey, navigate]);

  // Use the existing profile data hook but specifically for the current user
  const profileData = useProfileData({
    npub: currentUserPubkey ? nostrService.formatPubkey(currentUserPubkey) : undefined,
    currentUserPubkey
  });

  // Track edit mode state locally
  const [isEditing, setIsEditing] = useState(false);
  
  // Handle connection errors
  useEffect(() => {
    if (profileData.error) {
      toast.error(profileData.error);
    }
  }, [profileData.error]);
  
  // Function to manually refresh profile with improved error handling
  const handleRefreshProfile = async () => {
    if (!currentUserPubkey) return;
    
    try {
      setRefreshing(true);
      await forceRefreshProfile(currentUserPubkey);
      
      // Refetch profile data using the hook's refetch method
      await profileData.refreshProfile();
      
      // Force re-render by updating the key
      setProfileKey(Date.now());
      
      toast.success("Profile refreshed successfully");
    } catch (error) {
      console.error("Error refreshing profile:", error);
      toast.error("Failed to refresh profile");
    } finally {
      setRefreshing(false);
    }
  };

  // Handle profile changes after saving with improved refresh
  const handleProfileSaved = useCallback(async () => {
    setIsEditing(false);
    
    // Force refresh to show latest changes with a slight delay
    setTimeout(async () => {
      try {
        setRefreshing(true);
        // Ensure cache is cleared and fresh profile is fetched
        if (currentUserPubkey) {
          await forceRefreshProfile(currentUserPubkey);
          await profileData.refreshProfile();
        }
        
        // Force re-render of the profile preview
        setProfileKey(Date.now());
        
        console.log("Profile updated and refreshed successfully");
      } catch (error) {
        console.error("Error refreshing after save:", error);
      } finally {
        setRefreshing(false);
      }
    }, 1000);
  }, [profileData, currentUserPubkey]);

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
    return null; // This shouldn't happen due to the redirect above
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
          {/* Header with basic info and toggle for edit mode */}
          <YouHeader 
            profileData={profileData} 
            isEditing={isEditing} 
            toggleEditing={() => setIsEditing(!isEditing)} 
          />

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left side: Edit form or profile stats based on mode (takes 3/5 of grid) */}
            <div className="lg:col-span-3 space-y-6">
              {isEditing ? (
                <EditProfileSection 
                  profileData={profileData.profileData} 
                  onSaved={handleProfileSaved} 
                />
              ) : (
                <div className="space-y-6">
                  {/* Display profile content when not editing */}
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
            
            {/* Right side: Always show profile preview (takes 2/5 of grid) */}
            <div className="lg:col-span-2">
              <ProfilePreview profileData={{...profileData, key: profileKey}} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YouPage;
