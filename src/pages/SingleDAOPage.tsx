import React, { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useDAO } from "@/hooks/useDAO";
import { useDAOSubscription } from "@/hooks/useDAOSubscription";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DAOProposalsList from "@/components/dao/DAOProposalsList";
import DAOMembersList from "@/components/dao/DAOMembersList";
import DAOSettingsDialog from "@/components/dao/DAOSettingsDialog";
import DAOKickProposalDialog from "@/components/dao/DAOKickProposalDialog";
import DAOHeader from "@/components/dao/DAOHeader";
import DAOKickProposalsList from "@/components/dao/DAOKickProposalsList";
import Sidebar from "@/components/sidebar/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import DAOPageHeader from "@/components/dao/DAOPageHeader";
import DAOGuidelines from "@/components/dao/DAOGuidelines";

const SingleDAOPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<string>("proposals");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isKickDialogOpen, setIsKickDialogOpen] = useState(false);
  
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
    refreshDaos
  } = useDAO(id);

  // Set up real-time subscriptions for DAO updates
  const { isConnected } = useDAOSubscription({
    daoId: id,
    onNewProposal: (proposal) => {
      console.log("New proposal received:", proposal);
    },
    onNewVote: (vote) => {
      console.log("New vote received:", vote);
    },
    onDAOUpdate: (dao) => {
      console.log("DAO update received:", dao);
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

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1">
          <div className="container max-w-6xl mx-auto px-4 py-6">
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
        <div className="flex-1">
          <div className="container max-w-6xl mx-auto px-4 py-6">
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
      return success;
    } catch (error) {
      console.error("Error creating kick proposal:", error);
      return false;
    }
  };
  
  const handleLeaveDAO = async () => {
    // This would be implemented in the useDAO hook
    toast.error("Leave DAO functionality not yet implemented");
  };
  
  const handleDeleteDAO = async () => {
    // This would be implemented in the useDAO hook
    toast.error("Delete DAO functionality not yet implemented");
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

  // Fix for the voteOnProposal issue - use the updated signature
  const handleVoteOnProposal = async (proposalId: string, optionIndex: number) => {
    return await voteOnProposal(proposalId, optionIndex);
  };
  
  // Fix for the voteOnKickProposal issue - accept boolean and convert to number
  const handleVoteOnKickProposal = async (proposalId: string, vote: boolean) => {
    // Convert boolean vote to number (true -> 0, false -> 1)
    const optionIndex = vote ? 0 : 1; // Invert the logic: true = "Yes, remove" (0), false = "No, keep" (1)
    return await voteOnKickProposal(proposalId, optionIndex);
  };

  // Add a function to refresh proposals
  const refreshProposals = useCallback(async () => {
    // Check if there's an ID before trying to refresh
    if (id) {
      try {
        await refreshDaos(); // This should refresh all DAO data including proposals
      } catch (error) {
        console.error("Error refreshing proposals:", error);
        toast.error("Failed to refresh proposals");
      }
    }
  }, [id, refreshDaos]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1">
        <DAOPageHeader
          name={currentDao?.name || ""}
          isMember={isMemberOfCurrentDao}
          isCreator={isCreatorOfCurrentDao}
          isCreatorOnlyMember={currentDao && currentDao.members.length === 1 && currentDao.members[0] === currentDao.creator}
          currentUserPubkey={currentUserPubkey}
          onJoinDAO={handleJoinDAO}
          onLeaveDAO={handleLeaveDAO}
          onDeleteDAO={isCreatorOnlyMember ? handleDeleteDAO : undefined}
          isPrivate={currentDao?.isPrivate}
        />
        
        <div className="container max-w-6xl mx-auto px-4 py-6">
          <div className="space-y-5">
            {/* DAO Info */}
            {currentDao && (
              <DAOHeader 
                dao={currentDao}
                currentUserPubkey={currentUserPubkey}
                userRole={userRole}
                onLeaveDAO={handleLeaveDAO}
                onDeleteDAO={handleDeleteDAO}
                isCreatorOnlyMember={isCreatorOnlyMember}
              />
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-5">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-3 mb-4">
                    <TabsTrigger value="proposals">Proposals</TabsTrigger>
                    {hasKickProposals && (
                      <TabsTrigger value="kick-proposals">
                        Member Removals
                      </TabsTrigger>
                    )}
                    {canModerate && (
                      <TabsTrigger value="settings">Settings</TabsTrigger>
                    )}
                  </TabsList>
                  
                  {/* Proposals Tab */}
                  <TabsContent value="proposals">
                    <DAOProposalsList
                      daoId={currentDao?.id || ""}
                      proposals={proposals}
                      isLoading={loadingProposals}
                      isMember={isMemberOfCurrentDao}
                      isCreator={isCreatorOfCurrentDao}
                      currentUserPubkey={currentUserPubkey}
                      onCreateProposal={createProposal}
                      onVoteProposal={handleVoteOnProposal}
                      onRefreshProposals={refreshProposals}
                    />
                  </TabsContent>
                  
                  {/* Kick Proposals Tab */}
                  {hasKickProposals && (
                    <TabsContent value="kick-proposals">
                      <DAOKickProposalsList
                        proposals={kickProposals}
                        currentUserPubkey={currentUserPubkey}
                        onVote={handleVoteOnKickProposal}
                        isLoading={loadingKickProposals}
                      />
                    </TabsContent>
                  )}
                  
                  {/* Settings Tab - Only for Creator/Moderators */}
                  {canModerate && currentDao && (
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
                        hideGuidelines={true} // Hide guidelines section
                      />
                    </TabsContent>
                  )}
                </Tabs>
              </div>
              
              {/* Right Panel - Members list */}
              <div className="lg:col-span-1">
                {currentDao && (
                  <DAOMembersList 
                    dao={currentDao}
                    currentUserPubkey={currentUserPubkey}
                    onKickProposal={handleCreateKickProposal}
                    kickProposals={kickProposals}
                    onVoteKick={handleVoteOnKickProposal}
                    onLeaveDAO={handleLeaveDAO}
                    userRole={userRole}
                    canKickPropose={canKickPropose}
                    onCreateInvite={canModerate ? handleCreateInvite : undefined}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
        <Toaster position="bottom-right" />
      </div>
      
      {/* Show the kick proposal dialog when needed */}
      {currentDao && (
        <DAOKickProposalDialog
          dao={currentDao}
          isOpen={isKickDialogOpen}
          onOpenChange={setIsKickDialogOpen}
          onCreateKickProposal={handleCreateKickProposal}
        />
      )}
    </div>
  );
};

export default SingleDAOPage;
