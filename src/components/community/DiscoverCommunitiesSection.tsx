
import { Community } from "./CommunityCard";
import CommunityGrid from "./CommunityGrid";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { nostrService } from "@/lib/nostr";

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
  
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [joining, setJoining] = useState(false);
  const navigate = useNavigate();
  
  if (discoverCommunities.length === 0) {
    return null;
  }
  
  const handleJoinClick = async () => {
    if (!selectedCommunity) return;
    if (!currentUserPubkey) {
      toast.warning("Login required", {
        description: "You must be logged in to join a community"
      });
      return;
    }
    
    try {
      setJoining(true);
      // Get the existing community data and members
      const updatedMembers = [...selectedCommunity.members, currentUserPubkey];
      
      // Create an updated community event with the current user added as a member
      const communityData = {
        name: selectedCommunity.name,
        description: selectedCommunity.description,
        image: selectedCommunity.image,
        creator: selectedCommunity.creator,
        createdAt: selectedCommunity.createdAt
      };
      
      const event = {
        kind: 34550,
        content: JSON.stringify(communityData),
        tags: [
          ['d', selectedCommunity.uniqueId],
          ...updatedMembers.map(member => ['p', member])
        ]
      };
      
      const result = await nostrService.publishEvent(event);
      
      if (result) {
        toast.success(`Joined ${selectedCommunity.name}!`, {
          description: "You can now participate in this community",
          action: {
            label: "View",
            onClick: () => navigate(`/communities/${selectedCommunity.id}`),
          }
        });
        
        // Navigate to the community page after successful join
        setTimeout(() => {
          navigate(`/communities/${selectedCommunity.id}`);
        }, 500);
      } else {
        throw new Error("Failed to publish join event");
      }
    } catch (error) {
      console.error("Error joining community:", error);
      toast.error("Failed to join community", {
        description: "Please try again or check your connection"
      });
    } finally {
      setJoining(false);
      setSelectedCommunity(null);
    }
  };
  
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
        
        {selectedCommunity && (
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleJoinClick}
            disabled={joining}
            className="flex items-center gap-1"
          >
            {joining ? "Joining..." : `Join ${selectedCommunity.name}`}
          </Button>
        )}
      </div>
      
      <div className="mb-6">
        <p className="text-sm text-muted-foreground mb-4">
          Find new communities to join. Select a community card to view its details or join it directly.
        </p>
        <CommunityGrid 
          communities={discoverCommunities}
          isMemberView={false}
          currentUserPubkey={currentUserPubkey}
          onCommunitySelect={setSelectedCommunity}
          selectedCommunity={selectedCommunity}
        />
      </div>
    </div>
  );
};

export default DiscoverCommunitiesSection;
