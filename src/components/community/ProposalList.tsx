
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, ListOrdered } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProposalCard from "./ProposalCard";
import CreateProposalForm from "./CreateProposalForm";
import { Proposal, ProposalCategory } from "@/types/community";

interface ProposalListProps {
  communityId: string;
  proposals: Proposal[];
  isMember: boolean;
  isCreator: boolean;
  currentUserPubkey: string | null;
  canCreateProposal: boolean;
}

const ProposalList = ({ 
  communityId, 
  proposals, 
  isMember, 
  isCreator, 
  currentUserPubkey,
  canCreateProposal
}: ProposalListProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedProposal, setExpandedProposal] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<ProposalCategory | 'all'>('all');
  
  // Filter proposals by category
  const filteredProposals = categoryFilter === 'all' 
    ? proposals
    : proposals.filter(p => p.category === categoryFilter);
  
  // Group proposals by category for rendering
  const categories = ['governance', 'feature', 'poll', 'other'];
  
  // Count proposals by category
  const categoryCounts = categories.reduce((acc, category) => {
    acc[category] = proposals.filter(p => p.category === category).length;
    return acc;
  }, {} as Record<string, number>);
  
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold">Proposals</h2>
          <div className="ml-4">
            <Select
              value={categoryFilter}
              onValueChange={(value) => setCategoryFilter(value as ProposalCategory | 'all')}
            >
              <SelectTrigger className="h-8 w-[180px]">
                <div className="flex items-center">
                  <ListOrdered className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All categories" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories ({proposals.length})</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)} ({categoryCounts[category] || 0})
                  </SelectItem>
                ))}
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
              <CreateProposalForm 
                communityId={communityId} 
                onProposalCreated={() => setIsDialogOpen(false)} 
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
          {categoryFilter === 'all' ? (
            <>
              <p className="mb-2">No proposals have been created yet.</p>
              {canCreateProposal && (
                <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(true)}>
                  Create the first proposal
                </Button>
              )}
            </>
          ) : (
            <>
              <p className="mb-2">No {categoryFilter} proposals found.</p>
              {canCreateProposal && (
                <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(true)}>
                  Create a {categoryFilter} proposal
                </Button>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredProposals.map(proposal => (
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
