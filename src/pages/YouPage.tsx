
import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { nostrService } from "@/lib/nostr";
import { toast } from "sonner";
import { useProfileData } from "@/hooks/useProfileData";
import Sidebar from "@/components/Sidebar";
import YouPageHeader from "@/components/you/YouPageHeader";
import YouPageContent from "@/components/you/YouPageContent";
import YouPageLoading from "@/components/you/YouPageLoading";
import { useYouPageSubscriptions } from '@/hooks/useYouPageSubscriptions';
import { useProfileRefreshHandler } from '@/hooks/useProfileRefreshHandler';

const YouPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profileKey, setProfileKey] = useState(() => Date.now());
  const [isEditing, setIsEditing] = useState(false);
  
  const currentUserPubkey = nostrService.publicKey;

  // Get subscription references
  const { 
    refreshTimeoutRef, 
    profileSavedTimeRef, 
    subscriptionsRef 
  } = useYouPageSubscriptions();

  // Check auth state
  useEffect(() => {
    if (!currentUserPubkey) {
      toast.error("You must be logged in to view your profile");
      navigate("/");
      return;
    }
    setLoading(false);
  }, [currentUserPubkey, navigate]);

  // Load profile data
  const profileData = useProfileData({
    npub: currentUserPubkey ? nostrService.formatPubkey(currentUserPubkey) : undefined,
    currentUserPubkey,
    debugMode: false
  });

  // Set up profile refresh handler
  const { 
    refreshing, 
    handleRefreshProfile,
    handleProfileSaved 
  } = useProfileRefreshHandler({ 
    currentUserPubkey, 
    refreshProfile: profileData.refreshProfile,
    profileSavedTimeRef,
    refreshTimeoutRef 
  });

  // Listen for profile events
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
  }, [profileSavedTimeRef]);
  
  // Handle when profile is saved
  const onProfileSaved = async () => {
    setIsEditing(false);
    await handleProfileSaved();
  };

  if (loading) {
    return <YouPageLoading />;
  }

  if (!currentUserPubkey) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 ml-0 md:ml-64">
        <YouPageHeader 
          refreshing={refreshing} 
          onRefresh={handleRefreshProfile}
        />
        
        <YouPageContent 
          profileData={profileData}
          isEditing={isEditing}
          toggleEditing={() => setIsEditing(!isEditing)}
          onSaved={onProfileSaved}
          profileKey={profileKey}
        />
      </div>
    </div>
  );
};

export default YouPage;
