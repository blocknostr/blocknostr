
import { Community } from "./CommunityCard";
import CommunityGrid from "./CommunityGrid";

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
        <h2 className="text-lg font-semibold mb-3 border-b pb-2 col-span-full">Discover Communities</h2>
      )}
      
      <CommunityGrid 
        communities={discoverCommunities}
        isMemberView={false}
        currentUserPubkey={currentUserPubkey}
      />
    </>
  );
};

export default DiscoverCommunitiesSection;
