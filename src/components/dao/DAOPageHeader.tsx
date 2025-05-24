
import { Button } from "@/components/ui/button";
import { UserPlus, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BackButton from "@/components/navigation/BackButton";

interface DAOPageHeaderProps {
  name: string;
  isMember: boolean;
  isCreator: boolean;
  isCreatorOnlyMember?: boolean;
  currentUserPubkey: string | null;
  onJoinDAO: () => Promise<void>;
  onLeaveDAO: () => void;
  onDeleteDAO?: () => Promise<void>;
  isPrivate?: boolean;
}

const DAOPageHeader = ({
  name,
  isMember,
  isCreator,
  currentUserPubkey,
  onJoinDAO,
  isPrivate = false
}: DAOPageHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-10 bg-background/95 backdrop-blur h-16 flex items-center px-4 sm:px-6 border-b">
      <div className="container max-w-6xl mx-auto flex items-center">
        <BackButton fallbackPath="/dao" className="mr-2" />
        
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
              onClick={onJoinDAO}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Join DAO
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default DAOPageHeader;
