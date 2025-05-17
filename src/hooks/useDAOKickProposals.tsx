
import { useState, useEffect } from "react";
import { daoService } from "@/lib/dao/dao-service";
import { DAO, DAOProposal } from "@/types/dao";
import { nostrService } from "@/lib/nostr";
import { toast } from "sonner";

interface KickProposal extends DAOProposal {
  targetPubkey: string;
}

export function useDAOKickProposals(daoId?: string) {
  const [kickProposals, setKickProposals] = useState<KickProposal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const currentUserPubkey = nostrService.publicKey;
  
  // Fetch kick proposals
  useEffect(() => {
    if (!daoId) return;
    
    const fetchKickProposals = async () => {
      setLoading(true);
      try {
        const proposals = await daoService.getDAOProposals(daoId);
        
        // Filter for kick proposals
        const kickProps = proposals
          .filter(proposal => {
            try {
              const content = JSON.parse(proposal.description);
              return content.type === "kick" && content.targetPubkey;
            } catch (e) {
              return false;
            }
          })
          .map(proposal => {
            try {
              const content = JSON.parse(proposal.description);
              return {
                ...proposal,
                targetPubkey: content.targetPubkey
              } as KickProposal;
            } catch (e) {
              return null;
            }
          })
          .filter((p): p is KickProposal => p !== null);
        
        setKickProposals(kickProps);
      } catch (error) {
        console.error("Error fetching kick proposals:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchKickProposals();
  }, [daoId]);
  
  // Create kick proposal
  const createKickProposal = async (daoId: string, memberToKick: string, reason: string) => {
    if (!currentUserPubkey) {
      toast.error("You must be logged in to create kick proposals");
      return false;
    }
    
    try {
      const title = `Remove member ${memberToKick.substring(0, 8)}...`;
      const description = JSON.stringify({
        type: "kick",
        reason: reason,
        targetPubkey: memberToKick
      });
      
      const options = ["Yes, remove member", "No, keep member"];
      
      // Fix: Use only three parameters as expected
      const proposalId = await daoService.createKickProposal(
        daoId,
        title,
        description
      );
      
      if (proposalId) {
        toast.success("Kick proposal created successfully");
        return true;
      } else {
        toast.error("Failed to create kick proposal");
        return false;
      }
    } catch (error) {
      console.error("Error creating kick proposal:", error);
      toast.error("Failed to create kick proposal");
      return false;
    }
  };
  
  // Vote on kick proposal
  const voteOnKickProposal = async (proposalId: string, optionIndex: number) => {
    if (!currentUserPubkey) {
      toast.error("You must be logged in to vote");
      return false;
    }
    
    try {
      const success = await daoService.voteOnProposal(proposalId, optionIndex);
      
      if (success) {
        toast.success("Vote recorded successfully");
        return true;
      } else {
        toast.error("Failed to record vote");
        return false;
      }
    } catch (error) {
      console.error("Error voting on kick proposal:", error);
      toast.error("Failed to record vote");
      return false;
    }
  };
  
  return {
    kickProposals,
    loading,
    createKickProposal,
    voteOnKickProposal
  };
}
