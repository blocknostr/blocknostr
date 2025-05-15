
import { Community } from "./CommunityCard";
import CommunityGrid from "./CommunityGrid";
import { Compass } from "lucide-react";

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
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 pb-2 border-b">
        <div className="flex items-center">
          <Compass className="h-5 w-5 text-primary mr-2" />
          <h2 className="text-lg font-semibold">Discover Communities</h2>
          <span className="bg-muted px-2 py-0.5 text-xs rounded-full ml-2">
            {discoverCommunities.length}
          </span>
        </div>
      </div>
      
      <div className="mb-6">
        <p className="text-sm text-muted-foreground mb-4">
          Find new communities to join. Click a card to view details or use the Join button to become a member instantly.
        </p>
        <CommunityGrid 
          communities={discoverCommunities}
          isMemberView={false}
          currentUserPubkey={currentUserPubkey}
        />
      </div>
    </div>
  );
};

export default DiscoverCommunitiesSection;
