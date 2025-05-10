
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
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
  onLeaveCommunity: () => void;
}

const CommunityHeader = ({ 
  community, 
  currentUserPubkey, 
  isCreator, 
  isMember,
  onLeaveCommunity
}: CommunityHeaderProps) => {
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
            onLeave={onLeaveCommunity} 
            communityName={community.name} 
          />
        )}
      </CardContent>
    </Card>
  );
};

export default CommunityHeader;
