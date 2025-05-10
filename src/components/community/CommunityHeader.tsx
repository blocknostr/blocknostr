
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
  onLeaveCommunity: () => void; // Added prop
}

const CommunityHeader = ({ 
  community, 
  currentUserPubkey, 
  isCreator, 
  isMember,
  onLeaveCommunity
}: CommunityHeaderProps) => {
  const navigate = useNavigate();

  const handleLeaveCommunity = async () => {
    await onLeaveCommunity();
    navigate('/communities');
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
          <LeaveCommunityButton 
            onLeave={handleLeaveCommunity} 
            communityName={community.name} 
          />
        )}
      </CardContent>
    </Card>
  );
};

export default CommunityHeader;
