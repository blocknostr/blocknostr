import { useEffect } from "react";
import { toast } from "sonner";
import { nostrService } from "@/lib/nostr";
import { DAOProposal } from "@/types/dao";

interface DAOSubscriptionProps {
  daoId: string;
  onNewProposal: (proposal: DAOProposal) => void;
  onNewVote: (vote: any) => void;
  onDAOUpdate: (dao: any) => void;
}

export function useDAOSubscription({
  daoId,
  onNewProposal,
  onNewVote,
  onDAOUpdate
}: DAOSubscriptionProps) {
  // Subscribe to DAO events
  useEffect(() => {
    if (!daoId) return;

    console.log(`Subscribing to DAO events for DAO ${daoId}`);

    // Define filters for proposals, votes, and DAO updates
    const filters = [
      {
        kinds: [30000], // Assuming 30000 is the kind for DAO proposals
        '#d': [daoId] // Assuming 'd' tag contains the DAO ID
      },
      {
        kinds: [3], // Assuming kind 3 is for votes (adjust as needed)
        '#dao': [daoId] // Assuming 'dao' tag contains the DAO ID
      },
      {
        kinds: [30001], // Assuming 30001 is the kind for DAO metadata updates
        ids: [daoId] // Subscribe directly to the DAO ID for updates
      }
    ];

    // Subscribe to events
    const sub = nostrService.subscribe(filters, (event: any) => {
      // Process new proposals
      if (event.kind === 30000) {
        try {
          // Parse the content of the event to get proposal details
          const content = JSON.parse(event.content);
          const duration = content.duration || 24 * 60 * 60; // Default 24 hours

          // Create a DAOProposal object
          const proposal: DAOProposal = {
            id: event.id,
            daoId: daoId,
            creator: event.pubkey,
            createdAt: event.created_at,
            title: content.title,
            description: content.description,
            options: content.options,
            votes: {},
            status: 'active', // Default status
            endTime: event.created_at + duration,
            endsAt: event.created_at + duration
          };

          onNewProposal(proposal);
        } catch (error) {
          console.error("Error processing new proposal:", error);
          toast.error("Failed to process new proposal");
        }
      }
      // Process new votes
      else if (event.kind === 3) {
        try {
          // Extract relevant information from the vote event
          const proposalId = event.tags.find((tag: string[]) => tag[0] === 'e')?.[1];
          const voteValue = event.content; // Assuming the content is the vote value

          if (proposalId) {
            // Notify about the new vote
            onNewVote({
              proposalId: proposalId,
              voter: event.pubkey,
              vote: voteValue,
              timestamp: event.created_at
            });
          }
        } catch (error) {
          console.error("Error processing new vote:", error);
          toast.error("Failed to process new vote");
        }
      }
      // Process DAO metadata updates
      else if (event.kind === 30001) {
        try {
          // Parse the content of the event to get DAO details
          const dao = JSON.parse(event.content);

          // Notify about the DAO update
          onDAOUpdate({
            id: event.id,
            daoId: daoId,
            ...dao
          });
        } catch (error) {
          console.error("Error processing DAO update:", error);
          toast.error("Failed to process DAO update");
        }
      }
    });

    // Clean up subscription on unmount
    return () => {
      console.log(`Unsubscribing from DAO events for DAO ${daoId}`);
      sub();
    };
  }, [daoId, onNewProposal, onNewVote, onDAOUpdate]);

  return { isConnected: !!nostrService.pool };
}
