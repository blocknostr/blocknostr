
import { useState, useEffect, useCallback } from "react";
import { nostrService } from "@/lib/nostr";
import { DAO, DAOProposal } from "@/types/dao";
import { daoService } from "@/lib/dao/dao-service";

type DAOEvent = {
  type: "proposal" | "vote" | "update";
  data: any;
};

interface UseDAOSubscriptionProps {
  daoId?: string;
  onNewProposal?: (proposal: DAOProposal) => void;
  onNewVote?: (vote: { proposalId: string; voter: string; option: number }) => void;
  onDAOUpdate?: (dao: DAO) => void;
}

export function useDAOSubscription({
  daoId,
  onNewProposal,
  onNewVote,
  onDAOUpdate
}: UseDAOSubscriptionProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [events, setEvents] = useState<DAOEvent[]>([]);

  // Set up subscription
  const setupSubscription = useCallback(() => {
    if (!daoId) return;

    // Create filters for DAO-related events
    const filters = [
      // DAO Community definition updates
      { kinds: [34550], "#d": [daoId] },
      
      // DAO proposals
      { kinds: [34551], "#e": [daoId] },
      
      // Votes on proposals
      { kinds: [34552], "#e": [daoId] }
    ];

    // Set up subscription
    try {
      const sub = nostrService.subscribe(
        filters,
        (event) => {
          handleIncomingEvent(event);
        }
      );
      
      if (sub) {
        setSubscriptionId(sub);
        setIsConnected(true);
        console.log("DAO subscription established with ID:", sub);
      }
    } catch (error) {
      console.error("Error setting up DAO subscription:", error);
      setIsConnected(false);
    }
  }, [daoId]);

  // Handle incoming events from subscription
  const handleIncomingEvent = useCallback((event: any) => {
    if (!event) return;

    try {
      // Process event based on kind
      switch (event.kind) {
        case 34550: // DAO definition/update
          // Process DAO update
          if (onDAOUpdate) {
            daoService.getDAOById(daoId!).then(dao => {
              if (dao) onDAOUpdate(dao);
            });
          }
          setEvents(prev => [...prev, { type: "update", data: event }]);
          break;
          
        case 34551: // Proposal
          // Process new proposal
          try {
            const proposalData = JSON.parse(event.content);
            const proposal: DAOProposal = {
              id: event.id,
              daoId: daoId!,
              title: proposalData.title || "Unnamed Proposal",
              description: proposalData.description || "",
              options: proposalData.options || ["Yes", "No"],
              createdAt: event.created_at,
              endsAt: proposalData.endsAt || (event.created_at + 7 * 24 * 60 * 60),
              creator: event.pubkey,
              votes: {},
              status: "active"
            };
            
            if (onNewProposal) onNewProposal(proposal);
            setEvents(prev => [...prev, { type: "proposal", data: proposal }]);
          } catch (e) {
            console.error("Error processing proposal event:", e);
          }
          break;
          
        case 34552: // Vote
          // Process vote
          try {
            const proposalId = event.tags.find((t: string[]) => t[0] === 'e')?.[1];
            if (!proposalId) return;
            
            let option = 0; // Default to option 0
            try {
              if (event.content.startsWith('{')) {
                const content = JSON.parse(event.content);
                option = content.optionIndex;
              } else {
                option = parseInt(event.content.trim());
              }
            } catch (e) {
              console.error("Error parsing vote content:", e);
            }
            
            const vote = {
              proposalId,
              voter: event.pubkey,
              option: isNaN(option) ? 0 : option
            };
            
            if (onNewVote) onNewVote(vote);
            setEvents(prev => [...prev, { type: "vote", data: vote }]);
          } catch (e) {
            console.error("Error processing vote event:", e);
          }
          break;
      }
    } catch (error) {
      console.error("Error handling DAO event:", error);
    }
  }, [daoId, onDAOUpdate, onNewProposal, onNewVote]);

  // Set up subscription on mount
  useEffect(() => {
    if (daoId) {
      setupSubscription();
    }
    
    return () => {
      // Clean up subscription on unmount
      if (subscriptionId) {
        try {
          console.log("Cleaning up DAO subscription:", subscriptionId);
          nostrService.unsubscribe(subscriptionId);
        } catch (error) {
          console.error("Error cleaning up DAO subscription:", error);
        }
        setSubscriptionId(null);
      }
    };
  }, [daoId, setupSubscription]);

  return {
    isConnected,
    events
  };
}
