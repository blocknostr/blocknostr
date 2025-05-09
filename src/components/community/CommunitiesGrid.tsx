
import { Loader2, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import CommunityCard, { Community } from "./CommunityCard";

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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (filteredCommunities.length === 0) {
    return (
      <div className="text-center col-span-full rounded-lg bg-muted/30 p-12">
        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-medium mb-2">No communities found</h3>
        <p className="text-muted-foreground mb-6">Create a new community to get started!</p>
        <Button onClick={onCreateCommunity}>
          <Plus className="h-4 w-4 mr-2" />
          Create Community
        </Button>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {userCommunities.length > 0 && (
        <div className="md:col-span-2 lg:col-span-3 mb-4">
          <h2 className="text-lg font-semibold mb-3 border-b pb-2">Your Communities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userCommunities.map(community => (
              <CommunityCard 
                key={community.id}
                community={community}
                isMember={true}
                currentUserPubkey={currentUserPubkey}
              />
            ))}
          </div>
        </div>
      )}
      
      {userCommunities.length > 0 && (
        <h2 className="text-lg font-semibold mb-3 border-b pb-2 col-span-full">Discover Communities</h2>
      )}
      
      {filteredCommunities
        .filter(community => !community.members.includes(currentUserPubkey || ''))
        .map(community => (
          <CommunityCard 
            key={community.id}
            community={community}
            isMember={false}
            currentUserPubkey={currentUserPubkey}
          />
        ))
      }
    </div>
  );
};

export default CommunitiesGrid;
