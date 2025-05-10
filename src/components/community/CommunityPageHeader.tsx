
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import DeleteCommunityButton from "./DeleteCommunityButton";

interface CommunityPageHeaderProps {
  name: string;
  isMember: boolean;
  isCreator: boolean;
  isCreatorOnlyMember?: boolean;
  currentUserPubkey: string | null;
  onJoinCommunity: () => void;
  onLeaveCommunity: () => void;  // Added this prop
  onDeleteCommunity?: () => Promise<void>;
}

const CommunityPageHeader = ({
  name,
  isMember,
  isCreator,
  isCreatorOnlyMember = false,
  currentUserPubkey,
  onJoinCommunity,
  onLeaveCommunity,  // Added this prop
  onDeleteCommunity
}: CommunityPageHeaderProps) => {
  return (
    <header className="sticky top-0 z-10 bg-background/95 backdrop-blur h-16 border-b flex items-center px-6">
      <div className="flex-1">
        <h1 className="text-lg font-bold truncate">{name}</h1>
      </div>
      
      <div className="flex items-center gap-2">
        {!isMember && !isCreator && currentUserPubkey && (
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
