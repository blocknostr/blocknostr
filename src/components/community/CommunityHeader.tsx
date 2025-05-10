
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { nostrService } from "@/lib/nostr";
import { useNavigate } from "react-router-dom";
import CommunityHeaderImage from "./CommunityHeaderImage";
import CommunityDescription from "./CommunityDescription";
import LeaveCommunityButton from "./LeaveCommunityButton";

interface Community {
  id: string;
  name: string;
  description: string;
  image: string;
  creator: string;
  createdAt: number;
  members: string[];
  uniqueId: string;
}

interface CommunityHeaderProps {
  community: Community;
  currentUserPubkey: string | null;
  isCreator: boolean;
  isMember: boolean;
}

const CommunityHeader = ({ 
  community, 
  currentUserPubkey, 
  isCreator, 
  isMember 
}: CommunityHeaderProps) => {
  const navigate = useNavigate();

  const handleLeaveCommunity = async () => {
    if (!currentUserPubkey) return;
    
    try {
      // Remove user from members list
      const updatedMembers = community.members.filter(member => member !== currentUserPubkey);
      
      // Create an updated community event without the current user
      const communityData = {
        name: community.name,
        description: community.description,
        image: community.image,
        creator: community.creator,
        createdAt: community.createdAt
      };
      
      const event = {
        kind: 34550,
        content: JSON.stringify(communityData),
        tags: [
          ['d', community.uniqueId],
          ...updatedMembers.map(member => ['p', member])
        ]
      };
      
      await nostrService.publishEvent(event);
      toast.success("You have left the community");
      
      // Redirect back to communities list
      navigate('/communities');
    } catch (error) {
      console.error("Error leaving community:", error);
      toast.error("Failed to leave community");
    }
  };
  
  return (
    <Card>
      <CommunityHeaderImage 
        id={community.id}
        name={community.name}
        image={community.image}
      />
      
      <CardContent className="pt-6">
        <CommunityDescription 
          description={community.description}
          membersCount={community.members.length}
          createdAt={community.createdAt}
        />
        
        {isMember && !isCreator && (
          <LeaveCommunityButton onLeave={handleLeaveCommunity} />
        )}
      </CardContent>
    </Card>
  );
};

export default CommunityHeader;
