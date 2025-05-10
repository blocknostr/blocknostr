
import { useParams } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import { useCommunity } from "@/hooks/useCommunity";

// Import our components
import MembersList from "@/components/MembersList";
import CommunityHeader from "@/components/community/CommunityHeader";
import ProposalList from "@/components/community/ProposalList";
import CommunityLoading from "@/components/community/CommunityLoading";
import CommunityNotFound from "@/components/community/CommunityNotFound";
import CommunityPageHeader from "@/components/community/CommunityPageHeader";

const CommunityPage = () => {
  const { id } = useParams();
  
  const {
    community,
    proposals,
    kickProposals,
    loading,
    currentUserPubkey,
    isMember,
    isCreator,
    isCreatorOnlyMember,
    handleJoinCommunity,
    handleLeaveCommunity,
    handleCreateKickProposal,
    handleVoteOnKick,
    handleDeleteCommunity
  } = useCommunity(id);
  
  if (loading) {
    return <CommunityLoading />;
  }
  
  if (!community) {
    return <CommunityNotFound />;
  }
  
  // Create a wrapper function to match the expected type signature
  const handleKickProposalWrapper = (kickProposalId: string) => {
    // Call the original function with a default vote value of true
    // This adapts the function to match what MembersList expects
    handleCreateKickProposal(kickProposalId);
  };
  
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 ml-0 md:ml-64 overflow-auto">
        <CommunityPageHeader
          name={community.name}
          isMember={isMember}
          isCreator={isCreator}
          isCreatorOnlyMember={isCreatorOnlyMember}
          currentUserPubkey={currentUserPubkey}
          onJoinCommunity={handleJoinCommunity}
          onLeaveCommunity={handleLeaveCommunity}
          onDeleteCommunity={handleDeleteCommunity}
        />
        
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Content - Left side */}
            <div className="lg:col-span-8 space-y-5">
              {/* Community Info */}
              <CommunityHeader 
                community={community}
                currentUserPubkey={currentUserPubkey}
                isCreator={isCreator}
                isMember={isMember}
                onLeaveCommunity={handleLeaveCommunity}
              />
              
              {/* Proposals Section */}
              <ProposalList
                communityId={community.id}
                proposals={proposals}
                isMember={isMember}
                isCreator={isCreator}
                currentUserPubkey={currentUserPubkey}
              />
            </div>
            
            {/* Right Panel - Members list */}
            <div className="lg:col-span-4">
              <MembersList 
                community={community}
                currentUserPubkey={currentUserPubkey}
                onKickProposal={handleKickProposalWrapper}
                kickProposals={kickProposals}
                onVoteKick={handleVoteOnKick}
                onLeaveCommunity={handleLeaveCommunity}
              />
            </div>
          </div>
        </div>
        <Toaster position="bottom-right" />
      </div>
    </div>
  );
};

export default CommunityPage;
