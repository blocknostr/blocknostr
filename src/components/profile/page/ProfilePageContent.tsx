
import React from "react";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileStats from "@/components/profile/ProfileStats";
import ProfileTabs from "@/components/profile/ProfileTabs";
import ProfileNotFound from "@/components/profile/ProfileNotFound";
import ProfileEmptyState from "./ProfileEmptyState";
import ProfileErrorAlert from "./ProfileErrorAlert";
import { NostrEvent, nostrService } from "@/lib/nostr";

interface ProfilePageContentProps {
  profileData: any;
  error: string | null;
  events: NostrEvent[];
  media: NostrEvent[];
  reposts: any[];
  replies: NostrEvent[];
  reactions: NostrEvent[];
  referencedEvents: Record<string, NostrEvent>;
  followers: string[];
  following: string[];
  relays: any[];
  originalPostProfiles: Record<string, any>;
  isCurrentUser: boolean;
  currentUserPubkey: string | null;
  npub: string | undefined;
  refreshing: boolean;
  handleRefresh: () => void;
  setRelays: (relays: any[]) => void;
}

const ProfilePageContent: React.FC<ProfilePageContentProps> = ({
  profileData,
  error,
  events,
  media,
  reposts,
  replies,
  reactions,
  referencedEvents,
  followers,
  following,
  relays,
  originalPostProfiles,
  isCurrentUser,
  currentUserPubkey,
  npub,
  refreshing,
  handleRefresh,
  setRelays,
}) => {
  const formattedNpub = npub || (currentUserPubkey ? nostrService.formatPubkey(currentUserPubkey) : "");

  return (
    <div className="max-w-3xl mx-auto px-4 py-4">
      {error && <ProfileErrorAlert error={error} handleRefresh={handleRefresh} />}

      {profileData ? (
        <>
          <ProfileHeader
            profileData={profileData}
            npub={formattedNpub}
            isCurrentUser={isCurrentUser}
          />

          <ProfileStats
            followers={followers}
            following={following}
            postsCount={events.length + reposts.length}
            currentUserPubkey={currentUserPubkey}
            isCurrentUser={isCurrentUser}
            relays={relays}
            onRelaysChange={setRelays}
            userNpub={npub}
            onRefresh={handleRefresh}
            isLoading={refreshing}
          />

          <ProfileTabs
            events={events}
            media={media}
            reposts={reposts}
            profileData={profileData}
            originalPostProfiles={originalPostProfiles}
            replies={replies}
            reactions={reactions}
            referencedEvents={referencedEvents}
          />

          {events.length === 0 && reposts.length === 0 && !refreshing && (
            <ProfileEmptyState 
              isCurrentUser={isCurrentUser}
              handleRefresh={handleRefresh}
            />
          )}
        </>
      ) : (
        <ProfileNotFound />
      )}
    </div>
  );
};

export default ProfilePageContent;
