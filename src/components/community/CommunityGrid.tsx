
import { Community } from "./CommunityCard";
import CommunityCard from "./CommunityCard";

interface CommunityGridProps {
  communities: Community[];
  isMemberView: boolean;
  currentUserPubkey: string | null;
  onCommunitySelect?: (community: Community | null) => void;
  selectedCommunity?: Community | null;
}

const CommunityGrid = ({ 
  communities, 
  isMemberView,
  currentUserPubkey,
  onCommunitySelect,
  selectedCommunity
}: CommunityGridProps) => {
  if (communities.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        No communities found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in">
      {communities.map((community) => {
        const isMember = community.members.includes(currentUserPubkey || '');
        const isSelected = selectedCommunity?.id === community.id;
        
        return (
          <CommunityCard
            key={community.id}
            community={community}
            isMember={isMemberView || isMember}
            currentUserPubkey={currentUserPubkey}
            isSelected={isSelected}
            onSelect={onCommunitySelect ? () => onCommunitySelect(community) : undefined}
          />
        );
      })}
    </div>
  );
};

export default CommunityGrid;
