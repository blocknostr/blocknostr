import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { NostrEvent, nostrService, EVENT_KINDS } from "@/lib/nostr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Users, Search, ArrowLeft } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("discover");
  const [isCreatingCommunity, setIsCreatingCommunity] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form states
  const [newCommunityName, setNewCommunityName] = useState("");
  const [newCommunityDesc, setNewCommunityDesc] = useState("");
  
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
  
  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden">
      <Tabs className="flex-1 flex flex-col" value={activeTab} onValueChange={setActiveTab}>
        <div className="p-4 border-b bg-background/60 backdrop-blur-sm sticky top-0 z-10">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="discover" className="flex-1">
              <Users className="h-4 w-4 mr-2" />
              Discover
            </TabsTrigger>
            <TabsTrigger value="my" className="flex-1">
              My Communities
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search communities..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 pl-9"
              />
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create
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
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <TabsContent value="discover" className="p-4 space-y-4 mt-0">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredCommunities.length === 0 ? (
              <div className="text-center rounded-lg bg-muted/30 p-12">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No communities found</h3>
                <p className="text-muted-foreground mb-6">Create a new community to get started!</p>
                <Dialog>
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
            ) : (
              <div className="space-y-4">
                {filteredCommunities.map(community => (
                  <Card 
                    key={community.id} 
                    className="cursor-pointer hover:border-primary/20 transition-all"
                    onClick={() => navigateToCommunity(community.id)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{community.name}</CardTitle>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <span>{community.members.length} members</span>
                        {community.members.includes(currentUserPubkey || '') && (
                          <>
                            <span className="mx-1">•</span>
                            <Badge variant="outline" className="text-xs h-5 px-1">Member</Badge>
                          </>
                        )}
                        <span className="mx-1">•</span>
                        <span>Created {new Date(community.createdAt * 1000).toLocaleDateString()}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <p className="text-sm text-muted-foreground">
                        {community.description || "No description provided."}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="my" className="p-4 space-y-4 mt-0">
            {!currentUserPubkey ? (
              <div className="text-center rounded-lg bg-muted/30 p-12">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">Not logged in</h3>
                <p className="text-muted-foreground mb-6">You need to log in to see your communities</p>
                <Button onClick={() => nostrService.login()}>
                  Login with Nostr
                </Button>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : userCommunities.length === 0 ? (
              <div className="text-center rounded-lg bg-muted/30 p-12">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No communities joined</h3>
                <p className="text-muted-foreground mb-6">You haven't joined any communities yet.</p>
                <Dialog>
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
            ) : (
              <div className="space-y-4">
                {userCommunities.map(community => (
                  <Card 
                    key={community.id} 
                    className="cursor-pointer border-primary/20 hover:border-primary/40 transition-all"
                    onClick={() => navigateToCommunity(community.id)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{community.name}</CardTitle>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <span>{community.members.length} members</span>
                        <span className="mx-1">•</span>
                        <Badge variant="secondary" className="text-xs h-5">Member</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <p className="text-sm text-muted-foreground">
                        {community.description || "No description provided."}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default Communities;
