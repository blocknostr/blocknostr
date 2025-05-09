
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { toast } from "sonner";
import { nostrService } from "@/lib/nostr";
import { useNavigate } from "react-router-dom";

interface Community {
  id: string;
  name: string;
  description: string;
  image: string;
  creator: string;
  createdAt: number;
  members: string[];
  uniqueId: string;
}

interface CommunityHeaderProps {
  community: Community;
  currentUserPubkey: string | null;
  isCreator: boolean;
  isMember: boolean;
}

const CommunityHeader = ({ 
  community, 
  currentUserPubkey, 
  isCreator, 
  isMember 
}: CommunityHeaderProps) => {
  const navigate = useNavigate();
  
  const getRandomColor = (str: string) => {
    const colors = [
      "bg-blue-500", "bg-green-500", "bg-yellow-500", 
      "bg-purple-500", "bg-pink-500", "bg-indigo-500"
    ];
    const hash = str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleLeaveCommunity = async () => {
    if (!currentUserPubkey) return;
    
    try {
      // Remove user from members list
      const updatedMembers = community.members.filter(member => member !== currentUserPubkey);
      
      // Create an updated community event without the current user
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
      toast.success("You have left the community");
      
      // Redirect back to communities list
      navigate('/communities');
    } catch (error) {
      console.error("Error leaving community:", error);
      toast.error("Failed to leave community");
    }
  };
  
  return (
    <Card>
      <div className={`h-32 ${getRandomColor(community.id)} flex items-center justify-center`}>
        {community.image ? (
          <img src={community.image} alt={community.name} className="w-full h-full object-cover" />
        ) : (
          <div className="text-white text-4xl font-bold">
            {getInitials(community.name)}
          </div>
        )}
      </div>
      
      <CardContent className="pt-6">
        <p className="text-muted-foreground mb-4">
          {community.description || "No description provided."}
        </p>
        
        <div className="flex items-center text-sm text-muted-foreground">
          <Users className="h-4 w-4 mr-1" />
          <span>{community.members.length} members</span>
          <span className="mx-1">•</span>
          <span>Created {new Date(community.createdAt * 1000).toLocaleDateString()}</span>
        </div>
        
        {isMember && !isCreator && (
          <div className="mt-4">
            <Button 
              variant="outline" 
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={handleLeaveCommunity}
            >
              Leave Community
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CommunityHeader;
