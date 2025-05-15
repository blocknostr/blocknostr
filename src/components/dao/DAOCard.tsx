
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatSerialNumber } from "@/lib/community-utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface Community {
  id: string;
  name: string;
  description: string;
  image?: string;
  creator: string;
  createdAt: number;
  members: string[];
  uniqueId: string;
  serialNumber?: number;
}

interface DAOCardProps {
  community: Community;
  isUserMember: boolean;
  currentUserPubkey: string | null;
}

const DAOCard = ({ community, isUserMember, currentUserPubkey }: DAOCardProps) => {
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
  
  // Format the community serial number
  const serialNumber = community.serialNumber ? 
    formatSerialNumber(community.serialNumber) : 
    null;
  
  return (
    <Card className="overflow-hidden hover:shadow-md transition-all">
      <Link to={`/dao/${community.id}`}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <Avatar>
                {community.image ? (
                  <AvatarImage src={community.image} alt={community.name} />
                ) : null}
                <AvatarFallback>{getInitials(community.name)}</AvatarFallback>
              </Avatar>
              
              <div>
                <CardTitle className="text-lg">{community.name}</CardTitle>
                {serialNumber && (
                  <CardDescription className="text-xs">{serialNumber}</CardDescription>
                )}
              </div>
            </div>
            
            {isUserMember && (
              <Badge variant="outline" className="bg-primary/10 text-primary">Member</Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pb-3">
          <p className="text-sm line-clamp-3">{community.description}</p>
        </CardContent>
        
        <CardFooter className="border-t pt-3 text-xs text-muted-foreground flex justify-between items-center">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{community.members.length}</span>
            <span className="mx-1">·</span>
            <span>Created {timeAgo}</span>
          </div>
          
          {community.creator === currentUserPubkey && (
            <Badge variant="secondary" size="sm" className="text-xs">
              Owner
            </Badge>
          )}
        </CardFooter>
      </Link>
    </Card>
  );
};

export default DAOCard;
