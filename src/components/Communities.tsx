import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { NostrEvent, nostrService, EVENT_KINDS } from "@/lib/nostr";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Plus, Users, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";

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

const Communities = () => {
  const navigate = useNavigate();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form states
  const [newCommunityName, setNewCommunityName] = useState("");
  const [newCommunityDesc, setNewCommunityDesc] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreatingCommunity, setIsCreatingCommunity] = useState(false);
  
  const currentUserPubkey = nostrService.publicKey;
  
  useEffect(() => {
    const loadCommunities = async () => {
      await nostrService.connectToUserRelays();
      
      // Subscribe to community events
      const communitySubId = nostrService.subscribe(
        [
          {
            kinds: [EVENT_KINDS.COMMUNITY],
            limit: 30
          }
        ],
        handleCommunityEvent
      );
      
      setLoading(false);
      
      return () => {
        nostrService.unsubscribe(communitySubId);
      };
    };
    
    loadCommunities();
  }, []);
  
  const handleCommunityEvent = (event: NostrEvent) => {
    try {
      if (!event.id) return;
      
      // Find the unique identifier tag
      const idTag = event.tags.find(tag => tag.length >= 2 && tag[0] === 'd');
      if (!idTag) return;
      const uniqueId = idTag[1];
      
      // Parse community data
      const communityData = JSON.parse(event.content);
      
      // Get members from tags
      const memberTags = event.tags.filter(tag => tag.length >= 2 && tag[0] === 'p');
      const members = memberTags.map(tag => tag[1]);
      
      const community: Community = {
        id: event.id,
        name: communityData.name || 'Unnamed Community',
        description: communityData.description || '',
        image: communityData.image || '',
        creator: event.pubkey || '',
        createdAt: event.created_at,
        members,
        uniqueId
      };
      
      setCommunities(prev => {
        // Check if we already have this community by ID
        if (prev.some(c => c.id === community.id)) {
          return prev;
        }
        
        // Check if we have a community with the same uniqueId but older
        const existingIndex = prev.findIndex(c => c.uniqueId === uniqueId);
        if (existingIndex >= 0) {
          // Replace if this one is newer
          if (prev[existingIndex].createdAt < community.createdAt) {
            const updated = [...prev];
            updated[existingIndex] = community;
            return updated;
          }
          return prev;
        }
        
        // Otherwise add as new
        return [...prev, community];
      });
    } catch (e) {
      console.error("Error processing community event:", e);
    }
  };
  
  const handleCreateCommunity = async () => {
    if (!currentUserPubkey) {
      toast.error("You must be logged in to create a community");
      return;
    }
    
    if (!newCommunityName.trim()) {
      toast.error("Community name is required");
      return;
    }
    
    setIsCreatingCommunity(true);
    
    try {
      const communityId = await nostrService.createCommunity(
        newCommunityName.trim(),
        newCommunityDesc.trim()
      );
      
      if (communityId) {
        toast.success("Community created successfully!");
        setNewCommunityName("");
        setNewCommunityDesc("");
        setIsDialogOpen(false);
        
        // Navigate to the new community
        setTimeout(() => {
          navigate(`/communities/${communityId}`);
        }, 1000);
      }
    } catch (error) {
      console.error("Error creating community:", error);
      toast.error("Failed to create community");
    } finally {
      setIsCreatingCommunity(false);
    }
  };
  
  const filteredCommunities = communities.filter(community => 
    community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    community.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const userCommunities = filteredCommunities.filter(community => 
    community.members.includes(currentUserPubkey || '')
  );
  
  const navigateToCommunity = (id: string) => {
    navigate(`/communities/${id}`);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col overflow-auto">
      <div className="p-4 border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Communities</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Community
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a new community</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Input
                    placeholder="Community Name"
                    value={newCommunityName}
                    onChange={(e) => setNewCommunityName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Textarea
                    placeholder="Description"
                    value={newCommunityDesc}
                    onChange={(e) => setNewCommunityDesc(e.target.value)}
                    rows={4}
                  />
                </div>
                <Button 
                  onClick={handleCreateCommunity}
                  disabled={isCreatingCommunity || !newCommunityName.trim()}
                  className="w-full"
                >
                  {isCreatingCommunity ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Create Community
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search communities..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      
      <div className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userCommunities.length > 0 && (
              <div className="md:col-span-2 lg:col-span-3 mb-4">
                <h2 className="text-lg font-semibold mb-3 border-b pb-2">Your Communities</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userCommunities.map(community => (
                    <CommunityCard 
                      key={community.id}
                      community={community}
                      isMember={true}
                      onClick={() => navigateToCommunity(community.id)}
                      currentUserPubkey={currentUserPubkey}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {filteredCommunities.length === 0 ? (
              <div className="text-center col-span-full rounded-lg bg-muted/30 p-12">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No communities found</h3>
                <p className="text-muted-foreground mb-6">Create a new community to get started!</p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Community
                </Button>
              </div>
            ) : (
              <>
                {userCommunities.length > 0 && (
                  <h2 className="text-lg font-semibold mb-3 border-b pb-2 col-span-full">Discover Communities</h2>
                )}
                
                {filteredCommunities
                  .filter(community => !community.members.includes(currentUserPubkey || ''))
                  .map(community => (
                    <CommunityCard 
                      key={community.id}
                      community={community}
                      isMember={false}
                      onClick={() => navigateToCommunity(community.id)}
                      currentUserPubkey={currentUserPubkey}
                    />
                  ))
                }
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface CommunityCardProps {
  community: Community;
  isMember: boolean;
  onClick: () => void;
  currentUserPubkey: string;
}

const CommunityCard = ({ community, isMember, onClick, currentUserPubkey }: CommunityCardProps) => {
  const navigate = useNavigate();
  const isCreator = community.creator === currentUserPubkey;

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
      onClick={onClick}
    >
      <div className={`h-24 ${getRandomColor(community.id)} flex items-center justify-center`}>
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
        {!isMember && !isCreator && currentUserPubkey && (
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleJoinClick}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Join Community
          </Button>
        )}
        {(isMember || isCreator) && (
          <Button 
            variant="outline" 
            className="w-full"
          >
            View Community
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default Communities;
