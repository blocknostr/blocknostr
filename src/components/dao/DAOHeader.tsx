
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DAO } from "@/types/dao";
import { formatDistanceToNow } from "date-fns";
import { Users, Calendar, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DAOHeaderProps {
  dao: DAO;
  userRole?: 'creator' | 'moderator' | 'member' | null;
  currentUserPubkey?: string | null;
  onJoinDAO?: () => void;
  onLeaveDAO?: () => void;
  onDeleteDAO?: () => Promise<void>;
  isCreatorOnlyMember?: boolean;
  serialNumber?: string | null;
  onOpenSettings?: () => void;
  userIsCreator?: boolean;
  userIsMember?: boolean;
  userIsModerator?: boolean;
}

const DAOHeader: React.FC<DAOHeaderProps> = ({ 
  dao,
  serialNumber,
  userIsCreator = false,
  userIsMember = false, 
  userIsModerator = false,
  onJoinDAO,
  onLeaveDAO,
  onDeleteDAO,
  onOpenSettings
}) => {
  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
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
        
        {/* Action buttons can be added here based on user role */}
        {userIsMember && onOpenSettings && userIsCreator && (
          <Button onClick={onOpenSettings} variant="outline">
            DAO Settings
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default DAOHeader;
