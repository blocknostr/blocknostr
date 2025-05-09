import { useState, useEffect } from "react";
import { NostrEvent, nostrService, EVENT_KINDS } from "@/lib/nostr";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Plus, Users } from "lucide-react";
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

interface Proposal {
  id: string;
  communityId: string;
  title: string;
  description: string;
  options: string[];
  createdAt: number;
  endsAt: number;
  creator: string;
  votes: Record<string, number>;
}

const Communities = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("discover");
  const [activeCommunity, setActiveCommunity] = useState<Community | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isCreatingCommunity, setIsCreatingCommunity] = useState(false);
  const [isCreatingProposal, setIsCreatingProposal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const currentUserPubkey = nostrService.publicKey;
  
  // Form states
  const [newCommunityName, setNewCommunityName] = useState("");
  const [newCommunityDesc, setNewCommunityDesc] = useState("");
  const [newProposalTitle, setNewProposalTitle] = useState("");
  const [newProposalDesc, setNewProposalDesc] = useState("");
  const [newProposalOptions, setNewProposalOptions] = useState<string[]>(["Yes", "No"]);
  
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
  
  useEffect(() => {
    // Load proposals when community is selected
    if (activeCommunity) {
      loadProposals(activeCommunity.id);
    }
  }, [activeCommunity]);
  
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
  
  const loadProposals = (communityId: string) => {
    setProposals([]);
    
    const proposalSubId = nostrService.subscribe(
      [
        {
          kinds: [EVENT_KINDS.PROPOSAL],
          '#e': [communityId],
          limit: 50
        }
      ],
      handleProposalEvent
    );
    
    const votesSubId = nostrService.subscribe(
      [
        {
          kinds: [EVENT_KINDS.VOTE],
          limit: 100
        }
      ],
      handleVoteEvent
    );
    
    return () => {
      nostrService.unsubscribe(proposalSubId);
      nostrService.unsubscribe(votesSubId);
    };
  };
  
  const handleProposalEvent = (event: NostrEvent) => {
    try {
      if (!event.id) return;
      
      // Find the community reference tag
      const communityTag = event.tags.find(tag => tag.length >= 2 && tag[0] === 'e');
      if (!communityTag) return;
      const communityId = communityTag[1];
      
      // Parse proposal data
      const proposalData = JSON.parse(event.content);
      
      const proposal: Proposal = {
        id: event.id,
        communityId,
        title: proposalData.title || 'Unnamed Proposal',
        description: proposalData.description || '',
        options: proposalData.options || ['Yes', 'No'],
        createdAt: event.created_at,
        endsAt: proposalData.endsAt || (event.created_at + 7 * 24 * 60 * 60), // Default 1 week
        creator: event.pubkey || '',
        votes: {}
      };
      
      setProposals(prev => {
        // Check if we already have this proposal
        if (prev.some(p => p.id === proposal.id)) {
          return prev;
        }
        
        // Add new proposal
        return [...prev, proposal].sort((a, b) => b.createdAt - a.createdAt);
      });
    } catch (e) {
      console.error("Error processing proposal event:", e);
    }
  };
  
  const handleVoteEvent = (event: NostrEvent) => {
    try {
      if (!event.id) return;
      
      // Find the proposal reference tag
      const proposalTag = event.tags.find(tag => tag.length >= 2 && tag[0] === 'e');
      if (!proposalTag) return;
      const proposalId = proposalTag[1];
      
      // Find the proposal
      const proposalIndex = proposals.findIndex(p => p.id === proposalId);
      if (proposalIndex < 0) return; // We don't have this proposal
      
      const optionIndex = parseInt(event.content);
      if (isNaN(optionIndex)) return;
      
      // Update the votes
      setProposals(prev => {
        const updated = [...prev];
        const proposal = {...updated[proposalIndex]};
        
        // Record this vote (overwriting any previous vote from this pubkey)
        proposal.votes[event.pubkey || ''] = optionIndex;
        
        updated[proposalIndex] = proposal;
        return updated;
      });
    } catch (e) {
      console.error("Error processing vote event:", e);
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
      }
    } catch (error) {
      console.error("Error creating community:", error);
      toast.error("Failed to create community");
    } finally {
      setIsCreatingCommunity(false);
    }
  };
  
  const handleCreateProposal = async () => {
    if (!currentUserPubkey || !activeCommunity) {
      toast.error("You must be logged in and have a community selected");
      return;
    }
    
    if (!newProposalTitle.trim()) {
      toast.error("Proposal title is required");
      return;
    }
    
    if (newProposalOptions.length < 2) {
      toast.error("At least two options are required");
      return;
    }
    
    setIsCreatingProposal(true);
    
    try {
      const proposalId = await nostrService.createProposal(
        activeCommunity.id,
        newProposalTitle.trim(),
        newProposalDesc.trim(),
        newProposalOptions.filter(opt => opt.trim() !== "")
      );
      
      if (proposalId) {
        toast.success("Proposal created successfully!");
        setNewProposalTitle("");
        setNewProposalDesc("");
        setNewProposalOptions(["Yes", "No"]);
      }
    } catch (error) {
      console.error("Error creating proposal:", error);
      toast.error("Failed to create proposal");
    } finally {
      setIsCreatingProposal(false);
    }
  };
  
  const handleVote = async (proposal: Proposal, optionIndex: number) => {
    if (!currentUserPubkey) {
      toast.error("You must be logged in to vote");
      return;
    }
    
    try {
      await nostrService.voteOnProposal(proposal.id, optionIndex);
      toast.success("Vote recorded!");
    } catch (error) {
      console.error("Error voting:", error);
      toast.error("Failed to record vote");
    }
  };
  
  const getVoteCounts = (proposal: Proposal) => {
    const counts = proposal.options.map(() => 0);
    
    Object.values(proposal.votes).forEach(optionIndex => {
      if (optionIndex >= 0 && optionIndex < counts.length) {
        counts[optionIndex]++;
      }
    });
    
    return counts;
  };
  
  const getTotalVotes = (proposal: Proposal) => {
    return Object.keys(proposal.votes).length;
  };
  
  const getUserVote = (proposal: Proposal) => {
    if (!currentUserPubkey) return -1;
    return proposal.votes[currentUserPubkey] ?? -1;
  };
  
  const filteredCommunities = communities.filter(community => 
    community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    community.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const userCommunities = filteredCommunities.filter(community => 
    community.members.includes(currentUserPubkey || '')
  );
  
  const otherCommunities = filteredCommunities.filter(community => 
    !community.members.includes(currentUserPubkey || '')
  );
  
  const isProposalActive = (proposal: Proposal) => {
    return proposal.endsAt > Math.floor(Date.now() / 1000);
  };
  
  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden">
      <Tabs className="flex-1 flex flex-col" value={activeTab} onValueChange={setActiveTab}>
        <div className="p-4 border-b">
          <TabsList className="w-full">
            <TabsTrigger value="discover" className="flex-1">Discover</TabsTrigger>
            <TabsTrigger value="my" className="flex-1">My Communities</TabsTrigger>
            {activeCommunity && (
              <TabsTrigger value="community" className="flex-1">
                {activeCommunity.name}
              </TabsTrigger>
            )}
          </TabsList>
        </div>
        
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Input 
              placeholder="Search communities..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Dialog>
              <DialogTrigger asChild>
                <Button className="shrink-0">
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
              <div className="text-center text-muted-foreground py-8">
                No communities found. Create one to get started!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCommunities.map(community => (
                  <Card key={community.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={community.image} />
                          <AvatarFallback>
                            <Users className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <CardTitle className="text-lg">{community.name}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {community.description}
                      </p>
                      <div className="text-xs text-muted-foreground mt-2">
                        {community.members.length} {community.members.length === 1 ? 'member' : 'members'}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          setActiveCommunity(community);
                          setActiveTab("community");
                        }}
                      >
                        View Community
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="my" className="p-4 space-y-4 mt-0">
            {!currentUserPubkey ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  You need to log in to see your communities
                </p>
                <Button onClick={() => nostrService.login()}>
                  Login with Nostr
                </Button>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : userCommunities.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                You haven't joined any communities yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userCommunities.map(community => (
                  <Card key={community.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={community.image} />
                          <AvatarFallback>
                            <Users className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <CardTitle className="text-lg">{community.name}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {community.description}
                      </p>
                      <div className="text-xs text-muted-foreground mt-2">
                        {community.members.length} {community.members.length === 1 ? 'member' : 'members'}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full"
                        onClick={() => {
                          setActiveCommunity(community);
                          setActiveTab("community");
                        }}
                      >
                        View Community
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="community" className="mt-0">
            {activeCommunity && (
              <div className="p-4 space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={activeCommunity.image} />
                      <AvatarFallback className="text-xl">
                        <Users className="h-8 w-8" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-2xl font-bold">{activeCommunity.name}</h2>
                      <p className="text-muted-foreground">
                        {activeCommunity.members.length} {activeCommunity.members.length === 1 ? 'member' : 'members'}
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-sm">{activeCommunity.description}</p>
                </div>
                
                <div className="border-t border-b py-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Proposals</h3>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          New Proposal
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create a new proposal</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Input
                              placeholder="Proposal Title"
                              value={newProposalTitle}
                              onChange={(e) => setNewProposalTitle(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Textarea
                              placeholder="Description"
                              value={newProposalDesc}
                              onChange={(e) => setNewProposalDesc(e.target.value)}
                              rows={4}
                            />
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Options</p>
                            {newProposalOptions.map((option, index) => (
                              <div key={index} className="flex gap-2">
                                <Input
                                  placeholder={`Option ${index + 1}`}
                                  value={option}
                                  onChange={(e) => {
                                    const updated = [...newProposalOptions];
                                    updated[index] = e.target.value;
                                    setNewProposalOptions(updated);
                                  }}
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => {
                                    if (newProposalOptions.length > 2) {
                                      setNewProposalOptions(
                                        newProposalOptions.filter((_, i) => i !== index)
                                      );
                                    }
                                  }}
                                  disabled={newProposalOptions.length <= 2}
                                >
                                  &times;
                                </Button>
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              onClick={() => setNewProposalOptions([...newProposalOptions, ""])}
                            >
                              Add Option
                            </Button>
                          </div>
                          <Button 
                            onClick={handleCreateProposal}
                            disabled={isCreatingProposal || !newProposalTitle.trim()}
                            className="w-full"
                          >
                            {isCreatingProposal ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Plus className="h-4 w-4 mr-2" />
                            )}
                            Create Proposal
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  {proposals.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No proposals yet. Create one to get started!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {proposals.map(proposal => {
                        const voteCounts = getVoteCounts(proposal);
                        const totalVotes = getTotalVotes(proposal);
                        const userVote = getUserVote(proposal);
                        const isActive = isProposalActive(proposal);
                        
                        return (
                          <Card key={proposal.id}>
                            <CardHeader className="pb-2">
                              <CardTitle>{proposal.title}</CardTitle>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <span>{totalVotes} votes</span>
                                <span className="mx-2">•</span>
                                <span className={isActive ? "text-green-500" : "text-red-500"}>
                                  {isActive ? "Active" : "Closed"}
                                </span>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <p className="text-sm">{proposal.description}</p>
                              
                              <div className="space-y-2">
                                {proposal.options.map((option, index) => {
                                  const voteCount = voteCounts[index];
                                  const votePercentage = totalVotes > 0 
                                    ? Math.round((voteCount / totalVotes) * 100) 
                                    : 0;
                                  
                                  return (
                                    <div key={index} className="space-y-1">
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">{option}</span>
                                        <span className="text-sm text-muted-foreground">
                                          {voteCount} ({votePercentage}%)
                                        </span>
                                      </div>
                                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div 
                                          className="h-full bg-primary" 
                                          style={{ width: `${votePercentage}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </CardContent>
                            <CardFooter>
                              <div className="w-full flex flex-wrap gap-2">
                                {isActive && currentUserPubkey && (
                                  proposal.options.map((option, index) => (
                                    <Button
                                      key={index}
                                      variant={userVote === index ? "default" : "outline"}
                                      size="sm"
                                      className="flex-1"
                                      onClick={() => handleVote(proposal, index)}
                                      disabled={!isActive}
                                    >
                                      {option}
                                    </Button>
                                  ))
                                )}
                                {!isActive && (
                                  <div className="w-full text-center text-sm text-muted-foreground">
                                    This proposal is closed
                                  </div>
                                )}
                              </div>
                            </CardFooter>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default Communities;
