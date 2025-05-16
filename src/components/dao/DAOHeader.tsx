
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DAO } from "@/types/dao";
import { Calendar, Gavel, Lock, Settings, Shield, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface DAOHeaderProps {
  dao: DAO;
  isMember: boolean;
  isCreator: boolean;
  currentUserPubkey: string | null;
  onJoinDAO: () => Promise<void>;
  onOpenSettings: () => void;
  onOpenKickDialog: () => void;
}

const DAOHeader: React.FC<DAOHeaderProps> = ({
  dao,
  isMember,
  isCreator,
  currentUserPubkey,
  onJoinDAO,
  onOpenSettings,
  onOpenKickDialog
}) => {
  return (
    <div className="bg-card border rounded-lg p-6 mb-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        {/* DAO Title and Description */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{dao.name}</h1>
            {dao.isPrivate && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                <Lock className="h-3 w-3 mr-1" />
                Private
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">{dao.description}</p>
          
          {/* Tags */}
          {dao.tags && dao.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {dao.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex flex-col gap-2">
          {!isMember && currentUserPubkey ? (
            <Button 
              onClick={onJoinDAO}
              className="w-full md:w-auto"
            >
              <Users className="h-4 w-4 mr-2" />
              Join DAO
            </Button>
          ) : isMember && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={onOpenSettings}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              
              {isMember && !isCreator && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onOpenKickDialog}
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Propose Kick
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Info Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground flex items-center">
            <Users className="h-3 w-3 mr-1" /> Members
          </p>
          <p className="text-xl font-medium">{dao.members.length}</p>
        </div>
        
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground flex items-center">
            <Shield className="h-3 w-3 mr-1" /> Moderators
          </p>
          <p className="text-xl font-medium">{dao.moderators.length}</p>
        </div>
        
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground flex items-center">
            <Gavel className="h-3 w-3 mr-1" /> Proposals
          </p>
          <p className="text-xl font-medium">{dao.proposals || 0}</p>
        </div>
        
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground flex items-center">
            <Calendar className="h-3 w-3 mr-1" /> Created
          </p>
          <p className="text-sm">
            {formatDistanceToNow(new Date(dao.createdAt * 1000), { addSuffix: true })}
          </p>
        </div>
      </div>
      
      {/* Guidelines Preview */}
      {dao.guidelines && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm font-medium mb-2 flex items-center">
            <Shield className="h-4 w-4 mr-2" />
            Guidelines
          </p>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {dao.guidelines}
          </p>
        </div>
      )}
    </div>
  );
};

export default DAOHeader;
