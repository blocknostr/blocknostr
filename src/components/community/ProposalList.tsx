
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ProposalCard from "./ProposalCard";
import CreateProposalForm from "./CreateProposalForm";
import { Proposal } from "@/types/community"; // Import Proposal type from types

interface ProposalListProps {
  communityId: string;
  proposals: Proposal[];
  isMember: boolean;
  isCreator: boolean;
  currentUserPubkey: string | null;
}

const ProposalList = ({ 
  communityId, 
  proposals, 
  isMember, 
  isCreator, 
  currentUserPubkey 
}: ProposalListProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedProposal, setExpandedProposal] = useState<string | null>(null);
  
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Proposals</h2>
        {(isMember || isCreator) && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Proposal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create a new proposal</DialogTitle>
              </DialogHeader>
              <CreateProposalForm 
                communityId={communityId} 
                onProposalCreated={() => setIsDialogOpen(false)} 
              />
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
        <div className="grid gap-4 md:grid-cols-2">
          {proposals.map(proposal => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              communityId={communityId}
              isMember={isMember}
              isCreator={isCreator}
              currentUserPubkey={currentUserPubkey}
              expandedProposal={expandedProposal}
              setExpandedProposal={setExpandedProposal}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default ProposalList;
