
import { Loader2 } from "lucide-react";
import { Community } from "./CommunityCard";
import EmptyCommunityState from "./EmptyCommunityState";
import CommunityCard from "./CommunityCard";
import CommunityCardSkeleton from "./CommunityCardSkeleton";

interface CommunitiesGridProps {
  communities: Community[];
  loading?: boolean;
  emptyMessage?: string;
  currentUserPubkey: string | null;
  onCreateCommunity?: () => void;
}

const CommunitiesGrid = ({ 
  communities,
  loading = false,
  emptyMessage = "No communities found",
  currentUserPubkey,
  onCreateCommunity
}: CommunitiesGridProps) => {
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {[...Array(8)].map((_, index) => (
          <CommunityCardSkeleton key={index} />
        ))}
      </div>
    );
  }
  
  if (communities.length === 0) {
    return <EmptyCommunityState 
      message={emptyMessage} 
      onCreateCommunity={onCreateCommunity} 
    />;
  }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {communities.map(community => (
        <div key={community.id} className="animate-fade-in">
          <CommunityCard 
            community={community}
            isMember={(community.members || []).includes(currentUserPubkey || '')}
            currentUserPubkey={currentUserPubkey}
          />
        </div>
      ))}
    </div>
  );
};

export default CommunitiesGrid;
