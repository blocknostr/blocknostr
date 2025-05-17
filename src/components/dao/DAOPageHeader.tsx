
import { Button } from "@/components/ui/button";
import { UserPlus, Lock, Trash, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BackButton from "@/components/navigation/BackButton";
import { Badge } from "@/components/ui/badge";
import { formatSerialNumber } from "@/lib/dao/dao-utils";

interface DAOPageHeaderProps {
  name: string;
  isMember: boolean;
  isCreator: boolean;
  isCreatorOnlyMember?: boolean;
  currentUserPubkey: string | null;
  onJoinDAO: () => Promise<void>;
  onLeaveDAO: () => void;
  onDeleteDAO?: () => void;
  isPrivate?: boolean;
  serialNumber?: number;
}

const DAOPageHeader = ({
  name,
  isMember,
  isCreator,
  currentUserPubkey,
  onJoinDAO,
  onLeaveDAO,
  onDeleteDAO,
  isPrivate = false,
  serialNumber,
  isCreatorOnlyMember = false
}: DAOPageHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-10 bg-background/95 backdrop-blur h-16 flex items-center px-6">
      <BackButton fallbackPath="/dao" className="mr-2" />
      
      <div className="flex-1">
        <div className="flex items-center">
          <h1 className="text-lg font-bold truncate">{name}</h1>
          
          {serialNumber && (
            <Badge variant="secondary" className="ml-2 bg-black/70 text-white hover:bg-black/80 font-mono">
              {formatSerialNumber(serialNumber)}
            </Badge>
          )}
          
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
        
        {isMember && !isCreator && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onLeaveDAO}
            className="flex items-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 dark:border-red-800"
          >
            <LogOut className="h-4 w-4" />
            Leave
          </Button>
        )}
        
        {isCreator && isCreatorOnlyMember && onDeleteDAO && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onDeleteDAO}
            className="flex items-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 dark:border-red-800"
          >
            <Trash className="h-4 w-4" />
            Delete DAO
          </Button>
        )}
      </div>
    </header>
  );
};

export default DAOPageHeader;
