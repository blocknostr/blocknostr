
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Users } from "lucide-react";
import CommunityCardHeader from "./CommunityCardHeader";
import CommunityCardActions from "./CommunityCardActions";

export interface Community {
  id: string;
  name: string;
  description: string;
  image: string;
  creator: string;
  createdAt: number;
  members: string[];
  uniqueId: string;
  serialNumber?: number; // Added serial number property
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
      className={`overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${isMember ? 'border-primary/30' : ''}`}
      onClick={navigateToCommunity}
    >
      <CommunityCardHeader 
        id={community.id}
        name={community.name}
        image={community.image}
        serialNumber={community.serialNumber}
      />
      
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <span>{community.name}</span>
          {isMember && (
            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
              Member
            </span>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2 h-10">
          {community.description || "No description provided."}
        </p>
        
        <div className="flex items-center mt-4 text-xs text-muted-foreground">
          <Users className="h-3 w-3 mr-1" />
          <span>{community.members.length} members</span>
          <span className="mx-1">•</span>
          <span>Created {formatDate(community.createdAt)}</span>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
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
