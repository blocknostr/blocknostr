
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, Users, Link as LinkIcon } from "lucide-react";
import { nostrService } from "@/lib/nostr";
import { toast } from "sonner";

export interface Community {
  id: string;
  name: string;
  description: string;
  image: string;
  creator: string;
  createdAt: number;
  members: string[];
  uniqueId: string;
  serialNumber?: number; // Added serial number property
}

interface CommunityCardProps {
  community: Community;
  isMember: boolean;
  currentUserPubkey: string | null;
}

const CommunityCard = ({ community, isMember, currentUserPubkey }: CommunityCardProps) => {
  const navigate = useNavigate();
  const isCreator = community.creator === currentUserPubkey;
  const [showInviteLink, setShowInviteLink] = useState(false);

  const handleJoinClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!currentUserPubkey) {
      toast.error("You must be logged in to join a community");
      return;
    }
    
    try {
      // Get the existing community data and members
      const updatedMembers = [...community.members, currentUserPubkey];
      
      // Create an updated community event with the current user added as a member
      const communityData = {
        name: community.name,
        description: community.description,
        image: community.image,
        creator: community.creator,
        createdAt: community.createdAt
      };
      
      const event = {
        kind: 34550,
        content: JSON.stringify(communityData),
        tags: [
          ['d', community.uniqueId],
          ...updatedMembers.map(member => ['p', member])
        ]
      };
      
      await nostrService.publishEvent(event);
      toast.success("You have joined the community!");
    } catch (error) {
      console.error("Error joining community:", error);
      toast.error("Failed to join community");
    }
  };

  const shareInviteLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const inviteUrl = `${window.location.origin}/communities/${community.id}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteUrl)
        .then(() => {
          toast.success("Invite link copied to clipboard!");
          setShowInviteLink(true);
          setTimeout(() => setShowInviteLink(false), 3000);
        })
        .catch(err => {
          console.error("Failed to copy:", err);
          toast.error("Failed to copy invite link");
        });
    } else {
      // Fallback
      toast.error("Copy to clipboard not supported in your browser");
    }
  };
  
  const navigateToCommunity = () => {
    navigate(`/communities/${community.id}`);
  };
  
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getRandomColor = (str: string) => {
    const colors = [
      "bg-blue-500", "bg-green-500", "bg-yellow-500", 
      "bg-purple-500", "bg-pink-500", "bg-indigo-500"
    ];
    const hash = str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };
  
  return (
    <Card 
      className={`overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${isMember ? 'border-primary/30' : ''}`}
      onClick={navigateToCommunity}
    >
      <div className={`h-24 ${getRandomColor(community.id)} flex items-center justify-center relative`}>
        {community.image ? (
          <img 
            src={community.image} 
            alt={community.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-white text-4xl font-bold">
            {getInitials(community.name)}
          </div>
        )}
        {community.serialNumber && (
          <div className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">
            {community.serialNumber}
          </div>
        )}
      </div>
      
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <span>{community.name}</span>
          {isMember && (
            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
              Member
            </span>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2 h-10">
          {community.description || "No description provided."}
        </p>
        
        <div className="flex items-center mt-4 text-xs text-muted-foreground">
          <Users className="h-3 w-3 mr-1" />
          <span>{community.members.length} members</span>
          <span className="mx-1">•</span>
          <span>Created {formatDate(community.createdAt)}</span>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
        <div className="flex w-full gap-2">
          {!isMember && !isCreator && currentUserPubkey && (
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={handleJoinClick}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Join
            </Button>
          )}
          {(isMember || isCreator) && (
            <>
              <Button 
                variant="outline" 
                className="flex-1"
              >
                View
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={shareInviteLink}
                title="Share invite link"
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardFooter>
      {showInviteLink && (
        <div className="px-3 pb-3 text-xs text-muted-foreground">
          Invite link copied to clipboard!
        </div>
      )}
    </Card>
  );
};

export default CommunityCard;
