
import { Button } from "@/components/ui/button";
import { UserPlus, Lock } from "lucide-react";
import DeleteCommunityButton from "./DeleteCommunityButton";
import { useNavigate } from "react-router-dom";
import BackButton from "@/components/navigation/BackButton";

interface CommunityPageHeaderProps {
  name: string;
  isMember: boolean;
  isCreator: boolean;
  isCreatorOnlyMember?: boolean;
  currentUserPubkey: string | null;
  onJoinCommunity: () => void;
  onLeaveCommunity: () => void;
  onDeleteCommunity?: () => Promise<void>;
  isPrivate?: boolean;
}

const CommunityPageHeader = ({
  name,
  isMember,
  isCreator,
  isCreatorOnlyMember = false,
  currentUserPubkey,
  onJoinCommunity,
  onLeaveCommunity,
  onDeleteCommunity,
  isPrivate = false
}: CommunityPageHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-10 bg-background/95 backdrop-blur h-16 border-b flex items-center px-6">
      <BackButton className="mr-2" showText={true} />
      
      <div className="flex-1">
        <div className="flex items-center">
          <h1 className="text-lg font-bold truncate">{name}</h1>
          {isPrivate && (
            <Lock className="h-3.5 w-3.5 ml-2 text-muted-foreground" />
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {!isMember && !isCreator && currentUserPubkey && !isPrivate && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onJoinCommunity}
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Join Community
          </Button>
        )}
        
        {isCreator && isCreatorOnlyMember && onDeleteCommunity && (
          <DeleteCommunityButton 
            communityName={name}
            onDelete={onDeleteCommunity}
          />
        )}
      </div>
    </header>
  );
};

export default CommunityPageHeader;
