
import { Loader2 } from "lucide-react";
import { Community } from "./CommunityCard";
import EmptyCommunityState from "./EmptyCommunityState";
import UserCommunitiesSection from "./UserCommunitiesSection";
import DiscoverCommunitiesSection from "./DiscoverCommunitiesSection";

interface CommunitiesGridProps {
  communities: Community[];
  userCommunities: Community[];
  filteredCommunities: Community[];
  loading: boolean;
  currentUserPubkey: string | null;
  onCreateCommunity: () => void;
}

const CommunitiesGrid = ({ 
  communities,
  userCommunities,
  filteredCommunities,
  loading,
  currentUserPubkey,
  onCreateCommunity
}: CommunitiesGridProps) => {
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 w-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (filteredCommunities.length === 0) {
    return (
      <div className="py-4">
        <EmptyCommunityState onCreateCommunity={onCreateCommunity} />
      </div>
    );
  }
  
  return (
    <div className="space-y-10 animate-fade-in">
      {userCommunities.length > 0 && (
        <UserCommunitiesSection 
          communities={userCommunities}
          currentUserPubkey={currentUserPubkey}
        />
      )}
      
      <DiscoverCommunitiesSection 
        communities={filteredCommunities}
        userCommunities={userCommunities}
        currentUserPubkey={currentUserPubkey}
      />
    </div>
  );
};

export default CommunitiesGrid;
