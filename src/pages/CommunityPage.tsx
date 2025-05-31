import { useParams } from "react-router-dom";
import { Toaster } from "@/lib/toast";
import { useCommunity } from "@/hooks/business/useCommunity";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

// Import our components
import MembersDialog from "@/components/community/MembersDialog";
import CommunityHeader from "@/components/community/CommunityHeader";
import ProposalList from "@/components/community/ProposalList";
import CommunityLoading from "@/components/community/CommunityLoading";
import CommunityNotFound from "@/components/community/CommunityNotFound";
import CommunityPageHeader from "@/components/community/CommunityPageHeader";
import CommunityGuidelines from "@/components/community/CommunityGuidelines";
import CommunitySettings from "@/components/community/CommunitySettings";

// Import community posts and moderation components
import CommunityPostForm from "@/components/dao/CommunityPostForm";
import CommunityPostList from "@/components/dao/CommunityPostList";
import PendingPostsList from "@/components/dao/PendingPostsList";
import ModerationQueue from "@/components/community/ModerationQueue";

import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";

// Import community posts hook
import CommunityPosts from "@/components/community/CommunityPosts";

// Other imports
import { useIsMobile } from "@/hooks/ui/use-mobile";
import { useAuth } from "@/hooks/useAuth";

// DAO-related imports
import { useCommunities } from "@/hooks/business/useCommunities";
import { Community } from "@/api/types/community";

// Debug imports
import CommunityAnalytics from "@/components/debug/CommunityAnalytics";
import { useCommunityPosts } from "@/hooks/business/useCommunityPosts";

const CommunityPage = () => {
  const { id } = useParams();
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false);
  
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
    handleCreateProposal,
    handleCreateKickProposal,
    handleVoteOnKick,
    handleDeleteCommunity,
    handleCreateInvite,
    handleSetPrivate,
    handleSetGuidelines,
    handleAddModerator,
    handleRemoveModerator,
    handleSetCommunityTags,
    handleSetAlphaWallet
  } = useCommunity(id);

  // Community posts functionality
  const {
    approvedPosts,
    pendingPosts,
    rejectedPosts,
    contentReports,
    moderationLogs,
    bannedMembers,
    loadingPosts,
    loadingPendingPosts,
    loadingReports,
    submitCommunityPost,
    approveCommunityPost,
    rejectCommunityPost,
    reportContent,
    banMember,
    unbanMember,
    reviewContentReport
  } = useCommunityPosts(id || '');
  
  if (loading) {
    return <CommunityLoading />;
  }
  
  if (!community) {
    return <CommunityNotFound />;
  }

  // Calculate pending counts for moderation badge
  const pendingPostsCount = pendingPosts.length;
  const pendingReportsCount = contentReports.filter(r => r.status === 'pending').length;

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
        <CommunityPageHeader
          name={community.name}
          isMember={isMember}
          isCreator={isCreator}
          isCreatorOnlyMember={isCreatorOnlyMember}
          currentUserPubkey={currentUserPubkey}
          onJoinCommunity={handleJoinCommunity}
          onLeaveCommunity={handleLeaveCommunity}
          onDeleteCommunity={handleDeleteCommunity}
          isPrivate={community.isPrivate}
        />
        
        {/* Community Header - Full Width */}
        <div className="mt-6">
          <CommunityHeader 
            community={community}
            currentUserPubkey={currentUserPubkey}
            userRole={userRole}
            onLeaveCommunity={handleLeaveCommunity}
            onDeleteCommunity={handleDeleteCommunity}
            isCreatorOnlyMember={isCreatorOnlyMember}
            onMembersClick={() => setIsMembersDialogOpen(true)}
          />
        </div>

        {/* Tabs - Full Width */}
        <div className="mt-6">
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className={`grid ${(isCreator || isModerator) ? 'grid-cols-5' : 'grid-cols-3'} mb-4`}>
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="proposals">Proposals</TabsTrigger>
              <TabsTrigger value="guidelines">Guidelines</TabsTrigger>
              {(isCreator || isModerator) && (
                <TabsTrigger value="moderation" className="relative">
                  Moderation
                  {(pendingPostsCount > 0 || pendingReportsCount > 0) && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white px-1.5 py-0.5 rounded-full text-xs min-w-[1.25rem] h-5 flex items-center justify-center">
                      {pendingPostsCount + pendingReportsCount}
                    </span>
                  )}
                </TabsTrigger>
              )}
              {(isCreator || isModerator) && (
                <TabsTrigger value="settings">Settings</TabsTrigger>
              )}
            </TabsList>
            
            {/* Posts Tab */}
            <TabsContent value="posts" className="space-y-4">
              {/* Post submission form for members */}
              {isMember && (
                <CommunityPostForm
                  onSubmit={submitCommunityPost}
                  isSubmitting={loadingPosts}
                />
              )}
              
              {/* Approved posts list */}
              <CommunityPostList
                posts={approvedPosts}
                isLoading={loadingPosts}
                currentUserPubkey={currentUserPubkey}
                onReportContent={canModerate ? reportContent : undefined}
              />
            </TabsContent>
            
            {/* Proposals Tab */}
            <TabsContent value="proposals">
              <ProposalList
                communityId={community.id}
                proposals={proposals}
                isMember={isMember}
                isCreator={isCreator}
                currentUserPubkey={currentUserPubkey}
                canCreateProposal={canCreateProposal}
                onCreateProposal={handleCreateProposal}
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
            
            {/* Moderation Tab - Only for Creator/Moderators */}
            {(isCreator || isModerator) && (
              <TabsContent value="moderation">
                <ModerationQueue
                  communityId={community.id}
                  pendingPosts={pendingPosts}
                  rejectedPosts={rejectedPosts}
                  contentReports={contentReports}
                  moderationLogs={moderationLogs}
                  bannedMembers={bannedMembers}
                  isLoading={loadingPendingPosts || loadingReports}
                  onApprovePost={approveCommunityPost}
                  onRejectPost={rejectCommunityPost}
                  onReviewReport={reviewContentReport}
                  onBanMember={banMember}
                  onUnbanMember={unbanMember}
                  currentUserPubkey={currentUserPubkey}
                  isCreator={isCreator}
                />
              </TabsContent>
            )}
            
            {/* Settings Tab - Only for Creator/Moderators */}
            {(isCreator || isModerator) && (
              <TabsContent value="settings">
                <CommunitySettings
                  community={community}
                  isCreator={isCreator}
                  isModerator={isModerator}
                  isCreatorOnlyMember={isCreatorOnlyMember}
                  onSetPrivate={handleSetPrivate}
                  onUpdateTags={handleSetCommunityTags}
                  onAddModerator={handleAddModerator}
                  onRemoveModerator={handleRemoveModerator}
                  onDeleteCommunity={handleDeleteCommunity}
                  onSetAlphaWallet={handleSetAlphaWallet}
                />
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Members Dialog */}
        <MembersDialog
          open={isMembersDialogOpen}
          onOpenChange={setIsMembersDialogOpen}
          community={community}
          currentUserPubkey={currentUserPubkey}
          onKickProposal={handleCreateKickProposal}
          kickProposals={kickProposals}
          onVoteKick={handleVoteOnKick}
          onLeaveCommunity={handleLeaveCommunity}
          userRole={userRole}
          canKickPropose={canKickPropose}
          isMember={isMember}
          onCreateInvite={handleCreateInvite}
        />
        <Toaster position="bottom-right" />
    </div>
  );
};

export default CommunityPage;

