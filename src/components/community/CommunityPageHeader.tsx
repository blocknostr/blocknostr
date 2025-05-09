
import { ArrowLeft, Check, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface CommunityPageHeaderProps {
  name: string;
  isMember: boolean;
  isCreator: boolean;
  currentUserPubkey: string | null;
  onJoinCommunity: () => void;
}

const CommunityPageHeader = ({ 
  name,
  isMember,
  isCreator,
  currentUserPubkey,
  onJoinCommunity
}: CommunityPageHeaderProps) => {
  const navigate = useNavigate();
  
  return (
    <header className="border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/communities')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">{name}</h1>
        </div>
        
        {!isMember && !isCreator && currentUserPubkey && (
          <Button onClick={onJoinCommunity}>
            <UserPlus className="h-4 w-4 mr-2" />
            Join
          </Button>
        )}
        {isMember && (
          <div className="flex items-center gap-1 text-sm text-primary">
            <Check className="h-4 w-4" />
            Member
          </div>
        )}
      </div>
    </header>
  );
};

export default CommunityPageHeader;
