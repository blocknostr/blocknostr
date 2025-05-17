
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDAO } from "@/hooks/useDAO";
import { useDAOSubscription } from "@/hooks/useDAOSubscription";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DAOProposalsList from "@/components/dao/DAOProposalsList";
import DAOMembersList from "@/components/dao/DAOMembersList";
import DAOSettingsDialog from "@/components/dao/DAOSettingsDialog";
import DAOKickProposalDialog from "@/components/dao/DAOKickProposalDialog";
import DAOHeader from "@/components/dao/DAOHeader";
import DAOKickProposalsList from "@/components/dao/DAOKickProposalsList";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import DAOPageHeader from "@/components/dao/DAOPageHeader";
import DAOGuidelines from "@/components/dao/DAOGuidelines";
import DAOGroupChat from "@/components/dao/DAOGroupChat";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const SingleDAOPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("proposals");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isKickDialogOpen, setIsKickDialogOpen] = useState(false);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLeavingDAO, setIsLeavingDAO] = useState(false);
  const [isDeletingDAO, setIsDeletingDAO] = useState(false);
  
  const {
    currentDao,
    proposals,
    kickProposals,
    loading,
    loadingProposals,
    loadingKickProposals,
    isMember,
    isCreator,
    isModerator,
    currentUserPubkey,
    createProposal,
    voteOnProposal,
    joinDAO,
    updateDAOPrivacy,
    updateDAOGuidelines,
    updateDAOTags,
    addDAOModerator,
    removeDAOModerator,
    createDAOInvite,
    createKickProposal,
    voteOnKickProposal,
    leaveDAO,
    deleteDAO
  } = useDAO(id);

  // Set up real-time subscriptions for DAO updates
  const { isConnected } = useDAOSubscription({
    daoId: id,
    onNewProposal: (proposal) => {
      console.log("New proposal received:", proposal);
      toast.info(`New proposal: ${proposal.title}`);
    },
    onNewVote: (vote) => {
      console.log("New vote received:", vote);
    },
    onDAOUpdate: (dao) => {
      console.log("DAO update received:", dao);
      toast.info("DAO information updated");
    }
  });

  // Fix type issues by properly checking if user is a member and creator
  const isMemberOfCurrentDao = currentDao ? isMember(currentDao) : false;
  const isCreatorOfCurrentDao = currentDao ? isCreator(currentDao) : false;
  const isModeratorOfCurrentDao = currentDao ? isModerator(currentDao) : false;
  
  // Determine role for member
  const userRole = isCreatorOfCurrentDao ? 'creator' : isModeratorOfCurrentDao ? 'moderator' : isMemberOfCurrentDao ? 'member' : null;
  
  // Determine if we should show the kick proposals tab
  const hasKickProposals = !loadingKickProposals && kickProposals.length > 0;
  
  // Check if the creator is the only member
  const isCreatorOnlyMember = currentDao && currentDao.members.length === 1 && currentDao.members[0] === currentDao.creator;
  
  // Permission checks
  const canModerate = isCreatorOfCurrentDao || isModeratorOfCurrentDao;
  const canCreateProposal = currentUserPubkey && isMemberOfCurrentDao;
  const canKickPropose = currentUserPubkey && isMemberOfCurrentDao && !isCreatorOfCurrentDao;
  const canCreateInvite = canModerate; // Only moderators and creators can create invites
  const canLeaveDAO = isMemberOfCurrentDao && !isCreatorOfCurrentDao;
  const canDeleteDAO = isCreatorOfCurrentDao && isCreatorOnlyMember;

  // Add tabs state management
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 ml-0 md:ml-64 overflow-auto">
          <div className="container mx-auto px-4 py-12 max-w-5xl">
            <div className="flex flex-col items-center justify-center h-64">
              <div className="h-16 w-16 animate-spin border-4 border-primary border-t-transparent rounded-full mb-4"></div>
              <p className="text-lg text-muted-foreground">Loading DAO information...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentDao) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 ml-0 md:ml-64 overflow-auto">
          <div className="container mx-auto px-4 py-12 max-w-5xl">
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <h2 className="text-2xl font-bold mb-4">DAO Not Found</h2>
              <p className="text-muted-foreground mb-6">
                The DAO you're looking for doesn't exist or has been removed.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleJoinDAO = async () => {
    if (!currentUserPubkey) {
      toast.error("Please login to join this DAO");
      return;
    }
    
    try {
      await joinDAO(currentDao.id);
      toast.success(`Successfully joined ${currentDao.name}`);
    } catch (error) {
      console.error("Error joining DAO:", error);
      toast.error("Failed to join the DAO");
    }
  };
  
  const handleCreateKickProposal = async (memberToKick: string, reason: string) => {
    if (!currentUserPubkey || !isMemberOfCurrentDao) {
      toast.error("You must be a member to create kick proposals");
      return false;
    }
    
    try {
      const success = await createKickProposal(currentDao.id, memberToKick, reason);
      if (success) {
        toast.success("Kick proposal created successfully");
      }
      return success;
    } catch (error) {
      console.error("Error creating kick proposal:", error);
      toast.error("Failed to create kick proposal");
      return false;
    }
  };
  
  const handleLeaveDAO = async () => {
    if (!id) return;
    
    setIsLeavingDAO(true);
    try {
      const success = await leaveDAO(id);
      if (success) {
        toast.success(`You have left the DAO: ${currentDao.name}`);
        setIsLeaveDialogOpen(false);
        // Navigate back to DAOs list
        setTimeout(() => navigate("/dao"), 1000);
      } else {
        throw new Error("Failed to leave DAO");
      }
    } catch (error) {
      console.error("Error leaving DAO:", error);
      toast.error("Failed to leave the DAO");
    } finally {
      setIsLeavingDAO(false);
    }
  };
  
  const handleDeleteDAO = async () => {
    if (!id || !canDeleteDAO) return;
    
    setIsDeletingDAO(true);
    try {
      const success = await deleteDAO(id);
      if (success) {
        toast.success(`DAO deleted: ${currentDao.name}`);
        setIsDeleteDialogOpen(false);
        // Navigate back to DAOs list
        setTimeout(() => navigate("/dao"), 1000);
      } else {
        throw new Error("Failed to delete DAO");
      }
    } catch (error) {
      console.error("Error deleting DAO:", error);
      toast.error("Failed to delete the DAO");
    } finally {
      setIsDeletingDAO(false);
    }
  };
  
  const handleCreateInvite = async () => {
    if (!currentUserPubkey || !canModerate) {
      toast.error("Only moderators and creators can create invites");
      return null;
    }
    
    try {
      const inviteLink = await createDAOInvite(currentDao.id);
      return inviteLink;
    } catch (error) {
      console.error("Error creating invite:", error);
      return null;
    }
  };

  // Wrapper functions to fix type issues with function parameters
  const handleUpdateDAOPrivacy = async (daoId: string, isPrivate: boolean) => {
    return await updateDAOPrivacy(isPrivate);
  };

  const handleUpdateDAOTags = async (daoId: string, tags: string[]) => {
    return await updateDAOTags(tags);
  };

  // Fix for the voteOnProposal issue - adapt the function signature
  const handleVoteOnProposal = async (proposalId: string, vote: boolean) => {
    // Convert boolean vote to option index (0 for true, 1 for false)
    const optionIndex = vote ? 0 : 1;
    return await voteOnProposal(proposalId, optionIndex);
  };
  
  // Fix for the voteOnKickProposal issue - adapt the function signature
  const handleVoteOnKickProposal = async (proposalId: string, vote: boolean) => {
    // Convert boolean vote to option index (0 for true, 1 for false)
    const optionIndex = vote ? 0 : 1;
    return await voteOnKickProposal(proposalId, optionIndex);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 ml-0 md:ml-64 overflow-auto">
        <DAOPageHeader
          name={currentDao.name}
          isMember={isMemberOfCurrentDao}
          isCreator={isCreatorOfCurrentDao}
          isCreatorOnlyMember={isCreatorOnlyMember}
          currentUserPubkey={currentUserPubkey}
          onJoinDAO={handleJoinDAO}
          onLeaveDAO={() => setIsLeaveDialogOpen(true)}
          onDeleteDAO={canDeleteDAO ? () => setIsDeleteDialogOpen(true) : undefined}
          isPrivate={currentDao.isPrivate}
          serialNumber={currentDao.serialNumber}
        />
        
        <div className="container mx-auto px-4 py-6 max-w-3xl"> 
          <div className="space-y-5">
            {/* DAO Info */}
            <DAOHeader 
              dao={currentDao}
              currentUserPubkey={currentUserPubkey}
              userRole={userRole}
              onLeaveDAO={() => setIsLeaveDialogOpen(true)}
              onDeleteDAO={canDeleteDAO ? () => setIsDeleteDialogOpen(true) : undefined}
              isCreatorOnlyMember={isCreatorOnlyMember}
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-5">
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                  <TabsList className="grid grid-cols-3 mb-4">
                    <TabsTrigger value="proposals">Proposals</TabsTrigger>
                    <TabsTrigger value="chat">Chat</TabsTrigger>
                    {canModerate && (
                      <TabsTrigger value="settings">Settings</TabsTrigger>
                    )}
                  </TabsList>
                  
                  {/* Proposals Tab */}
                  <TabsContent value="proposals">
                    <DAOProposalsList
                      daoId={currentDao.id}
                      proposals={proposals}
                      isLoading={loadingProposals}
                      isMember={isMemberOfCurrentDao}
                      isCreator={isCreatorOfCurrentDao}
                      currentUserPubkey={currentUserPubkey}
                      onCreateProposal={createProposal}
                      onVoteProposal={handleVoteOnProposal}
                    />
                  </TabsContent>

                  {/* Chat Tab */}
                  <TabsContent value="chat">
                    <DAOGroupChat
                      daoId={currentDao.id}
                      daoName={currentDao.name}
                      currentUserPubkey={currentUserPubkey || ""}
                      isMember={isMemberOfCurrentDao}
                    />
                  </TabsContent>
                  
                  {/* Settings Tab - Only for Creator/Moderators */}
                  {canModerate && (
                    <TabsContent value="settings">
                      <DAOSettingsDialog
                        dao={currentDao}
                        isOpen={true}
                        onOpenChange={() => {}}
                        isCreator={isCreatorOfCurrentDao}
                        onUpdatePrivacy={handleUpdateDAOPrivacy}
                        onUpdateGuidelines={updateDAOGuidelines}
                        onUpdateTags={handleUpdateDAOTags}
                        onAddModerator={addDAOModerator}
                        onRemoveModerator={removeDAOModerator}
                        onCreateInviteLink={() => createDAOInvite(currentDao.id)}
                        embedded={true}
                        hideGuidelines={true}
                      />
                    </TabsContent>
                  )}
                </Tabs>
              </div>
              
              {/* Right Panel - Members list */}
              <div className="lg:col-span-1">
                <DAOMembersList 
                  dao={currentDao}
                  currentUserPubkey={currentUserPubkey}
                  onKickProposal={handleCreateKickProposal}
                  kickProposals={kickProposals}
                  onVoteKick={handleVoteOnKickProposal}
                  onLeaveDAO={() => setIsLeaveDialogOpen(true)}
                  userRole={userRole}
                  canKickPropose={canKickPropose}
                  onCreateInvite={canModerate ? handleCreateInvite : undefined}
                />
              </div>
            </div>
          </div>
        </div>
        <Toaster position="bottom-right" />
      </div>
      
      {/* Keep the kick proposal dialog */}
      <DAOKickProposalDialog
        dao={currentDao}
        isOpen={isKickDialogOpen}
        onOpenChange={setIsKickDialogOpen}
        onCreateKickProposal={handleCreateKickProposal}
      />

      {/* Leave DAO Confirmation Dialog */}
      <AlertDialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave DAO</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave this DAO? You will need to be invited back to rejoin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLeavingDAO}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleLeaveDAO();
              }}
              disabled={isLeavingDAO}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLeavingDAO ? "Leaving..." : "Leave DAO"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete DAO Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete DAO</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this DAO? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingDAO}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteDAO();
              }}
              disabled={isDeletingDAO}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingDAO ? "Deleting..." : "Delete DAO"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SingleDAOPage;
