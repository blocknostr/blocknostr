
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Users, Shield, CoinIcon } from "lucide-react";
import CommunityCardHeader from "./CommunityCardHeader";
import CommunityCardActions from "./CommunityCardActions";
import { formatSerialNumber } from "@/lib/community-utils";
import LeaveCommunityButton from "./LeaveCommunityButton";
import { nostrService } from "@/lib/nostr";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export interface Community {
  id: string;
  name: string;
  description: string;
  image: string;
  creator: string;
  createdAt: number;
  members: string[];
  uniqueId: string;
  serialNumber?: number;
  onChain?: boolean;
  contractId?: string;
  txId?: string;
  minQuorum?: number;
}

interface CommunityCardProps {
  community: Community;
  isMember: boolean;
  currentUserPubkey: string | null;
}

const CommunityCard = ({ community, isMember, currentUserPubkey }: CommunityCardProps) => {
  const navigate = useNavigate();
  const isCreator = community.creator === currentUserPubkey;
  
  const navigateToCommunity = () => {
    navigate(`/communities/${community.id}`);
  };
  
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
  };

  const handleLeaveClick = () => {
    if (!currentUserPubkey) {
      return;
    }
    
    try {
      // Remove the current user from members
      const updatedMembers = community.members.filter(member => member !== currentUserPubkey);
      
      // Create an updated community event without the current user
      const communityData = {
        name: community.name,
        description: community.description,
        image: community.image,
        creator: community.creator,
        createdAt: community.createdAt,
        onChain: community.onChain,
        contractId: community.contractId,
        txId: community.txId
      };
      
      const event = {
        kind: 34550,
        content: JSON.stringify(communityData),
        tags: [
          ['d', community.uniqueId],
          ...updatedMembers.map(member => ['p', member])
        ]
      };
      
      // Handle the promise internally
      nostrService.publishEvent(event)
        .then((publishResult) => {
          if (publishResult) {
            toast.success("You have left the community");
          } else {
            toast.error("Failed to leave the community");
          }
        })
        .catch((error) => {
          console.error("Error leaving community:", error);
          toast.error("Failed to leave community");
        });
    } catch (error) {
      console.error("Error leaving community:", error);
      toast.error("Failed to leave community");
    }
  };

  return (
    <Card 
      className="overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col"
      onClick={navigateToCommunity}
    >
      <div className="relative">
        <CommunityCardHeader 
          id={community.id}
          name={community.name}
          image={community.image}
        />
        
        {/* Leave button - only shown for members who aren't creators */}
        {isMember && !isCreator && currentUserPubkey && (
          <div className="absolute top-2 right-2 z-10" onClick={e => e.stopPropagation()}>
            <LeaveCommunityButton 
              onLeave={handleLeaveClick}
              communityName={community.name}
              subtle={true}
            />
          </div>
        )}
      </div>
      
      <CardHeader className="pb-2 flex-none">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base line-clamp-1 flex items-center">
            {community.name}
            {community.onChain && (
              <CoinIcon className="h-4 w-4 ml-2 text-primary" />
            )}
          </CardTitle>
          
          {community.serialNumber && (
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-mono">
              {formatSerialNumber(community.serialNumber)}
            </span>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2 mt-1">
          {isMember && (
            <Badge variant="outline" className="bg-primary/20 text-primary border-primary/20">
              Member
            </Badge>
          )}
          
          {community.onChain && (
            <Badge variant="outline" className="bg-amber-500/20 text-amber-600 border-amber-500/20">
              On-chain DAO
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {community.description || "No description provided."}
        </p>
        
        <div className="flex items-center mt-4 text-xs text-muted-foreground">
          <Users className="h-3 w-3 mr-1" />
          <span>{community.members.length} members</span>
          <span className="mx-1">•</span>
          <span>Created {formatDate(community.createdAt)}</span>
        </div>
        
        {community.onChain && community.minQuorum && (
          <div className="flex items-center mt-1 text-xs text-muted-foreground">
            <Shield className="h-3 w-3 mr-1" />
            <span>Quorum: {community.minQuorum}%</span>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-3 border-t mt-auto">
        <CommunityCardActions 
          community={community}
          isMember={isMember}
          isCreator={isCreator}
          currentUserPubkey={currentUserPubkey}
        />
      </CardFooter>
    </Card>
  );
};

export default CommunityCard;
