
import { Community } from "./CommunityCard";
import CommunityGrid from "./CommunityGrid";
import { Search, Users } from "lucide-react";

interface DiscoverCommunitiesSectionProps {
  communities: Community[];
  userCommunities: Community[];
  currentUserPubkey: string | null;
}

const DiscoverCommunitiesSection = ({ 
  communities, 
  userCommunities,
  currentUserPubkey 
}: DiscoverCommunitiesSectionProps) => {
  // Filter out communities the user is already a member of
  const discoverCommunities = communities.filter(
    community => !community.members.includes(currentUserPubkey || '')
  );
  
  if (discoverCommunities.length === 0) {
    return null;
  }
  
  return (
    <>
      {userCommunities.length > 0 && (
        <div className="flex items-center gap-2 mb-4 pb-2 border-b">
          <Search className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Discover Communities</h2>
          <span className="bg-muted px-2 py-0.5 text-xs rounded-full ml-2">
            {discoverCommunities.length}
          </span>
        </div>
      )}
      
      <div className="mb-8">
        <CommunityGrid 
          communities={discoverCommunities}
          isMemberView={false}
          currentUserPubkey={currentUserPubkey}
        />
      </div>
    </>
  );
};

export default DiscoverCommunitiesSection;
