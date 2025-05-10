
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Users } from "lucide-react";
import CommunityCardHeader from "./CommunityCardHeader";
import CommunityCardActions from "./CommunityCardActions";
import { formatSerialNumber } from "@/lib/community-utils";

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

  return (
    <Card 
      className={`overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col ${isMember ? 'border-primary/30' : ''}`}
      onClick={navigateToCommunity}
    >
      <CommunityCardHeader 
        id={community.id}
        name={community.name}
        image={community.image}
      />
      
      <CardHeader className="pb-2 flex-none">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base line-clamp-1">{community.name}</CardTitle>
          
          {community.serialNumber && (
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-mono">
              {formatSerialNumber(community.serialNumber)}
            </span>
          )}
        </div>
        
        {isMember && (
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full self-start mt-1">
            Member
          </span>
        )}
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
