
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDAO } from "@/hooks/useDAO";
import { useDAOSubscription } from "@/hooks/useDAOSubscription";
import { UserX, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DAOProposalsList from "@/components/dao/DAOProposalsList";
import DAOMembersList from "@/components/dao/DAOMembersList";
import DAOSettingsDialog from "@/components/dao/DAOSettingsDialog";
import DAOKickProposalDialog from "@/components/dao/DAOKickProposalDialog";
import DAOHeader from "@/components/dao/DAOHeader";
import { toast } from "sonner";

const SingleDAOPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("proposals");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isKickDialogOpen, setIsKickDialogOpen] = useState(false);
  
  const {
    currentDao,
    proposals,
    loading,
    loadingProposals,
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
    voteOnKickProposal
  } = useDAO(id);

  // Set up real-time subscriptions for DAO updates
  const { isConnected } = useDAOSubscription({
    daoId: id,
    onNewProposal: (proposal) => {
      console.log("New proposal received:", proposal);
      // Proposals are handled by the useDAO hook which will refresh
    },
    onNewVote: (vote) => {
      console.log("New vote received:", vote);
      // Votes are handled by the useDAO hook which will refresh
    },
    onDAOUpdate: (dao) => {
      console.log("DAO update received:", dao);
      // DAO updates are handled by the useDAO hook
    }
  });

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="h-16 w-16 animate-spin border-4 border-primary border-t-transparent rounded-full mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading DAO information...</p>
        </div>
      </div>
    );
  }

  if (!currentDao) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <h2 className="text-2xl font-bold mb-4">DAO Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The DAO you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate("/dao")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to DAOs
          </Button>
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
    if (!currentUserPubkey || !isMember(currentDao)) {
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

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6">
      {/* Back button */}
      <Button 
        variant="outline" 
        size="sm" 
        className="mb-6"
        onClick={() => navigate("/dao")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to DAOs
      </Button>
      
      {/* DAO Header */}
      <DAOHeader
        dao={currentDao}
        isMember={isMember(currentDao)}
        isCreator={isCreator(currentDao)}
        currentUserPubkey={currentUserPubkey}
        onJoinDAO={handleJoinDAO}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenKickDialog={() => setIsKickDialogOpen(true)}
      />

      {/* Tabs for Proposals and Members */}
      <Tabs 
        defaultValue="proposals" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="mb-6">
          <TabsTrigger value="proposals">
            Proposals
          </TabsTrigger>
          <TabsTrigger value="members">
            Members
          </TabsTrigger>
          {currentDao.guidelines && (
            <TabsTrigger value="guidelines">
              Guidelines
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="proposals" className="mt-0">
          <DAOProposalsList 
            daoId={currentDao.id}
            proposals={proposals} 
            isLoading={loadingProposals}
            isMember={isMember(currentDao)}
            isCreator={isCreator(currentDao)}
            currentUserPubkey={currentUserPubkey}
            onCreateProposal={createProposal}
            onVoteProposal={voteOnProposal}
          />
        </TabsContent>
        
        <TabsContent value="members" className="mt-0">
          <DAOMembersList 
            dao={currentDao}
            currentUserPubkey={currentUserPubkey}
          />
        </TabsContent>
        
        {currentDao.guidelines && (
          <TabsContent value="guidelines" className="mt-0">
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">DAO Guidelines</h2>
              <div className="prose prose-sm max-w-none">
                {currentDao.guidelines.split('\n').map((line, i) => (
                  <p key={i} className="mb-2">{line}</p>
                ))}
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
      
      {/* Settings Dialog */}
      <DAOSettingsDialog
        dao={currentDao}
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        isCreator={isCreator(currentDao)}
        onUpdatePrivacy={updateDAOPrivacy}
        onUpdateGuidelines={updateDAOGuidelines}
        onUpdateTags={updateDAOTags}
        onAddModerator={addDAOModerator}
        onRemoveModerator={removeDAOModerator}
        onCreateInviteLink={() => createDAOInvite(currentDao.id)}
      />
      
      {/* Kick Proposal Dialog */}
      <DAOKickProposalDialog
        dao={currentDao}
        isOpen={isKickDialogOpen}
        onOpenChange={setIsKickDialogOpen}
        onCreateKickProposal={handleCreateKickProposal}
      />
    </div>
  );
};

export default SingleDAOPage;
