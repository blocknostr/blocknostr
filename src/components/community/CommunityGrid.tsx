
import CommunityCard, { Community } from "./CommunityCard";

interface CommunityGridProps {
  communities: Community[];
  isMemberView: boolean;
  currentUserPubkey: string | null;
}

const CommunityGrid = ({ communities, isMemberView, currentUserPubkey }: CommunityGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {communities.map(community => (
        <CommunityCard 
          key={community.id}
          community={community}
          isMember={isMemberView}
          currentUserPubkey={currentUserPubkey}
        />
      ))}
    </div>
  );
};

export default CommunityGrid;
