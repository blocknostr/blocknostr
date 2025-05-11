
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { nostrService } from "@/lib/nostr";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
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
  isPrivate?: boolean;
  tags?: string[];
}

interface CommunityHeaderProps {
  community: Community;
  currentUserPubkey: string | null;
  userRole: 'creator' | 'moderator' | 'member' | null;
  onLeaveCommunity: () => void;
}

const CommunityHeader = ({ 
  community, 
  currentUserPubkey, 
  userRole,
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
      
      <CardContent className="pt-6 space-y-4">
        <CommunityDescription 
          description={community.description}
          membersCount={community.members.length}
          createdAt={community.createdAt}
          isPrivate={community.isPrivate}
        />
        
        {/* Tags */}
        {community.tags && community.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {community.tags.map(tag => (
              <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
          </div>
        )}
        
        {userRole === 'member' && (
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
