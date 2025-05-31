import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DAO } from "@/api/types/dao";
import { formatDistanceToNow } from "date-fns";
import { Users, Calendar, Lock, UserMinus } from "lucide-react";
import LeaveDaoButton from "./LeaveDaoButton";
import { ToolbarButton } from "@/components/ui/toolbar-button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DAOHeaderProps {
  dao: DAO;
  currentUserPubkey: string | null;
  userRole: 'creator' | 'moderator' | 'member' | null;
  onLeaveDAO: () => void;
  onDeleteDAO?: () => Promise<void>;
  isCreatorOnlyMember?: boolean;
}

const DAOHeader: React.FC<DAOHeaderProps> = ({ 
  dao, 
  currentUserPubkey, 
  userRole,
  onLeaveDAO,
  onDeleteDAO,
  isCreatorOnlyMember = false
}) => {
  // Determine if the user can delete the DAO (creator and only member)
  const canDelete = userRole === 'creator' && isCreatorOnlyMember && !!onDeleteDAO;
  
  return (
    <Card className="relative">
      <CardContent className="pt-6 space-y-4">
        {/* Leave Community button - placed in the absolute top right corner */}
        {userRole === 'member' && (
          <div className="absolute top-2 right-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToolbarButton
                    onClick={onLeaveDAO}
                    className="hover:bg-destructive/10 hover:text-destructive" 
                    aria-label="Leave Community"
                  >
                    <UserMinus className="h-4 w-4" />
                  </ToolbarButton>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Leave Community</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        <div>
          <h1 className="text-2xl font-bold mb-2">{dao.name}</h1>
          <p className="text-muted-foreground">{dao.description}</p>
          
          <div className="flex items-center mt-2 space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              <span>{dao.members.length} members</span>
            </div>
            
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span>Created {formatDistanceToNow(new Date(dao.createdAt * 1000), { addSuffix: true })}</span>
            </div>
            
            {dao.isPrivate && (
              <div className="flex items-center">
                <Lock className="h-4 w-4 mr-1" />
                <span>Private</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Tags */}
        {dao.tags && dao.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {dao.tags.map(tag => (
              <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
          </div>
        )}
        
        {/* We'll keep the original button but hide it since we now have the icon button */}
        {userRole === 'member' && (
          <div className="hidden">
            <LeaveDaoButton 
              onLeave={onLeaveDAO} 
              daoName={dao.name} 
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DAOHeader;

