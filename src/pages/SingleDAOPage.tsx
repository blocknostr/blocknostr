
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDAO } from "@/hooks/useDAO";
import { useDAOSubscription } from "@/hooks/useDAOSubscription";
import { Loader2, ArrowLeft, Users, Gavel, Shield, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/ui/page-header";
import { formatDistanceToNow } from "date-fns";
import DAOProposalsList from "@/components/dao/DAOProposalsList";
import DAOMembersList from "@/components/dao/DAOMembersList";

const SingleDAOPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("proposals");
  
  const {
    currentDao,
    proposals,
    loading,
    loadingProposals,
    isMember,
    isCreator,
    currentUserPubkey,
    createProposal,
    voteOnProposal,
    joinDAO
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
          <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
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
    await joinDAO(currentDao.id);
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
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <PageHeader 
              title={currentDao.name}
              description={currentDao.description}
              icon={<Gavel />}
            />
          </div>
          
          {!isMember(currentDao) ? (
            <Button 
              className="w-full md:w-auto"
              onClick={handleJoinDAO}
              disabled={!currentUserPubkey}
            >
              <Users className="h-4 w-4 mr-2" />
              Join DAO
            </Button>
          ) : (
            <Badge variant="outline" className="px-3 py-1.5">
              <Users className="h-4 w-4 mr-2" />
              Member
            </Badge>
          )}
        </div>
        
        {/* DAO metadata */}
        <div className="flex flex-wrap gap-2 mt-4">
          {currentDao.tags && currentDao.tags.map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* DAO Info Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl">DAO Information</CardTitle>
          <CardDescription>Key details about this DAO</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Members</h3>
              <p className="text-2xl font-bold">{currentDao.members.length}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Treasury</h3>
              <p className="text-2xl font-bold">
                {currentDao.treasury.balance} {currentDao.treasury.tokenSymbol}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Created</h3>
              <p className="text-md">
                {formatDistanceToNow(new Date(currentDao.createdAt * 1000), { addSuffix: true })}
              </p>
            </div>
          </div>
          
          <Separator className="my-6" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2 flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Governance
              </h3>
              <p className="text-sm text-muted-foreground">
                This DAO has {currentDao.proposals || 0} total proposals with 
                {' '}{currentDao.activeProposals || 0} currently active.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Activity
              </h3>
              <p className="text-sm text-muted-foreground">
                Created by {currentDao.creator.slice(0, 8)}... with
                {' '}{currentDao.moderators.length} moderators.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Proposals and Members */}
      <Tabs 
        defaultValue="proposals" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="mb-6">
          <TabsTrigger value="proposals">
            <Gavel className="h-4 w-4 mr-2" />
            Proposals
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-2" />
            Members
          </TabsTrigger>
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
      </Tabs>
    </div>
  );
};

export default SingleDAOPage;
