
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { nostrService } from "@/lib/nostr";
import Sidebar from "@/components/Sidebar";
import { Loader2 } from "lucide-react";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileStats from "@/components/profile/ProfileStats";
import ProfileTabs from "@/components/profile/ProfileTabs";
import { useProfilePageData } from "@/hooks/useProfilePageData";

const ProfilePage = () => {
  const { npub } = useParams();
  const navigate = useNavigate();
  
  const {
    profileData,
    events,
    media,
    reposts,
    loading,
    relays,
    followers,
    following,
    originalPostProfiles,
    isCurrentUser,
    currentUserPubkey,
    handleRetweetStatusChange
  } = useProfilePageData(npub);
  
  // Show current user's profile if no npub is provided
  useEffect(() => {
    if (!npub && currentUserPubkey) {
      window.location.href = `/profile/${nostrService.formatPubkey(currentUserPubkey)}`;
    }
  }, [npub, currentUserPubkey]);
  
  const handleMessageUser = () => {
    if (!npub) return;
    
    // Navigate to messages page
    navigate('/messages');
    
    // We'll let the messages page handle loading the contact
    localStorage.setItem('lastMessagedUser', npub);
  };
  
  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 ml-0 md:ml-64 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 ml-0 md:ml-64">
        <header className="border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
          <div className="flex items-center h-14 px-4">
            <h1 className="font-semibold">Profile</h1>
          </div>
        </header>
        
        <div className="max-w-3xl mx-auto px-4 py-4">
          <ProfileHeader 
            profileData={profileData}
            npub={npub || ''}
            isCurrentUser={isCurrentUser}
            onMessage={handleMessageUser}
          />
          
          <ProfileStats 
            followers={followers}
            following={following}
            postsCount={events.length + reposts.length}
            relays={relays.filter(r => r.status === 'connected').length}
            isCurrentUser={isCurrentUser}
          />
          
          {/* Tabbed Content */}
          <div className="mt-6">
            <ProfileTabs
              events={events}
              reposts={reposts}
              media={media}
              profileData={profileData}
              originalPostProfiles={originalPostProfiles}
              onRetweetStatusChange={handleRetweetStatusChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
