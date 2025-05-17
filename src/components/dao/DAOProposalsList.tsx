
import React, { useState } from "react";
import { Loader2, Plus, ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DAOProposal } from "@/types/dao";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DAOProposalCard from "./DAOProposalCard";
import DAOCreateProposalDialog from "./DAOCreateProposalDialog";

interface DAOProposalsListProps {
  daoId: string;
  proposals: DAOProposal[];
  isLoading: boolean;
  isMember: boolean;
  isCreator: boolean;
  currentUserPubkey: string | null;
  onCreateProposal: (daoId: string, title: string, description: string, options: string[], durationDays: number) => Promise<string | null>;
  onVoteProposal: (proposalId: string, optionIndex: number) => Promise<boolean>;
}

const DAOProposalsList: React.FC<DAOProposalsListProps> = ({
  daoId,
  proposals,
  isLoading,
  isMember,
  isCreator,
  currentUserPubkey,
  onCreateProposal,
  onVoteProposal
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedProposal, setExpandedProposal] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "closed">("all");
  
  // Filter proposals based on status
  const filteredProposals = proposals.filter(proposal => {
    if (filter === "all") return true;
    if (filter === "active") return proposal.status === "active";
    if (filter === "closed") return proposal.status !== "active";
    return true;
  });
  
  const canCreateProposal = currentUserPubkey && (isMember || isCreator);
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading proposals...</p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold">DAO Proposals</h2>
          <div className="ml-4">
            <Select
              value={filter}
              onValueChange={(value) => setFilter(value as "all" | "active" | "closed")}
            >
              <SelectTrigger className="h-9 w-[150px]">
                <div className="flex items-center">
                  <ListOrdered className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All proposals</SelectItem>
                <SelectItem value="active">Active proposals</SelectItem>
                <SelectItem value="closed">Closed proposals</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {canCreateProposal ? (
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
              <DAOCreateProposalDialog
                daoId={daoId}
                onCreateProposal={onCreateProposal}
                onSuccess={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        ) : currentUserPubkey ? (
          <Button variant="outline" disabled title="You must be a member to create proposals">
            <Plus className="h-4 w-4 mr-2" />
            Join to Create Proposals
          </Button>
        ) : null}
      </div>
      
      {filteredProposals.length === 0 ? (
        <div className="text-center text-muted-foreground py-8 bg-muted/30 rounded-lg">
          <p className="mb-2">No proposals found.</p>
          {canCreateProposal && (
            <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(true)}>
              Create the first proposal
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredProposals.map(proposal => (
            <DAOProposalCard
              key={proposal.id}
              proposal={proposal}
              currentUserPubkey={currentUserPubkey}
              onVote={onVoteProposal}
              isMember={isMember}
              isExpanded={expandedProposal === proposal.id}
              onToggleExpanded={() => {
                setExpandedProposal(expandedProposal === proposal.id ? null : proposal.id);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DAOProposalsList;
