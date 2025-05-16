
import { useEffect, useState } from 'react';
import { SimplePool, Filter } from 'nostr-tools';
import { toast } from 'sonner';
import { DAO, DAOProposal } from '@/types/dao';

// NIP-72 event kinds
const DAO_KINDS = {
  COMMUNITY: 34550,       // Community definition
  PROPOSAL: 34551,        // Community proposal
  VOTE: 34552,           // Vote on a proposal
};

interface UseDAOSubscriptionProps {
  daoId?: string;
  onNewProposal?: (proposal: DAOProposal) => void;
  onNewVote?: (vote: any) => void;
  onDAOUpdate?: (dao: DAO) => void;
}

export function useDAOSubscription({
  daoId,
  onNewProposal,
  onNewVote,
  onDAOUpdate
}: UseDAOSubscriptionProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  
  // Define relays - use the most reliable NIP-72 compatible ones
  const relays = [
    "wss://relay.damus.io",
    "wss://nos.lol",
    "wss://relay.nostr.band",
    "wss://relay.snort.social"
  ];
  
  useEffect(() => {
    // Skip if no daoId is provided
    if (!daoId) return;
    
    console.log(`Setting up subscriptions for DAO ${daoId}...`);
    const pool = new SimplePool();
    const activeSubscriptions: any[] = [];
    
    try {
      // Subscribe to DAO updates
      const daoFilter: Filter = {
        kinds: [DAO_KINDS.COMMUNITY],
        ids: [daoId]
      };
      
      // Use subscribe instead of sub since 'sub' doesn't exist on SimplePool
      const daoSub = pool.subscribe(relays, [daoFilter]);
      
      daoSub.on('event', (event) => {
        console.log('Received DAO update event:', event);
        if (onDAOUpdate) {
          try {
            let content = {};
            try {
              content = JSON.parse(event.content);
            } catch (error) {
              console.error('Error parsing DAO content:', error);
              content = {};
            }
            
            const members = event.tags
              .filter(tag => tag.length >= 2 && tag[0] === 'p')
              .map(tag => tag[1]);
              
            const dao: DAO = {
              id: event.id,
              name: content.name || "Unnamed DAO",
              description: content.description || "",
              image: content.image || "",
              creator: event.pubkey,
              createdAt: event.created_at,
              members,
              moderators: [],
              treasury: content.treasury || { balance: 0, tokenSymbol: "ALPH" },
              tags: content.tags || [],
              // Add missing properties required by the DAO type
              proposals: content.proposals || 0,
              activeProposals: content.activeProposals || 0
            };
            
            onDAOUpdate(dao);
          } catch (error) {
            console.error('Error processing DAO update:', error);
          }
        }
      });
      
      activeSubscriptions.push(daoSub);
      
      // Subscribe to new proposals
      const proposalFilter: Filter = {
        kinds: [DAO_KINDS.PROPOSAL],
        '#e': [daoId],
        since: Math.floor(Date.now() / 1000) // Only get new proposals from now
      };
      
      // Use subscribe instead of sub
      const proposalSub = pool.subscribe(relays, [proposalFilter]);
      
      proposalSub.on('event', (event) => {
        console.log('Received new proposal event:', event);
        if (onNewProposal) {
          try {
            const content = JSON.parse(event.content);
            const proposal: DAOProposal = {
              id: event.id,
              daoId,
              title: content.title || "Unnamed Proposal",
              description: content.description || "",
              options: content.options || ["Yes", "No"],
              createdAt: event.created_at,
              endsAt: content.endsAt || (event.created_at + 7 * 24 * 60 * 60),
              creator: event.pubkey,
              votes: {},
              status: "active"
            };
            
            onNewProposal(proposal);
            toast.info(`New proposal: ${proposal.title}`);
          } catch (error) {
            console.error('Error processing new proposal:', error);
          }
        }
      });
      
      activeSubscriptions.push(proposalSub);
      
      // Subscribe to votes if we have onNewVote handler
      if (onNewVote) {
        const voteFilter: Filter = {
          kinds: [DAO_KINDS.VOTE],
          '#e': [daoId],
          since: Math.floor(Date.now() / 1000) // Only get new votes from now
        };
        
        // Use subscribe instead of sub
        const voteSub = pool.subscribe(relays, [voteFilter]);
        
        voteSub.on('event', (event) => {
          console.log('Received vote event:', event);
          try {
            // Find the proposal reference
            const proposalTag = event.tags.find(tag => tag[0] === 'e' && tag[1] !== daoId);
            if (proposalTag) {
              const proposalId = proposalTag[1];
              let optionIndex: number;
              
              // Parse vote content (both JSON and non-JSON formats)
              try {
                const content = JSON.parse(event.content);
                optionIndex = content.optionIndex;
              } catch (e) {
                optionIndex = parseInt(event.content.trim());
              }
              
              if (!isNaN(optionIndex)) {
                onNewVote({
                  proposalId,
                  pubkey: event.pubkey,
                  optionIndex
                });
              }
            }
          } catch (error) {
            console.error('Error processing vote event:', error);
          }
        });
        
        activeSubscriptions.push(voteSub);
      }
      
      setSubscriptions(activeSubscriptions);
      setIsConnected(true);
      
      console.log(`Started ${activeSubscriptions.length} subscriptions for DAO ${daoId}`);
    } catch (error) {
      console.error('Error setting up DAO subscriptions:', error);
      setIsConnected(false);
    }
    
    // Cleanup function
    return () => {
      console.log('Cleaning up DAO subscriptions...');
      activeSubscriptions.forEach(sub => sub.unsub());
      setSubscriptions([]);
      pool.close(relays);
    };
  }, [daoId, onNewProposal, onNewVote, onDAOUpdate]);
  
  return {
    isConnected,
    subscriptionsCount: subscriptions.length
  };
}
