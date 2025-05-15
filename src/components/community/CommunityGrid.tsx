
import { Community } from "./CommunityCard";
import CommunityCard from "./CommunityCard";

interface CommunityGridProps {
  communities: Community[];
  isMemberView: boolean;
  currentUserPubkey: string | null;
}

const CommunityGrid = ({ 
  communities, 
  isMemberView,
  currentUserPubkey
}: CommunityGridProps) => {
  if (communities.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        No communities found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
      {communities.map((community) => {
        const isMember = community.members.includes(currentUserPubkey || '');
        
        return (
          <CommunityCard
            key={community.id}
            community={community}
            isMember={isMemberView || isMember}
            currentUserPubkey={currentUserPubkey}
          />
        );
      })}
    </div>
  );
};

export default CommunityGrid;
