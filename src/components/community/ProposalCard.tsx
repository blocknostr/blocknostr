
import React, { useState } from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { useProposal } from "@/hooks/business/useProposal";
import { Proposal } from "@/api/types/community";

// Components
import ProposalHeader from "./proposal/ProposalHeader";
import ProposalOptions from "./proposal/ProposalOptions";
import VotingSection from "./proposal/VotingSection";
import DiscussionSection from "./proposal/DiscussionSection";

interface ProposalCardProps {
  proposal: Proposal;
  communityId: string;
  isMember: boolean;
  isCreator: boolean;
  currentUserPubkey: string | null;
  expandedProposal: string | null;
  setExpandedProposal: (id: string | null) => void;
}

const ProposalCard = ({
  proposal,
  communityId,
  isMember,
  isCreator,
  currentUserPubkey,
  expandedProposal,
  setExpandedProposal
}: ProposalCardProps) => {
  const isExpanded = expandedProposal === proposal.id;
  
  const {
    isSubmitting,
    voteCounts,
    totalVotes,
    userVote,
    isActive,
    allVoters,
    selectedOption,
    handleVote
  } = useProposal({
    proposal,
    currentUserPubkey,
    isMember,
    isCreator
  });

  const toggleExpand = () => {
    setExpandedProposal(isExpanded ? null : proposal.id);
  };
  
  return (
    <Card key={proposal.id} className="overflow-hidden w-full max-w-4xl mx-auto">
      <CardHeader className="pb-2">
        <ProposalHeader
          title={proposal.title}
          endsAt={proposal.endsAt}
          userVote={userVote}
          totalVotes={totalVotes}
          allVoters={allVoters}
        />
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm">{proposal.description}</p>
        
        <ProposalOptions 
          options={proposal.options}
          voteCounts={voteCounts}
          totalVotes={totalVotes}
          userVote={userVote}
        />
      </CardContent>
      
      <CardFooter className="border-t pt-4 flex-wrap items-start">
        <div className="w-full">
          <VotingSection
            isActive={isActive}
            userVote={userVote}
            options={proposal.options}
            isSubmitting={isSubmitting}
            isMember={isMember}
            isCreator={isCreator}
            currentUserPubkey={currentUserPubkey}
            selectedOption={selectedOption}
            handleVote={handleVote}
          />
          
          <DiscussionSection
            proposalId={proposal.id}
            communityId={communityId}
            currentUserPubkey={currentUserPubkey}
            isExpanded={isExpanded}
            onToggleExpand={toggleExpand}
          />
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProposalCard;

