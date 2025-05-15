
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Community } from "../community/CommunityCard";
import DAOCard from "./DAOCard";
import { Skeleton } from "@/components/ui/skeleton";

interface DAOGridProps {
  communities: Community[];
  userCommunities: Community[];
  filteredCommunities: Community[];
  loading: boolean;
  currentUserPubkey: string | null;
  onCreateCommunity: () => void;
  searchTerm: string;
}

const DAOGrid = ({
  communities,
  userCommunities,
  filteredCommunities,
  loading,
  currentUserPubkey,
  onCreateCommunity,
  searchTerm
}: DAOGridProps) => {
  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Loading DAOs...</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-4">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-10 w-1/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (communities.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">No DAOs found</h2>
        <p className="text-muted-foreground mb-6">
          Be the first to create a DAO on BlockNostr!
        </p>
        <Button onClick={onCreateCommunity}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Create your first DAO
        </Button>
      </div>
    );
  }

  const hasUserCommunities = userCommunities.length > 0;
  const shouldShowFiltered =
    filteredCommunities.length !== communities.length || filteredCommunities.length === 0;

  return (
    <div className="space-y-8">
      {hasUserCommunities && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your DAOs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userCommunities.map((community) => (
              <DAOCard
                key={community.id}
                community={community}
                isUserMember={true}
                currentUserPubkey={currentUserPubkey}
              />
            ))}
          </div>
        </div>
      )}

      {filteredCommunities.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            {shouldShowFiltered ? "Search Results" : "All DAOs"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCommunities.map((community) => (
              <DAOCard
                key={community.id}
                community={community}
                isUserMember={userCommunities.some((c) => c.id === community.id)}
                currentUserPubkey={currentUserPubkey}
              />
            ))}
          </div>
        </div>
      )}

      {filteredCommunities.length === 0 && searchTerm !== "" && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No DAOs match your search criteria.</p>
        </div>
      )}
    </div>
  );
};

export default DAOGrid;
