
import React, { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DAO } from "@/types/dao";
import { UserX } from "lucide-react";
import { toast } from "sonner";

interface DAOKickProposalDialogProps {
  dao: DAO;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateKickProposal: (memberToKick: string, reason: string) => Promise<boolean>;
}

const DAOKickProposalDialog: React.FC<DAOKickProposalDialogProps> = ({
  dao,
  isOpen,
  onOpenChange,
  onCreateKickProposal
}) => {
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Filter out creator from kick candidates
  const kickCandidates = dao.members.filter(member => member !== dao.creator);
  
  const handleSubmit = async () => {
    if (!selectedMember) {
      toast.error("Please select a member to kick");
      return;
    }
    
    if (!reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const success = await onCreateKickProposal(selectedMember, reason);
      
      if (success) {
        toast.success("Kick proposal created");
        onOpenChange(false);
        setSelectedMember("");
        setReason("");
      } else {
        toast.error("Failed to create kick proposal");
      }
    } catch (error) {
      console.error("Error creating kick proposal:", error);
      toast.error("Failed to create kick proposal");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UserX className="h-5 w-5 mr-2 text-destructive" />
            Propose Member Removal
          </DialogTitle>
          <DialogDescription>
            Create a proposal to remove a member from the DAO.
            The member will be removed if 51% of members vote to approve.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="member-select">Select Member</Label>
            <Select
              value={selectedMember}
              onValueChange={setSelectedMember}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a member" />
              </SelectTrigger>
              <SelectContent>
                {kickCandidates.length === 0 ? (
                  <SelectItem value="none" disabled>No members to remove</SelectItem>
                ) : (
                  kickCandidates.map((member) => (
                    <SelectItem key={member} value={member}>
                      {member.substring(0, 10)}...
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for removal</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this member should be removed..."
              rows={4}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !selectedMember || !reason.trim()}
            variant="destructive"
          >
            {isSubmitting ? "Creating..." : "Create Kick Proposal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DAOKickProposalDialog;
