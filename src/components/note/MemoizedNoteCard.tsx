
import React, { useEffect, useState } from 'react';
import { NostrEvent } from '@/lib/nostr';
import NoteCardStructure from './structure/NoteCardStructure';
import { unifiedProfileService } from '@/lib/services/UnifiedProfileService';

interface NoteCardProps {
  event: NostrEvent;
  profileData?: Record<string, any>;
  hideActions?: boolean;
  repostData?: {
    reposterPubkey: string;
    reposterProfile?: Record<string, any>;
  };
  isReply?: boolean;
  reactionData?: {
    emoji: string;
    reactionEvent: NostrEvent;
  };
}

const NoteCard = (props: NoteCardProps) => {
  const [profile, setProfile] = useState(props.profileData);
  const [reposterProfile, setReposterProfile] = useState(props.repostData?.reposterProfile);
  
  // Effect to fetch profiles if not provided
  useEffect(() => {
    // Update if profile data props change
    if (props.profileData) {
      setProfile(props.profileData);
    }
    
    if (props.repostData?.reposterProfile) {
      setReposterProfile(props.repostData.reposterProfile);
    }
    
    // If we have a pubkey but no profile, fetch it
    if (props.event?.pubkey && !props.profileData) {
      const fetchProfile = async () => {
        try {
          const profileData = await unifiedProfileService.getProfile(props.event.pubkey);
          if (profileData) {
            setProfile(profileData);
          }
        } catch (error) {
          console.error(`[NoteCard] Error fetching profile for ${props.event.pubkey.substring(0, 8)}:`, error);
        }
      };
      
      fetchProfile();
      
      // Subscribe to profile updates
      const unsubscribe = unifiedProfileService.subscribeToUpdates(props.event.pubkey, (updatedProfile) => {
        if (updatedProfile) {
          console.log(`[NoteCard] Received profile update for ${props.event.pubkey.substring(0, 8)}:`,
            updatedProfile.name || updatedProfile.display_name);
          setProfile(updatedProfile);
        }
      });
      
      return () => unsubscribe();
    }
  }, [props.event?.pubkey, props.profileData, props.repostData]);
  
  // Effect to fetch reposter profile if not provided
  useEffect(() => {
    if (props.repostData?.reposterPubkey && !props.repostData.reposterProfile) {
      const fetchReposterProfile = async () => {
        try {
          const reposterProfileData = await unifiedProfileService.getProfile(props.repostData!.reposterPubkey);
          if (reposterProfileData) {
            setReposterProfile(reposterProfileData);
          }
        } catch (error) {
          console.error(`[NoteCard] Error fetching reposter profile for ${props.repostData!.reposterPubkey.substring(0, 8)}:`, error);
        }
      };
      
      fetchReposterProfile();
      
      // Subscribe to reposter profile updates
      const unsubscribe = unifiedProfileService.subscribeToUpdates(props.repostData.reposterPubkey, (updatedProfile) => {
        if (updatedProfile) {
          setReposterProfile(updatedProfile);
        }
      });
      
      return () => unsubscribe();
    }
  }, [props.repostData]);

  if (!props.event) {
    return null;
  }
  
  console.log(`[MemoizedNoteCard] Rendering note with pubkey ${props.event.pubkey?.substring(0, 8)}, has profile: ${!!profile}`, 
    profile?.name || profile?.display_name);

  return <NoteCardStructure 
    event={props.event}
    profileData={profile}
    hideActions={props.hideActions}
    repostData={props.repostData ? {
      reposterPubkey: props.repostData.reposterPubkey,
      reposterProfile: reposterProfile
    } : undefined}
    isReply={props.isReply}
    reactionData={props.reactionData}
  />;
};

// Use React.memo to prevent unnecessary re-renders but with improved profile data handling
export default React.memo(NoteCard, (prevProps, nextProps) => {
  // Always re-render if the event ID has changed
  if (prevProps.event?.id !== nextProps.event?.id) {
    return false; // Don't skip render
  }
  
  // If we have new profile data but didn't have it before (or it changed), re-render
  if (!prevProps.profileData && nextProps.profileData) {
    return false; // Don't skip render
  }
  
  if (prevProps.profileData !== nextProps.profileData &&
      (prevProps.profileData?.name !== nextProps.profileData?.name ||
       prevProps.profileData?.display_name !== nextProps.profileData?.display_name)) {
    return false; // Don't skip render if name or display_name changed
  }
  
  // If repost data has changed, re-render
  if (JSON.stringify(prevProps.repostData) !== JSON.stringify(nextProps.repostData)) {
    return false; // Don't skip render
  }
  
  // Default equality check for other props
  return (
    prevProps.hideActions === nextProps.hideActions &&
    prevProps.isReply === nextProps.isReply &&
    prevProps.event === nextProps.event &&
    JSON.stringify(prevProps.reactionData) === JSON.stringify(nextProps.reactionData)
  );
});
