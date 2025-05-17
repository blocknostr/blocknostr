
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DAO } from "@/types/dao";
import { formatDistanceToNow } from "date-fns";
import { Users, Calendar, Lock, ShieldCheck } from "lucide-react";
import LeaveDaoButton from "./LeaveDaoButton";
import DeleteDaoButton from "./DeleteDaoButton";

interface DAOHeaderProps {
  dao: DAO;
  currentUserPubkey: string | null;
  userRole: 'creator' | 'moderator' | 'member' | null;
  onLeaveDAO: () => Promise<void>;
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
  const canLeave = userRole === 'member' || (userRole === 'moderator' && dao.creator !== currentUserPubkey);
  
  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div>
          <div className="flex items-start justify-between">
            <h1 className="text-2xl font-bold mb-2">{dao.name}</h1>
            {dao.isPrivate && (
              <Badge variant="outline" className="ml-2 gap-1">
                <Lock className="h-3 w-3" />
                Private
              </Badge>
            )}
          </div>
          
          <p className="text-muted-foreground">{dao.description}</p>
          
          <div className="flex flex-wrap items-center mt-2 gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              <span>{dao.members.length} members</span>
            </div>
            
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span>Created {formatDistanceToNow(new Date(dao.createdAt * 1000), { addSuffix: true })}</span>
            </div>
            
            {userRole === 'moderator' && (
              <div className="flex items-center">
                <ShieldCheck className="h-4 w-4 mr-1" />
                <span>Moderator</span>
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
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {canLeave && (
            <LeaveDaoButton 
              onLeave={onLeaveDAO} 
              daoName={dao.name} 
            />
          )}
          
          {canDelete && onDeleteDAO && (
            <DeleteDaoButton
              onDelete={onDeleteDAO}
              daoName={dao.name}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DAOHeader;
