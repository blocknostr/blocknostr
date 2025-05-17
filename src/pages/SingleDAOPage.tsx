
import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { MessageSquare, Users, ChevronLeft, Loader2, AlertTriangle, Shield } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { getNpubFromHex } from "@/lib/nostr/utils/keys";
import PageHeader from "@/components/navigation/PageHeader";
import { useDAO } from "@/hooks/useDAO";
import DAOHeader from "@/components/dao/DAOHeader";
import DAOProposalsList from "@/components/dao/DAOProposalsList";
import DAOCreateProposalDialog from "@/components/dao/DAOCreateProposalDialog";
import DAOKickProposalDialog from "@/components/dao/DAOKickProposalDialog";
import DAOKickProposalsList from "@/components/dao/DAOKickProposalsList";
import { daoService } from "@/lib/dao/dao-service";
import { DAO } from "@/types/dao";
import DAOGroupChat from "@/components/dao/DAOGroupChat";
import DAOMembersList from "@/components/dao/DAOMembersList";
import LeaveDaoButton from "@/components/dao/LeaveDaoButton";
import DAOSettingsDialog from "@/components/dao/DAOSettingsDialog";
import DAOGuidelines from "@/components/dao/DAOGuidelines";
import { formatSerialNumber } from "@/lib/dao/dao-utils";
import DAOInvites from "@/components/dao/DAOInvites";
import { nostrService } from "@/lib/nostr";

