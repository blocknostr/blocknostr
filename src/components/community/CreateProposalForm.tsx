
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Clock, Plus } from "lucide-react";
import { nostrService } from "@/lib/nostr";

interface CreateProposalFormProps {
  communityId: string;
  onProposalCreated: () => void;
}

const CreateProposalForm = ({ communityId, onProposalCreated }: CreateProposalFormProps) => {
  const [newProposalTitle, setNewProposalTitle] = useState("");
  const [newProposalDesc, setNewProposalDesc] = useState("");
  const [newProposalOptions, setNewProposalOptions] = useState<string[]>(["Yes", "No"]);
  const [proposalDuration, setProposalDuration] = useState(7); // Default 7 days
  const [isCreatingProposal, setIsCreatingProposal] = useState(false);
  
  const handleCreateProposal = async () => {
    if (!nostrService.publicKey) {
      toast.error("You must be logged in to create a proposal");
      return;
    }
    
    // Double-check membership status before creating proposal
    const community = await nostrService.fetchCommunity(communityId);
    if (!community || !community.members.includes(nostrService.publicKey)) {
      toast.error("You must be a member of this community to create proposals");
      return;
    }
    
    if (!newProposalTitle.trim()) {
      toast.error("Proposal title is required");
      return;
    }
    
    if (newProposalOptions.length < 2) {
      toast.error("At least two options are required");
      return;
    }
    
    setIsCreatingProposal(true);
    
    try {
      // Calculate endsAt based on the proposalDuration in days
      const endsAt = Math.floor(Date.now() / 1000) + (proposalDuration * 24 * 60 * 60);
      
      const proposalId = await nostrService.createProposal(
        communityId,
        newProposalTitle.trim(),
        newProposalDesc.trim(),
        newProposalOptions.filter(opt => opt.trim() !== ""),
        endsAt
      );
      
      if (proposalId) {
        toast.success("Proposal created successfully!");
        setNewProposalTitle("");
        setNewProposalDesc("");
        setNewProposalOptions(["Yes", "No"]);
        setProposalDuration(7);
        onProposalCreated();
      }
    } catch (error) {
      console.error("Error creating proposal:", error);
      toast.error("Failed to create proposal");
    } finally {
      setIsCreatingProposal(false);
    }
  };
  
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Input
          placeholder="Proposal Title"
          value={newProposalTitle}
          onChange={(e) => setNewProposalTitle(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Textarea
          placeholder="Description"
          value={newProposalDesc}
          onChange={(e) => setNewProposalDesc(e.target.value)}
          rows={4}
        />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium">Voting Period</p>
        <div className="flex items-center gap-2">
          <input 
            type="range" 
            min="1" 
            max="30" 
            value={proposalDuration} 
            onChange={(e) => setProposalDuration(parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="min-w-[100px] text-sm flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {proposalDuration} {proposalDuration === 1 ? 'day' : 'days'}
          </span>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium">Options</p>
        {newProposalOptions.map((option, index) => (
          <div key={index} className="flex gap-2">
            <Input
              placeholder={`Option ${index + 1}`}
              value={option}
              onChange={(e) => {
                const updated = [...newProposalOptions];
                updated[index] = e.target.value;
                setNewProposalOptions(updated);
              }}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                if (newProposalOptions.length > 2) {
                  setNewProposalOptions(
                    newProposalOptions.filter((_, i) => i !== index)
                  );
                }
              }}
              disabled={newProposalOptions.length <= 2}
            >
              &times;
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          onClick={() => setNewProposalOptions([...newProposalOptions, ""])}
        >
          Add Option
        </Button>
      </div>
      <Button 
        onClick={handleCreateProposal}
        disabled={isCreatingProposal || !newProposalTitle.trim()}
        className="w-full"
      >
        {isCreatingProposal ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Plus className="h-4 w-4 mr-2" />
        )}
        Create Proposal
      </Button>
    </div>
  );
};

export default CreateProposalForm;
