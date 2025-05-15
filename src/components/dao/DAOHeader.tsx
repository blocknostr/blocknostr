
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Eye, EyeOff, Users, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCopySharable } from "@/hooks/useShareable";
import { Community } from "@/hooks/useCommunity";
import { MemberRole } from "@/types/community";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DAOHeaderProps {
  community: Community;
  currentUserPubkey: string | null;
  userRole: MemberRole | null;
  onLeaveCommunity: () => Promise<void>;
  onDeleteCommunity: () => Promise<void>;
  isCreatorOnlyMember: boolean;
}

const DAOHeader = ({
  community,
  currentUserPubkey,
  userRole,
  onLeaveCommunity,
  onDeleteCommunity,
  isCreatorOnlyMember,
}: DAOHeaderProps) => {
  const [isLeaving, setIsLeaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { copyToClipboard } = useCopySharable();
  
  const createdAt = new Date(community.createdAt * 1000);
  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true });
  
  // Generate initials for the avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  // Handle leave community
  const handleLeave = async () => {
    if (isLeaving) return;
    setIsLeaving(true);
    try {
      await onLeaveCommunity();
    } finally {
      setIsLeaving(false);
    }
  };
  
  // Handle delete community
  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await onDeleteCommunity();
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex gap-3">
            <Avatar className="h-14 w-14">
              {community.image ? (
                <AvatarImage src={community.image} alt={community.name} />
              ) : null}
              <AvatarFallback className="text-lg">{getInitials(community.name)}</AvatarFallback>
            </Avatar>
            
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                {community.name}
                {community.isPrivate && (
                  <Badge variant="outline" className="border-amber-500 text-amber-500 gap-1">
                    <EyeOff className="h-3 w-3" />
                    Private
                  </Badge>
                )}
                {!community.isPrivate && (
                  <Badge variant="outline" className="border-green-500 text-green-500 gap-1">
                    <Eye className="h-3 w-3" />
                    Public
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 text-sm mt-1">
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {community.members.length} {community.members.length === 1 ? 'member' : 'members'}
                </span>
                <span className="text-xs">•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Created {timeAgo}
                </span>
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm my-3">{community.description}</p>
        
        {community.tags && community.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {community.tags.map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(`${window.location.origin}/dao/${community.id}`)}
          >
            Share DAO
          </Button>
          
          {userRole === "member" && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleLeave}
              disabled={isLeaving}
            >
              Leave DAO
            </Button>
          )}
          
          {userRole === "creator" && !isCreatorOnlyMember && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleLeave}
              disabled={isLeaving}
            >
              Leave DAO
            </Button>
          )}
          
          {userRole === "creator" && isCreatorOnlyMember && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              Delete DAO
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DAOHeader;
