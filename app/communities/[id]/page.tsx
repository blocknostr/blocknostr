
'use client';

import { Toaster } from "@/components/ui/sonner";
import { useCommunity } from "@/hooks/useCommunity";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams } from "next/navigation";
import PageHeader from "@/components/navigation/PageHeader";

// Import our components
import MembersList from "@/components/MembersList";
import CommunityHeader from "@/components/community/CommunityHeader";
import ProposalList from "@/components/community/ProposalList";
import CommunityLoading from "@/components/community/CommunityLoading";
import CommunityNotFound from "@/components/community/CommunityNotFound";
import CommunityGuidelines from "@/components/community/CommunityGuidelines";
import CommunitySettings from "@/components/community/CommunitySettings";
import CommunityInvites from "@/components/community/CommunityInvites";

export default function CommunityPage() {
  const params = useParams();
  const id = params.id as string;
  
  const {
    community,
    proposals,
    kickProposals,
    inviteLinks,
    loading,
    currentUserPubkey,
    
    // Roles and permissions
    isMember,
    isCreator,
    isModerator,
    isCreatorOnlyMember,
    userRole,
    canCreateProposal,
    canKickPropose,
    canModerate,
    canSetGuidelines,
    
    // Community actions
    handleJoinCommunity,
    handleLeaveCommunity,
    handleCreateKickProposal,
    handleVoteOnKick,
    handleDeleteCommunity,
    handleCreateInvite,
    handleSetPrivate,
    handleSetGuidelines,
    handleAddModerator,
    handleRemoveModerator,
    handleSetCommunityTags
  } = useCommunity(id);
  
  if (loading) {
    return <CommunityLoading />;
  }
  
  if (!community) {
    return <CommunityNotFound />;
  }
  
  return (
    <>
      <PageHeader 
        title={community.name || "Community"}
        showBackButton={true}
        fallbackPath="/communities"
      />
      
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Content - Left side */}
            <div className="lg:col-span-8 space-y-5">
              {/* Community Info */}
              <CommunityHeader 
                community={community}
                currentUserPubkey={currentUserPubkey}
                userRole={userRole}
                onLeaveCommunity={handleLeaveCommunity}
              />
              
              <Tabs defaultValue="proposals" className="w-full">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="proposals">Proposals</TabsTrigger>
                  <TabsTrigger value="guidelines">Guidelines</TabsTrigger>
                  {(isCreator || isModerator) && (
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                  )}
                </TabsList>
                
                {/* Proposals Tab */}
                <TabsContent value="proposals">
                  <ProposalList
                    communityId={community.id}
                    proposals={proposals}
                    isMember={isMember}
                    isCreator={isCreator}
                    currentUserPubkey={currentUserPubkey}
                    canCreateProposal={canCreateProposal}
                  />
                </TabsContent>
                
                {/* Guidelines Tab */}
                <TabsContent value="guidelines">
                  <CommunityGuidelines
                    guidelines={community.guidelines}
                    canEdit={canSetGuidelines}
                    onUpdate={handleSetGuidelines}
                  />
                </TabsContent>
                
                {/* Settings Tab - Only for Creator/Moderators */}
                {(isCreator || isModerator) && (
                  <TabsContent value="settings">
                    <CommunitySettings
                      community={community}
                      isCreator={isCreator}
                      isModerator={isModerator}
                      onSetPrivate={handleSetPrivate}
                      onUpdateTags={handleSetCommunityTags}
                      onAddModerator={handleAddModerator}
                      onRemoveModerator={handleRemoveModerator}
                    />
                  </TabsContent>
                )}
              </Tabs>
            </div>
            
            {/* Right Panel - Members list & Invites */}
            <div className="lg:col-span-4 space-y-5">
              <MembersList 
                community={community}
                currentUserPubkey={currentUserPubkey}
                onKickProposal={handleCreateKickProposal}
                kickProposals={kickProposals}
                onVoteKick={handleVoteOnKick}
                onLeaveCommunity={handleLeaveCommunity}
                userRole={userRole}
                canKickPropose={canKickPropose}
              />
              
              {isMember && (
                <CommunityInvites
                  communityId={community.id}
                  inviteLinks={inviteLinks}
                  onCreateInvite={handleCreateInvite}
                  isPrivate={community.isPrivate}
                />
              )}
            </div>
          </div>
        </div>
        <Toaster position="bottom-right" />
      </div>
    </>
  );
}