export default function SingleDAOPage() {
  const [activeTab, setActiveTab] = useState("proposals");
  const [dao, setDao] = useState<DAO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProposalDialogOpen, setIsProposalDialogOpen] = useState(false);
  const [isKickProposalDialogOpen, setIsKickProposalDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [userIsMember, setUserIsMember] = useState(false);
  const [userIsCreator, setUserIsCreator] = useState(false);
  const [userIsModerator, setUserIsModerator] = useState(false);
  
  const { createProposal, createKickProposal, joinDAO, leaveDAO, deleteDAO, currentUserPubkey } = useDAO();
  const { daoId } = useParams();
  
  const fetchData = useCallback(async () => {
    if (!daoId) return;

    setLoading(true);
    setError(null);
    
    try {
      const daoData = await daoService.getDAOById(daoId);
      
      if (!daoData) {
        setError("DAO not found");
        setLoading(false);
        return;
      }
      
      setDao(daoData);
      
      // Set user roles
      const pubkey = nostrService.publicKey;
      if (pubkey) {
        setUserIsMember(daoData.members.includes(pubkey));
        setUserIsCreator(daoData.creator === pubkey);
        setUserIsModerator(daoData.moderators.includes(pubkey));
      }
      
    } catch (err) {
      console.error("Error fetching DAO:", err);
      setError("Failed to load DAO data");
    } finally {
      setLoading(false);
    }
  }, [daoId]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData, currentUserPubkey]);
  
  const handleCreateProposal = async (title: string, description: string, options: string[], durationDays: number) => {
    if (!daoId) return null;
    
    const proposalId = await createProposal(daoId, title, description, options, durationDays);
    if (proposalId) {
      setIsProposalDialogOpen(false);
      toast.success("Proposal created successfully!");
      // Refetch the data
      fetchData();
      return proposalId;
    }
    return null;
  };
  
  const handleCreateKickProposal = async (memberPubkey: string, reason: string) => {
    if (!daoId) return null;
    
    const proposalId = await createKickProposal(daoId, memberPubkey, reason);
    if (proposalId) {
      setIsKickProposalDialogOpen(false);
      toast.success("Kick proposal created successfully!");
      // Refetch the data
      fetchData();
      return proposalId;
    }
    return null;
  };
  
  const handleJoinDAO = async () => {
    if (!daoId) return;
    
    const success = await joinDAO(daoId);
    if (success) {
      toast.success("You have joined the DAO!");
      fetchData();
    }
  };
  
  const handleLeaveDAO = async () => {
    if (!daoId) return;
    
    try {
      const success = await leaveDAO(daoId);
      if (success) {
        toast.success("You have left the DAO");
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to leave DAO");
    }
  };
  
  const handleDeleteDAO = async (): Promise<void> => {
    if (!daoId) return;
    
    try {
      const success = await deleteDAO(daoId);
      if (success) {
        toast.success("DAO deleted successfully");
        // Navigate back to DAO list
        window.location.href = "/dao";
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete DAO");
    }
  };
  
  const handleUpdateSettings = async () => {
    // Reload the DAO data after settings update
    fetchData();
  };

  if (loading) {
    return (
      <div className="container max-w-7xl py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading DAO...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !dao) {
    return (
      <div className="container max-w-7xl py-8">
        <PageHeader
          title="DAO Not Found"
          backButton={{ href: "/dao", label: "Back to DAOs" }} 
        />
        <Alert variant="destructive" className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error || "This DAO could not be found or no longer exists."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Format serial number (like #FD2719)
  const formattedSerialNumber = dao.serialNumber 
    ? formatSerialNumber(dao.serialNumber) 
    : null;

  return (
    <div className="container max-w-7xl py-4 md:py-8">
      {/* Back Button */}
      <div className="mb-4">
        <Button variant="ghost" size="sm" className="gap-1" asChild>
          <a href="/dao">
            <ChevronLeft className="h-4 w-4" />
            Back to DAOs
          </a>
        </Button>
      </div>
      
      {/* DAO Header */}
      <DAOHeader
        dao={dao}
        serialNumber={formattedSerialNumber}
        userIsCreator={userIsCreator}
        userIsMember={userIsMember}
        userIsModerator={userIsModerator}
        onJoinDAO={handleJoinDAO}
        onLeaveDAO={handleLeaveDAO}
        onDeleteDAO={handleDeleteDAO}
        onOpenSettings={() => setIsSettingsDialogOpen(true)}
      />
      
      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-8">
        {/* Left Column: Main Content */}
        <div className="xl:col-span-2 space-y-6">
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="proposals" className="flex items-center gap-2">
                <Shield className="h-4 w-4" /> Proposals
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Chat
              </TabsTrigger>
              <TabsTrigger value="members" className="flex items-center gap-2">
                <Users className="h-4 w-4" /> Members
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="proposals" className="space-y-6">
              {userIsMember && (
                <div className="flex gap-2 mb-4 flex-wrap">
                  <Button onClick={() => setIsProposalDialogOpen(true)}>
                    Create Proposal
                  </Button>
                  
                  {(userIsCreator || userIsModerator) && (
                    <Button variant="outline" onClick={() => setIsKickProposalDialogOpen(true)}>
                      Propose to Kick Member
                    </Button>
                  )}
                </div>
              )}
              
              {dao.guidelines && (
                <DAOGuidelines 
                  guidelines={dao.guidelines} 
                  canEdit={userIsCreator} 
                  onUpdate={() => fetchData()}
                />
              )}
              
              {/* We'll need to adjust these components to match their expected props */}
              <DAOProposalsList 
                daoId={dao.id} 
                currentUserPubkey={currentUserPubkey || ""} 
                proposals={[]} // This would need to be fetched separately
                isLoading={false}
                isMember={userIsMember}
                isCreator={userIsCreator}
                onVote={() => {}} // This would need implementation
                onRefresh={() => {}} // This would need implementation
              />
              
              {/* Kick proposals section */}
              {(userIsCreator || userIsModerator) && (
                <DAOKickProposalsList 
                  proposalId={dao.id}
                  currentUserPubkey={currentUserPubkey || ""}
                />
              )}
            </TabsContent>
            
            <TabsContent value="chat">
              <DAOGroupChat 
                daoId={dao.id}
                daoName={dao.name}
                currentUserPubkey={currentUserPubkey || ""}
                isMember={userIsMember}
              />
            </TabsContent>
            
            <TabsContent value="members">
              <DAOMembersList 
                dao={dao}
                currentUserPubkey={currentUserPubkey || ""}
              />
              
              {userIsCreator && (
                <DAOInvites 
                  daoId={dao.id}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Right Column: DAO Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About this DAO</CardTitle>
              <CardDescription>
                {formattedSerialNumber && (
                  <Badge variant="outline" className="mb-2">
                    {formattedSerialNumber}
                  </Badge>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Description</h4>
                <p className="text-sm text-muted-foreground">{dao.description}</p>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="text-sm font-medium mb-1">Creator</h4>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${dao.creator.substring(0, 8)}`} />
                    <AvatarFallback>{dao.creator.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground truncate">
                    {getNpubFromHex(dao.creator).substring(0, 10)}...
                  </span>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="text-sm font-medium mb-1">Tags</h4>
                <div className="flex flex-wrap gap-1 mt-1">
                  {dao.tags && dao.tags.length > 0 ? (
                    dao.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary">{tag}</Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No tags</span>
                  )}
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="text-sm font-medium mb-1">Stats</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 bg-muted/50 rounded-md">
                    <p className="text-lg font-medium">{dao.members.length}</p>
                    <p className="text-xs text-muted-foreground">Members</p>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded-md">
                    <p className="text-lg font-medium">{dao.proposals || 0}</p>
                    <p className="text-xs text-muted-foreground">Proposals</p>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded-md">
                    <p className="text-lg font-medium">{dao.activeProposals || 0}</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* User Actions */}
          {currentUserPubkey && userIsMember && (
            <Card>
              <CardHeader>
                <CardTitle>Your Membership</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userIsCreator ? (
                    <div>
                      <Badge className="mb-2">Creator</Badge>
                      <p className="text-sm text-muted-foreground mb-3">
                        You created this DAO. You can manage settings and moderate members.
                      </p>
                      <Button 
                        variant="destructive" 
                        onClick={handleDeleteDAO}
                        disabled={dao.members.length > 1}
                        className="w-full"
                      >
                        Delete DAO
                      </Button>
                      {dao.members.length > 1 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          You can only delete the DAO when you're the only member.
                        </p>
                      )}
                    </div>
                  ) : userIsModerator ? (
                    <div>
                      <Badge className="mb-2">Moderator</Badge>
                      <p className="text-sm text-muted-foreground mb-3">
                        You're a moderator of this DAO. You can help manage proposals and members.
                      </p>
                      <LeaveDaoButton onLeave={handleLeaveDAO} />
                    </div>
                  ) : (
                    <div>
                      <Badge className="mb-2">Member</Badge>
                      <p className="text-sm text-muted-foreground mb-3">
                        You're a member of this DAO. You can participate in proposals and discussions.
                      </p>
                      <LeaveDaoButton onLeave={handleLeaveDAO} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Dialogs */}
      <DAOCreateProposalDialog 
        open={isProposalDialogOpen} 
        onOpenChange={setIsProposalDialogOpen}
        onCreateProposal={handleCreateProposal}
      />
      
      <DAOKickProposalDialog 
        open={isKickProposalDialogOpen}
        onOpenChange={setIsKickProposalDialogOpen}
        onCreateKickProposal={handleCreateKickProposal}
        dao={dao}
        currentUserPubkey={currentUserPubkey || ""}
      />
      
      <DAOSettingsDialog
        open={isSettingsDialogOpen}
        onOpenChange={setIsSettingsDialogOpen}
        dao={dao}
        onUpdate={handleUpdateSettings}
      />
    </div>
  );
}
