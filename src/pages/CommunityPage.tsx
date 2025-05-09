
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { nostrService, NostrEvent } from "@/lib/nostr";
import { Loader2, ArrowLeft, Users, Plus, Check, Clock, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { formatDistanceToNow } from 'date-fns';
import { Toaster } from "@/components/ui/sonner";

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

const CommunityPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [community, setCommunity] = useState<Community | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("proposals");
  
  // Form states for creating a new proposal
  const [isCreatingProposal, setIsCreatingProposal] = useState(false);
  const [newProposalTitle, setNewProposalTitle] = useState("");
  const [newProposalDesc, setNewProposalDesc] = useState("");
  const [newProposalOptions, setNewProposalOptions] = useState<string[]>(["Yes", "No"]);
  const [proposalDuration, setProposalDuration] = useState(7); // Default 7 days
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState<Record<string, string>>({});
  
  const currentUserPubkey = nostrService.publicKey;
  const isMember = community?.members.includes(currentUserPubkey || '') || false;
  const isCreator = community?.creator === currentUserPubkey;
  
  useEffect(() => {
    const loadCommunity = async () => {
      if (!id) return;
      
      setLoading(true);
      await nostrService.connectToUserRelays();
      
      // Subscribe to community events with this ID
      const communitySubId = nostrService.subscribe(
        [
          {
            kinds: [34550],
            ids: [id],
            limit: 1
          }
        ],
        handleCommunityEvent
      );
      
      // Load proposals for this community
      loadProposals(id);
      
      return () => {
        nostrService.unsubscribe(communitySubId);
      };
    };
    
    loadCommunity();
  }, [id]);
  
  // Timer for proposal countdowns
  useEffect(() => {
    const updateCountdowns = () => {
      const now = Math.floor(Date.now() / 1000);
      const newTimeLeft: Record<string, string> = {};
      
      proposals.forEach(proposal => {
        if (proposal.endsAt > now) {
          const secondsLeft = proposal.endsAt - now;
          newTimeLeft[proposal.id] = formatDistanceToNow(new Date(proposal.endsAt * 1000), { addSuffix: true });
        } else {
          newTimeLeft[proposal.id] = "Ended";
        }
      });
      
      setTimeLeft(newTimeLeft);
    };
    
    updateCountdowns();
    const interval = setInterval(updateCountdowns, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [proposals]);
  
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
      
      setCommunity(community);
      setLoading(false);
    } catch (e) {
      console.error("Error processing community event:", e);
      setLoading(false);
    }
  };
  
  const loadProposals = (communityId: string) => {
    const proposalSubId = nostrService.subscribe(
      [
        {
          kinds: [34551],
          '#e': [communityId],
          limit: 50
        }
      ],
      handleProposalEvent
    );
    
    const votesSubId = nostrService.subscribe(
      [
        {
          kinds: [34552],
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
  
  const handleCreateProposal = async () => {
    if (!currentUserPubkey || !community) {
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
      // Calculate endsAt based on the proposalDuration in days
      const endsAt = Math.floor(Date.now() / 1000) + (proposalDuration * 24 * 60 * 60);
      
      const proposalId = await nostrService.createProposal(
        community.id,
        newProposalTitle.trim(),
        newProposalDesc.trim(),
        newProposalOptions.filter(opt => opt.trim() !== ""),
        endsAt
      );
      
      if (proposalId) {
        toast.success("Proposal created successfully!");
        setNewProposalTitle("");
        setNewProposalDesc("");
        setNewProposalOptions(["Yes", "No"]);
        setProposalDuration(7);
        setIsDialogOpen(false); // Close the dialog after successful creation
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
    
    // Check if user already voted for this option
    if (proposal.votes[currentUserPubkey] === optionIndex) {
      toast.info("You already voted for this option");
      return;
    }
    
    try {
      await nostrService.voteOnProposal(proposal.id, optionIndex);
      toast.success("Vote recorded!");
      
      // Optimistically update the UI to show the new vote
      setProposals(prev => {
        return prev.map(p => {
          if (p.id === proposal.id) {
            const updatedVotes = {...p.votes};
            updatedVotes[currentUserPubkey] = optionIndex;
            return {...p, votes: updatedVotes};
          }
          return p;
        });
      });
    } catch (error) {
      console.error("Error voting:", error);
      toast.error("Failed to record vote");
    }
  };
  
  const handleJoinCommunity = async () => {
    if (!currentUserPubkey || !community) return;
    
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
      
      // Update local state
      setCommunity({
        ...community,
        members: updatedMembers
      });
    } catch (error) {
      console.error("Error joining community:", error);
      toast.error("Failed to join community");
    }
  };
  
  const handleLeaveCommunity = async () => {
    if (!currentUserPubkey || !community) return;
    
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
      
      // Update local state
      setCommunity({
        ...community,
        members: updatedMembers
      });
      
      // Redirect back to communities list
      navigate('/communities');
    } catch (error) {
      console.error("Error leaving community:", error);
      toast.error("Failed to leave community");
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
  
  const isProposalActive = (proposal: Proposal) => {
    return proposal.endsAt > Math.floor(Date.now() / 1000);
  };
  
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
  
  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 ml-0 md:ml-64 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading community...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!community) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 ml-0 md:ml-64 p-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Community not found</h2>
            <p className="text-muted-foreground mb-6">The community you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate('/communities')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Communities
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 ml-0 md:ml-64 overflow-auto">
        <header className="border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate('/communities')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-xl font-semibold">{community.name}</h1>
            </div>
            
            {!isMember && !isCreator && currentUserPubkey && (
              <Button onClick={handleJoinCommunity}>
                <UserPlus className="h-4 w-4 mr-2" />
                Join
              </Button>
            )}
            {isMember && (
              <div className="flex items-center gap-1 text-sm text-primary">
                <Check className="h-4 w-4" />
                Member
              </div>
            )}
          </div>
        </header>
        
        <div className="px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Community Info - Sidebar */}
            <div className="lg:col-span-4 space-y-4">
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
                
                <CardHeader>
                  <CardTitle>{community.name}</CardTitle>
                </CardHeader>
                
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {community.description || "No description provided."}
                  </p>
                  
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{community.members.length} members</span>
                    <span className="mx-1">•</span>
                    <span>Created {new Date(community.createdAt * 1000).toLocaleDateString()}</span>
                  </div>
                </CardContent>
                
                <CardFooter>
                  {isMember && !isCreator && (
                    <Button 
                      variant="outline" 
                      className="w-full text-red-500 hover:text-red-600"
                      onClick={handleLeaveCommunity}
                    >
                      Leave Community
                    </Button>
                  )}
                </CardFooter>
              </Card>
              
              {/* Members List */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Members ({community.members.length})</CardTitle>
                </CardHeader>
                <CardContent className="max-h-[400px] overflow-y-auto">
                  <div className="space-y-2">
                    {community.members.map((member, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted">
                        <div className="flex-shrink-0">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{member.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="flex-1 truncate">
                          <p className="text-sm font-medium">{nostrService.getNpubFromHex(member).substring(0, 12)}...</p>
                        </div>
                        {member === community.creator && (
                          <span className="bg-primary/20 text-primary text-xs px-2 py-1 rounded-full">Creator</span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Main Content */}
            <div className="lg:col-span-8 space-y-5">
              {/* Proposals Section */}
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Proposals</h2>
                {(isMember || isCreator) && (
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                          <p className="text-sm font-medium">Voting Period</p>
                          <div className="flex items-center gap-2">
                            <input 
                              type="range" 
                              min="1" 
                              max="30" 
                              value={proposalDuration} 
                              onChange={(e) => setProposalDuration(parseInt(e.target.value))}
                              className="flex-1"
                            />
                            <span className="min-w-[100px] text-sm flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {proposalDuration} {proposalDuration === 1 ? 'day' : 'days'}
                            </span>
                          </div>
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
                )}
              </div>
              
              {proposals.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 bg-muted/30 rounded-lg">
                  <p className="mb-2">No proposals have been created yet.</p>
                  {(isMember || isCreator) && (
                    <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(true)}>
                      Create the first proposal
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {proposals.map(proposal => {
                    const voteCounts = getVoteCounts(proposal);
                    const totalVotes = getTotalVotes(proposal);
                    const userVote = getUserVote(proposal);
                    const isActive = isProposalActive(proposal);
                    
                    return (
                      <Card key={proposal.id} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">{proposal.title}</CardTitle>
                            <div className={isActive ? "text-green-500 flex items-center gap-1" : "text-red-500 flex items-center gap-1"}>
                              {isActive ? (
                                <>
                                  <Clock className="h-4 w-4" />
                                  {timeLeft[proposal.id] || "Active"}
                                </>
                              ) : (
                                <>
                                  <Clock className="h-4 w-4" />
                                  Ended
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <span>{totalVotes} votes</span>
                            {userVote !== -1 && (
                              <>
                                <span className="mx-1">•</span>
                                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs flex items-center">
                                  <Check className="h-3 w-3 mr-1" /> Voted
                                </span>
                              </>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-sm">{proposal.description}</p>
                          
                          <div className="space-y-3">
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
                                      className={`h-full ${userVote === index ? 'bg-primary' : 'bg-primary/60'}`} 
                                      style={{ width: `${votePercentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                        
                        <CardFooter className="border-t pt-4 gap-2 flex-wrap">
                          {isActive && currentUserPubkey && (isMember || isCreator) && userVote === -1 && (
                            proposal.options.map((option, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => handleVote(proposal, index)}
                              >
                                {option}
                              </Button>
                            ))
                          )}
                          {isActive && userVote !== -1 && (
                            <div className="w-full text-center text-sm">
                              <span className="text-primary font-medium">You voted for: </span>
                              {proposal.options[userVote]}
                            </div>
                          )}
                          {!isActive && (
                            <div className="w-full text-center text-sm text-muted-foreground">
                              This proposal is closed
                            </div>
                          )}
                          {isActive && currentUserPubkey && !isMember && !isCreator && (
                            <div className="w-full text-center text-sm text-muted-foreground">
                              Join the community to vote
                            </div>
                          )}
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
        <Toaster position="bottom-right" />
      </div>
    </div>
  );
};

export default CommunityPage;
