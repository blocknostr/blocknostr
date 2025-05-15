
import CommunityCard, { Community } from "./CommunityCard";

interface CommunityGridProps {
  communities: Community[];
  isMemberView: boolean;
  currentUserPubkey: string | null;
}

const CommunityGrid = ({ communities, isMemberView, currentUserPubkey }: CommunityGridProps) => {
  // Ensure communities is always an array to prevent rendering errors
  const safeCommunities = Array.isArray(communities) ? communities : [];
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {safeCommunities.map(community => (
        <CommunityCard 
          key={community.id || `community-${Math.random()}`}
          community={community}
          isMember={isMemberView}
          currentUserPubkey={currentUserPubkey}
        />
      ))}
      
      {safeCommunities.length === 0 && (
        <div className="col-span-full text-center py-10">
          <p className="text-muted-foreground">No communities found</p>
        </div>
      )}
    </div>
  );
};

export default CommunityGrid;
