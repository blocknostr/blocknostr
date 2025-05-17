import { SimplePool, Event, getEventHash, verifyEvent } from 'nostr-tools';
import { nostrService } from '../nostr';
import { daoCache } from './dao-cache';
import { DAO, DAOProposal } from '@/types/dao';
import { generateRandomId, settlePromises } from './dao-utils';

// DAO kinds for Nostr events
const DAO_KIND = 30001;
const DAO_PROPOSAL_KIND = 30002;
const DAO_JOIN_KIND = 30003;
const DAO_LEAVE_KIND = 30004;
const DAO_VOTE_KIND = 30005;
const DAO_METADATA_KIND = 30006;
const DAO_KICK_PROPOSAL_KIND = 30007;
const DAO_KICK_VOTE_KIND = 30008;
const DAO_INVITE_KIND = 30009;
const DAO_MEMBER_REMOVE_KIND = 30010;

type Filter = Record<string, any>;

/**
 * Service for interacting with DAOs on the Nostr network
 */
class DAOService {
  private pool: SimplePool;
  
  constructor() {
    this.pool = new SimplePool();
  }
  
  /**
   * Get all public DAOs
   * @returns A promise that resolves to an array of DAOs
   */
  async getDAOs(): Promise<DAO[]> {
    try {
      // First, try to get DAOs from cache
      const cachedDaos = await daoCache.getAllDAOs();
      if (cachedDaos.length > 0) {
        return cachedDaos;
      }
      
      // If none in cache or cache expired, fetch from network
      const relays = nostrService.getRelayUrls();
      console.log("Fetching DAOs from relays:", relays);
      
      if (relays.length === 0) {
        console.warn("No relays available to fetch DAOs");
        return [];
      }
      
      // Create a filter to fetch DAO events
      const filter: Filter = { kinds: [DAO_KIND] };
      
      try {
        const events = await this.pool.querySync(relays, [filter]) as Event[];
        
        console.log(`Fetched ${events.length} DAO events`);
        
        // Process events into DAO objects
        const daos = await this.processDAOEvents(events);
        
        // Cache the results
        await daoCache.cacheDAOs(daos);
        
        return daos;
      } catch (error) {
        console.error("Error fetching DAOs:", error);
        return [];
      }
    } catch (error) {
      console.error("Error in getDAOs:", error);
      return [];
    }
  }
  
  /**
   * Get trending DAOs (most active in last 7 days)
   * @returns A promise that resolves to an array of trending DAOs
   */
  async getTrendingDAOs(): Promise<DAO[]> {
    try {
      // First, try to get trending DAOs from cache
      const cachedTrending = await daoCache.getTrendingDAOs();
      if (cachedTrending.length > 0) {
        return cachedTrending;
      }
      
      // If none in cache or cache expired, fetch and calculate from network
      const relays = nostrService.getRelayUrls();
      
      if (relays.length === 0) {
        console.warn("No relays available to fetch trending DAOs");
        return [];
      }
      
      // Create a filter to fetch recent DAO and proposal events
      const daoFilter: Filter = { kinds: [DAO_KIND] };
      const proposalFilter: Filter = { kinds: [DAO_PROPOSAL_KIND], since: Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60 }; // Last 7 days
      
      try {
        const daoEvents = await this.pool.querySync(relays, [daoFilter]) as Event[];
        const proposalEvents = await this.pool.querySync(relays, [proposalFilter]) as Event[];
        
        // Get vote events
        const voteFilter: Filter = { kinds: [DAO_VOTE_KIND], since: Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60 };
        const voteEvents = await this.pool.querySync(relays, [voteFilter]) as Event[];
        
        // Count activity for each DAO
        const activityCounts = new Map<string, number>();
        
        // Count proposals
        for (const event of proposalEvents) {
          try {
            const daoId = event.tags.find(tag => tag[0] === "d")?.[1];
            if (daoId) {
              activityCounts.set(daoId, (activityCounts.get(daoId) || 0) + 3); // Proposals count more
            }
          } catch (e) {
            continue;
          }
        }
        
        // Count votes
        for (const event of voteEvents) {
          try {
            const daoId = event.tags.find(tag => tag[0] === "d")?.[1];
            if (daoId) {
              activityCounts.set(daoId, (activityCounts.get(daoId) || 0) + 1);
            }
          } catch (e) {
            continue;
          }
        }
        
        // Process DAO events
        const allDaos = await this.processDAOEvents(daoEvents);
        
        // Sort by activity count
        const trendingDaos = allDaos
          .filter(dao => activityCounts.has(dao.id))
          .sort((a, b) => {
            const countA = activityCounts.get(a.id) || 0;
            const countB = activityCounts.get(b.id) || 0;
            return countB - countA;
          })
          .slice(0, 5); // Top 5
        
        // Cache results
        await daoCache.cacheTrendingDAOs(trendingDaos);
        
        return trendingDaos;
      } catch (error) {
        console.error("Error fetching trending DAOs:", error);
        return [];
      }
    } catch (error) {
      console.error("Error in getTrendingDAOs:", error);
      return [];
    }
  }
  
  /**
   * Get DAOs for a specific user
   * @param userId The Nostr pubkey of the user
   * @returns A promise that resolves to an array of DAOs the user is a member of
   */
  async getUserDAOs(userId: string): Promise<DAO[]> {
    try {
      // First, try to get user's DAOs from cache
      const cachedUserDaos = await daoCache.getUserDAOs(userId);
      if (cachedUserDaos.length > 0) {
        return cachedUserDaos;
      }
      
      // If none in cache or cache expired, fetch from network
      const relays = nostrService.getRelayUrls();
      
      if (relays.length === 0) {
        console.warn("No relays available to fetch user DAOs");
        return [];
      }
      
      // Get join events for this user
      const joinFilter: Filter = { 
        kinds: [DAO_JOIN_KIND],
        authors: [userId]
      };
      
      // Also get DAO events where user is creator
      const creatorFilter: Filter = {
        kinds: [DAO_KIND],
        authors: [userId]
      };
      
      try {
        // Fetch join events and creator events
        const joinEvents = await this.pool.querySync(relays, [joinFilter]) as Event[];
        const creatorEvents = await this.pool.querySync(relays, [creatorFilter]) as Event[];
        
        // Extract DAO IDs from join events
        const daoIds = new Set<string>();
        
        for (const event of joinEvents) {
          try {
            const daoId = event.tags.find(tag => tag[0] === "d")?.[1];
            if (daoId) {
              daoIds.add(daoId);
            }
          } catch (e) {
            continue;
          }
        }
        
        // Get DAO events for the joined DAOs
        const daoEvents: Event[] = [];
        
        if (daoIds.size > 0) {
          const daoFilter: Filter = {
            kinds: [DAO_KIND],
            "#d": Array.from(daoIds)
          };
          
          const fetchedEvents = await this.pool.querySync(relays, [daoFilter]) as Event[];
          daoEvents.push(...fetchedEvents);
        }
        
        // Add creator events
        daoEvents.push(...creatorEvents);
        
        // Process events into DAO objects
        const daos = await this.processDAOEvents(daoEvents);
        
        // Cache the results
        await daoCache.cacheUserDAOs(userId, daos);
        
        return daos;
      } catch (error) {
        console.error("Error fetching user DAOs:", error);
        return [];
      }
    } catch (error) {
      console.error("Error in getUserDAOs:", error);
      return [];
    }
  }
  
  /**
   * Get a DAO by ID
   * @param daoId The ID of the DAO to fetch
   * @returns A promise that resolves to the DAO object or null if not found
   */
  async getDAOById(daoId: string): Promise<DAO | null> {
    try {
      // First, try to get DAO from cache
      const cachedDao = await daoCache.getDAOById(daoId);
      if (cachedDao) {
        return cachedDao;
      }
      
      // If not in cache or cache expired, fetch from network
      const relays = nostrService.getRelayUrls();
      
      if (relays.length === 0) {
        console.warn("No relays available to fetch DAO");
        return null;
      }
      
      // Create a filter to fetch the specific DAO
      const filter: Filter = {
        kinds: [DAO_KIND],
        "#d": [daoId]
      };
      
      // Also get membership info
      const membersJoinFilter: Filter = {
        kinds: [DAO_JOIN_KIND],
        "#d": [daoId]
      };
      
      const membersLeaveFilter: Filter = {
        kinds: [DAO_LEAVE_KIND],
        "#d": [daoId]
      };
      
      const membersRemoveFilter: Filter = {
        kinds: [DAO_MEMBER_REMOVE_KIND],
        "#d": [daoId]
      };
      
      try {
        const events = await this.pool.querySync(relays, [filter]) as Event[];
        
        if (events.length === 0) {
          console.warn(`DAO ${daoId} not found`);
          return null;
        }
        
        // Get join and leave events to calculate current members
        const joinEvents = await this.pool.querySync(relays, [membersJoinFilter]) as Event[];
        const leaveEvents = await this.pool.querySync(relays, [membersLeaveFilter]) as Event[];
        const removeEvents = await this.pool.querySync(relays, [membersRemoveFilter]) as Event[];
        
        // Process events into a DAO object
        const daos = await this.processDAOEvents(events, joinEvents, leaveEvents, removeEvents);
        
        if (daos.length === 0) {
          return null;
        }
        
        const dao = daos[0];
        
        // Fetch and process metadata
        const metadataFilter: Filter = {
          kinds: [DAO_METADATA_KIND],
          "#d": [daoId]
        };
        
        const metadataEvents = await this.pool.querySync(relays, [metadataFilter]) as Event[];
        
        // Process metadata
        if (metadataEvents.length > 0) {
          // Find the latest metadata event
          const latestMetadata = metadataEvents.sort((a, b) => b.created_at - a.created_at)[0];
          
          try {
            const metadata = JSON.parse(latestMetadata.content);
            
            if (metadata.guidelines) {
              dao.guidelines = metadata.guidelines;
            }
            
            if (metadata.isPrivate !== undefined) {
              dao.isPrivate = metadata.isPrivate;
            }
            
            if (metadata.tags) {
              dao.tags = metadata.tags;
            }
            
            if (metadata.moderators) {
              dao.moderators = metadata.moderators;
            }
          } catch (e) {
            console.error("Error parsing DAO metadata:", e);
          }
        }
        
        // Cache the DAO
        await daoCache.cacheDAO(dao);
        
        return dao;
      } catch (error) {
        console.error(`Error fetching DAO ${daoId}:`, error);
        return null;
      }
    } catch (error) {
      console.error(`Error in getDAOById for ${daoId}:`, error);
      return null;
    }
  }
  
  /**
   * Subscribe to updates for all DAOs
   * @param callback Function to call when a new DAO is received
   * @returns Unsubscribe function
   */
  subscribeToDAOs(callback: (dao: DAO) => void): () => void {
    const relays = nostrService.getRelayUrls();
    
    if (relays.length === 0) {
      console.warn("No relays available for DAO subscription");
      return () => {};
    }
    
    // Create a filter for DAO events
    const filter: Filter[] = [{ kinds: [DAO_KIND] }];
    
    // Set up the subscription
    const sub = this.pool.subscribeToEvents(
      filter, 
      relays, 
      {
        onevent: async (event) => {
          try {
            // Process the DAO event
            const daos = await this.processDAOEvents([event]);
            if (daos.length > 0) {
              await daoCache.cacheDAO(daos[0]);
              callback(daos[0]);
            }
          } catch (e) {
            console.error("Error processing DAO event:", e);
          }
        },
        onclose: () => {
          console.log("DAO subscription closed");
        }
      }
    );
    
    // Return unsubscribe function
    return () => {
      if (sub) {
        this.pool.unsubscribe(sub.sub);
      }
    };
  }
  
  /**
   * Subscribe to updates for a specific user's DAOs
   * @param userId The user's public key
   * @param callback Function to call when a new DAO is received
   * @returns Unsubscribe function
   */
  subscribeToUserDAOs(userId: string, callback: (dao: DAO) => void): () => void {
    const relays = nostrService.getRelayUrls();
    
    if (relays.length === 0) {
      console.warn("No relays available for user DAO subscription");
      return () => {};
    }
    
    // Create filters for both created DAOs and joined DAOs
    const filters: Filter[] = [
      { 
        kinds: [DAO_KIND],
        authors: [userId]
      },
      {
        kinds: [DAO_JOIN_KIND],
        "#u": [userId],
        "#action": ["join"]
      }
    ];
    
    // Set up the subscription
    const sub = this.pool.subscribeToEvents(
      filters,
      relays,
      {
        onevent: async (event) => {
          try {
            if (event.kind === DAO_KIND) {
              // Direct DAO creation
              const daos = await this.processDAOEvents([event]);
              if (daos.length > 0) {
                await daoCache.cacheDAO(daos[0]);
                await daoCache.addUserDAO(userId, daos[0].id);
                callback(daos[0]);
              }
            } else if (event.kind === DAO_JOIN_KIND) {
              // User joined a DAO, fetch the DAO
              const daoId = event.tags.find(tag => tag[0] === "d")?.[1];
              if (daoId) {
                const dao = await this.getDAOById(daoId);
                if (dao) {
                  await daoCache.addUserDAO(userId, dao.id);
                  callback(dao);
                }
              }
            }
          } catch (e) {
            console.error("Error processing user DAO event:", e);
          }
        },
        onclose: () => {
          console.log("User DAO subscription closed");
        }
      }
    );
    
    // Return unsubscribe function
    return () => {
      if (sub) {
        this.pool.unsubscribe(sub.sub);
      }
    };
  }
  
  /**
   * Subscribe to updates for a specific DAO
   * @param daoId The ID of the DAO to subscribe to
   * @param callback Function to call when the DAO is updated
   * @returns Unsubscribe function
   */
  subscribeToDAO(daoId: string, callback: (dao: DAO | null) => void): () => void {
    const relays = nostrService.getRelayUrls();
    
    if (relays.length === 0) {
      console.warn("No relays available for DAO subscription");
      return () => {};
    }
    
    // Create a filter for the specific DAO
    const filter: Filter[] = [
      {
        kinds: [DAO_KIND],
        "#d": [daoId]
      }
    ];
    
    // Also subscribe to membership changes
    const membershipFilter: Filter[] = [
      {
        kinds: [DAO_JOIN_KIND, DAO_LEAVE_KIND, DAO_MEMBER_REMOVE_KIND],
        "#d": [daoId]
      }
    ];
    
    // And metadata updates
    const metadataFilter: Filter[] = [
      {
        kinds: [DAO_METADATA_KIND],
        "#d": [daoId]
      }
    ];
    
    // Set up the subscriptions
    const daoSub = this.pool.subscribeToEvents(
      filter,
      relays,
      {
        onevent: async (event) => {
          try {
            // Refresh the full DAO to get updated member list
            const dao = await this.getDAOById(daoId);
            if (dao) {
              callback(dao);
            }
          } catch (e) {
            console.error("Error processing DAO update event:", e);
          }
        },
        onclose: () => {
          console.log("DAO subscription closed");
        }
      }
    );
    
    const membershipSub = this.pool.subscribeToEvents(
      membershipFilter,
      relays,
      {
        onevent: async () => {
          try {
            // Invalidate cache and fetch fresh data
            await daoCache.invalidateDAODetails(daoId);
            const dao = await this.getDAOById(daoId);
            callback(dao);
          } catch (e) {
            console.error("Error processing DAO membership event:", e);
          }
        },
        onclose: () => {
          console.log("DAO membership subscription closed");
        }
      }
    );
    
    const metadataSub = this.pool.subscribeToEvents(
      metadataFilter,
      relays,
      {
        onevent: async () => {
          try {
            // Invalidate cache and fetch fresh data
            await daoCache.invalidateDAODetails(daoId);
            const dao = await this.getDAOById(daoId);
            callback(dao);
          } catch (e) {
            console.error("Error processing DAO metadata event:", e);
          }
        },
        onclose: () => {
          console.log("DAO metadata subscription closed");
        }
      }
    );
    
    // Return combined unsubscribe function
    return () => {
      if (daoSub) this.pool.unsubscribe(daoSub.sub);
      if (membershipSub) this.pool.unsubscribe(membershipSub.sub);
      if (metadataSub) this.pool.unsubscribe(metadataSub.sub);
    };
  }
  
  /**
   * Get proposals for a DAO
   * @param daoId The ID of the DAO
   * @returns A promise that resolves to an array of proposals
   */
  async getDAOProposals(daoId: string): Promise<DAOProposal[]> {
    try {
      const relays = nostrService.getRelayUrls();
      
      if (relays.length === 0) {
        console.warn("No relays available to fetch DAO proposals");
        return [];
      }
      
      // Create a filter for proposals for this DAO
      const filter: Filter = {
        kinds: [DAO_PROPOSAL_KIND],
        "#d": [daoId]
      };
      
      // Also get votes
      const votesFilter: Filter = {
        kinds: [DAO_VOTE_KIND],
        "#d": [daoId]
      };
      
      try {
        const proposalEvents = await this.pool.querySync(relays, [filter]) as Event[];
        const voteEvents = await this.pool.querySync(relays, [votesFilter]) as Event[];
        
        // Group votes by proposal
        const votesByProposal = new Map<string, Event[]>();
        
        for (const event of voteEvents) {
          try {
            const proposalId = event.tags.find(tag => tag[0] === "e")?.[1];
            if (proposalId) {
              if (!votesByProposal.has(proposalId)) {
                votesByProposal.set(proposalId, []);
              }
              votesByProposal.get(proposalId)?.push(event);
            }
          } catch (e) {
            continue;
          }
        }
        
        // Process proposals
        const proposals: DAOProposal[] = [];
        
        for (const event of proposalEvents) {
          try {
            // Extract proposal data
            const id = event.id;
            const title = event.tags.find(tag => tag[0] === "title")?.[1] || "Untitled Proposal";
            const description = event.content;
            const createdAt = event.created_at;
            const author = event.pubkey;
            
            // Get options
            const optionTags = event.tags.filter(tag => tag[0] === "option");
            const options = optionTags.map(tag => tag[1]);
            
            // Get duration
            const durationTag = event.tags.find(tag => tag[0] === "duration");
            const duration = durationTag ? parseInt(durationTag[1]) : 7 * 24 * 60 * 60; // Default 7 days
            
            // Calculate closing time
            const closesAt = createdAt + duration;
            
            // Get votes for this proposal
            const votes: Record<string, number> = {};
            const proposalVotes = votesByProposal.get(id) || [];
            
            for (const voteEvent of proposalVotes) {
              try {
                const voter = voteEvent.pubkey;
                const optionIndex = voteEvent.tags.find(tag => tag[0] === "option")?.[1];
                if (optionIndex !== undefined) {
                  votes[voter] = parseInt(optionIndex);
                }
              } catch (e) {
                continue;
              }
            }
            
            proposals.push({
              id,
              daoId,
              title,
              description,
              options,
              votes,
              createdAt,
              author,
              duration,
              closesAt
            });
          } catch (e) {
            console.error("Error processing proposal event:", e);
            continue;
          }
        }
        
        // Sort by creation time, newest first
        return proposals.sort((a, b) => b.createdAt - a.createdAt);
      } catch (error) {
        console.error(`Error fetching proposals for DAO ${daoId}:`, error);
        return [];
      }
    } catch (error) {
      console.error(`Error in getDAOProposals for ${daoId}:`, error);
      return [];
    }
  }
  
  /**
   * Subscribe to proposals for a DAO
   * @param daoId The ID of the DAO
   * @param callback Function to call when a new proposal is received
   * @returns Unsubscribe function
   */
  subscribeToDAOProposals(daoId: string, callback: (proposal: DAOProposal) => void): () => void {
    const relays = nostrService.getRelayUrls();
    
    if (relays.length === 0) {
      console.warn("No relays available for DAO proposals subscription");
      return () => {};
    }
    
    // Create filters for proposals and votes
    const proposalFilter: Filter[] = [
      {
        kinds: [DAO_PROPOSAL_KIND],
        "#d": [daoId]
      }
    ];
    
    const voteFilter: Filter[] = [
      {
        kinds: [DAO_VOTE_KIND],
        "#d": [daoId]
      }
    ];
    
    // Keep track of seen proposals
    const seenProposals = new Map<string, DAOProposal>();
    
    // Set up the subscriptions
    const proposalSub = this.pool.subscribeToEvents(
      proposalFilter,
      relays,
      {
        onevent: async (event) => {
          try {
            // Extract proposal data
            const id = event.id;
            const title = event.tags.find(tag => tag[0] === "title")?.[1] || "Untitled Proposal";
            const description = event.content;
            const createdAt = event.created_at;
            const author = event.pubkey;
            
            // Get options
            const optionTags = event.tags.filter(tag => tag[0] === "option");
            const options = optionTags.map(tag => tag[1]);
            
            // Get duration
            const durationTag = event.tags.find(tag => tag[0] === "duration");
            const duration = durationTag ? parseInt(durationTag[1]) : 7 * 24 * 60 * 60; // Default 7 days
            
            // Calculate closing time
            const closesAt = createdAt + duration;
            
            const proposal: DAOProposal = {
              id,
              daoId,
              title,
              description,
              options,
              votes: {},
              createdAt,
              author,
              duration,
              closesAt
            };
            
            seenProposals.set(id, proposal);
            callback(proposal);
          } catch (e) {
            console.error("Error processing proposal event:", e);
          }
        },
        onclose: () => {
          console.log("DAO proposals subscription closed");
        }
      }
    );
    
    const voteSub = this.pool.subscribeToEvents(
      voteFilter,
      relays,
      {
        onevent: async (event) => {
          try {
            const proposalId = event.tags.find(tag => tag[0] === "e")?.[1];
            if (proposalId && seenProposals.has(proposalId)) {
              const proposal = seenProposals.get(proposalId)!;
              
              const voter = event.pubkey;
              const optionIndex = event.tags.find(tag => tag[0] === "option")?.[1];
              
              if (optionIndex !== undefined) {
                // Update the votes
                proposal.votes[voter] = parseInt(optionIndex);
                
                // Return the updated proposal
                callback({...proposal});
              }
            }
          } catch (e) {
            console.error("Error processing vote event:", e);
          }
        },
        onclose: () => {
          console.log("DAO votes subscription closed");
        }
      }
    );
    
    // Return combined unsubscribe function
    return () => {
      if (proposalSub) this.pool.unsubscribe(proposalSub.sub);
      if (voteSub) this.pool.unsubscribe(voteSub.sub);
    };
  }
  
  /**
   * Create a new DAO
   * @param name Name of the DAO
   * @param description Description of the DAO
   * @param tags Array of tags for the DAO
   * @returns A promise that resolves to the ID of the created DAO or null if creation failed
   */
  async createDAO(name: string, description: string, tags: string[] = []): Promise<string | null> {
    try {
      if (!nostrService.publicKey) {
        console.error("User not authenticated");
        return null;
      }
      
      // Generate a unique ID for the DAO
      const daoId = generateRandomId();
      
      // Prepare the event
      const event: Partial<Event> = {
        kind: DAO_KIND,
        content: description,
        tags: [
          ["d", daoId],
          ["name", name],
          ["creator", nostrService.publicKey]
        ]
      };
      
      // Add tags
      tags.forEach(tag => {
        event.tags!.push(["t", tag]);
      });
      
      // Sign the event
      const signedEvent = nostrService.signEvent(event);
      
      // Publish to relays
      const relays = nostrService.getRelayUrls();
      
      if (relays.length === 0) {
        console.error("No relays available to publish DAO");
        return null;
      }
      
      try {
        // Use settlePromises instead of Promise.any
        await settlePromises(relays.map(relay => this.pool.publish(relay, signedEvent)));
        
        console.log(`Created DAO ${name} with ID ${daoId}`);
        
        // Auto-join the DAO as creator
        await this.joinDAO(daoId);
        
        // Invalidate relevant caches
        await daoCache.invalidateTrendingDAOs();
        await daoCache.invalidateAllDAOs();
        await daoCache.invalidateUserDAOs(nostrService.publicKey);
        
        return daoId;
      } catch (error) {
        console.error("Failed to publish DAO event:", error);
        return null;
      }
    } catch (error) {
      console.error("Error creating DAO:", error);
      return null;
    }
  }
  
  /**
   * Join a DAO
   * @param daoId The ID of the DAO to join
   * @returns A promise that resolves to true if successful
   */
  async joinDAO(daoId: string): Promise<boolean> {
    try {
      if (!nostrService.publicKey) {
        console.error("User not authenticated");
        return false;
      }
      
      // Check if DAO exists
      const dao = await this.getDAOById(daoId);
      if (!dao) {
        console.error(`DAO ${daoId} not found`);
        return false;
      }
      
      // Prepare the event
      const event: Partial<Event> = {
        kind: DAO_JOIN_KIND,
        content: "",
        tags: [
          ["d", daoId],
          ["u", nostrService.publicKey],
          ["action", "join"]
        ]
      };
      
      // Sign the event
      const signedEvent = nostrService.signEvent(event);
      
      // Publish to relays
      const relays = nostrService.getRelayUrls();
      
      if (relays.length === 0) {
        console.error("No relays available to publish DAO join");
        return false;
      }
      
      try {
        // Use settlePromises instead of Promise.any
        await settlePromises(relays.map(relay => this.pool.publish(relay, signedEvent)));
        
        console.log(`Joined DAO ${daoId}`);
        
        // Invalidate cache
        await daoCache.invalidateDAODetails(daoId);
        await daoCache.invalidateUserDAOs(nostrService.publicKey);
        
        return true;
      } catch (error) {
        console.error("Failed to publish DAO join event:", error);
        return false;
      }
    } catch (error) {
      console.error(`Error joining DAO ${daoId}:`, error);
      return false;
    }
  }
  
  /**
   * Leave a DAO
   * @param daoId The ID of the DAO to leave
   * @returns A promise that resolves to true if successful
   */
  async leaveDAO(daoId: string): Promise<boolean> {
    try {
      if (!nostrService.publicKey) {
        console.error("User not authenticated");
        return false;
      }
      
      // Check if DAO exists
      const dao = await this.getDAOById(daoId);
      if (!dao) {
        console.error(`DAO ${daoId} not found`);
        return false;
      }
      
      // Can't leave if you're the creator
      if (dao.creator === nostrService.publicKey) {
        console.error("Creator cannot leave their own DAO");
        throw new Error("Creator cannot leave their own DAO. Use delete DAO instead.");
      }
      
      // Prepare the event
      const event: Partial<Event> = {
        kind: DAO_LEAVE_KIND,
        content: "",
        tags: [
          ["d", daoId],
          ["u", nostrService.publicKey],
          ["action", "leave"]
        ]
      };
      
      // Sign the event
      const signedEvent = nostrService.signEvent(event);
      
      // Publish to relays
      const relays = nostrService.getRelayUrls();
      
      if (relays.length === 0) {
        console.error("No relays available to publish DAO leave");
        return false;
      }
      
      try {
        // Use settlePromises instead of Promise.any
        await settlePromises(relays.map(relay => this.pool.publish(relay, signedEvent)));
        
        console.log(`Left DAO ${daoId}`);
        
        // Invalidate cache
        await daoCache.invalidateDAODetails(daoId);
        await daoCache.invalidateUserDAOs(nostrService.publicKey);
        await daoCache.removeUserDAO(nostrService.publicKey, daoId);
        
        return true;
      } catch (error) {
        console.error("Failed to publish DAO leave event:", error);
        return false;
      }
    } catch (error: any) {
      console.error("Error leaving DAO:", error);
      toast.error(error.message || "Failed to leave DAO");
      return false;
    }
  }
  
  /**
   * Delete a DAO (creator only)
   * @param daoId The ID of the DAO to delete
   * @returns A promise that resolves to true if successful
   */
  async deleteDAO(daoId: string): Promise<boolean> {
    try {
      if (!nostrService.publicKey) {
        console.error("User not authenticated");
        return false;
      }
      
      // Check if DAO exists
      const dao = await this.getDAOById(daoId);
      if (!dao) {
        console.error(`DAO ${daoId} not found`);
        return false;
      }
      
      // Verify that the current user is the creator
      if (dao.creator !== nostrService.publicKey) {
        console.error("Only the creator can delete a DAO");
        return false;
      }
      
      // Prepare the event - we're using the same DAO_KIND with a special tag to mark deletion
      const event: Partial<Event> = {
        kind: DAO_KIND,
        content: "",
        tags: [
          ["d", daoId],
          ["status", "deleted"],
          ["deleted_at", Math.floor(Date.now() / 1000).toString()]
        ]
      };
      
      // Sign the event
      const signedEvent = nostrService.signEvent(event);
      
      // Publish to relays
      const relays = nostrService.getRelayUrls();
      
      if (relays.length === 0) {
        console.error("No relays available to publish DAO deletion");
        return false;
      }
      
      try {
        // Use settlePromises instead of Promise.any
        await settlePromises(relays.map(relay => this.pool.publish(relay, signedEvent)));
        
        console.log(`Deleted DAO ${daoId}`);
        
        // Invalidate cache
        await daoCache.invalidateDAO(daoId);
        await daoCache.invalidateUserDAOs(nostrService.publicKey);
        await daoCache.removeUserDAO(nostrService.publicKey, daoId);
        await daoCache.invalidateTrendingDAOs();
        await daoCache.invalidateAllDAOs();
        
        return true;
      } catch (error) {
        console.error("Failed to publish DAO deletion event:", error);
        return false;
      }
    } catch (error: any) {
      console.error(`Error deleting DAO ${daoId}:`, error);
      return false;
    }
  }
  
  /**
   * Create a new proposal for a DAO
   * @param daoId The ID of the DAO
   * @param title Title of the proposal
   * @param description Description/content of the proposal
   * @param options Array of voting options
   * @param durationDays Duration in days for the proposal to be open
   * @returns A promise that resolves to the ID of the created proposal or null if creation failed
   */
  async createProposal(
    daoId: string, 
    title: string, 
    description: string, 
    options: string[],
    durationDays: number = 7
  ): Promise<string | null> {
    try {
      if (!nostrService.publicKey) {
        console.error("User not authenticated");
        return null;
      }
      
      // Check if DAO exists
      const dao = await this.getDAOById(daoId);
      if (!dao) {
        console.error(`DAO ${daoId} not found`);
        return null;
      }
      
      // Verify user is a member
      if (!dao.members.includes(nostrService.publicKey)) {
        console.error("Only members can create proposals");
        return null;
      }
      
      // Convert days to seconds
      const duration = durationDays * 24 * 60 * 60;
      
      // Prepare the event
      const event: Partial<Event> = {
        kind: DAO_PROPOSAL_KIND,
        content: description,
        tags: [
          ["d", daoId],
          ["title", title],
          ["duration", duration.toString()]
        ]
      };
      
      // Add options
      options.forEach((option, index) => {
        event.tags!.push(["option", option, index.toString()]);
      });
      
      // Sign the event
      const signedEvent = nostrService.signEvent(event);
      
      // Publish to relays
      const relays = nostrService.getRelayUrls();
      
      if (relays.length === 0) {
        console.error("No relays available to publish proposal");
        return null;
      }
      
      try {
        // Use settlePromises instead of Promise.any
        await settlePromises(relays.map(relay => this.pool.publish(relay, signedEvent)));
        
        console.log(`Created proposal ${title} for DAO ${daoId}`);
        
        return signedEvent.id;
      } catch (error) {
        console.error("Failed to publish proposal event:", error);
        return null;
      }
    } catch (error) {
      console.error("Error creating proposal:", error);
      return null;
    }
  }
  
  /**
   * Vote on a proposal
   * @param proposalId The ID of the proposal
   * @param optionIndex The index of the option to vote for
   * @returns A promise that resolves to the ID of the created vote event or null if voting failed
   */
  async voteOnProposal(proposalId: string, optionIndex: number): Promise<string | null> {
    try {
      if (!nostrService.publicKey) {
        console.error("User not authenticated");
        return null;
      }
      
      // Find the proposal and its DAO
      const relays = nostrService.getRelayUrls();
      
      if (relays.length === 0) {
        console.error("No relays available to find proposal");
        return null;
      }
      
      // Get proposal event
      const filter: Filter = { kinds: [DAO_PROPOSAL_KIND], ids: [proposalId] };
      
      try {
        const events = await this.pool.querySync(relays, [filter]) as Event[];
        
        if (events.length === 0) {
          console.error(`Proposal ${proposalId} not found`);
          return null;
        }
        
        const proposalEvent = events[0];
        const daoId = proposalEvent.tags.find(tag => tag[0] === "d")?.[1];
        
        if (!daoId) {
          console.error("Invalid proposal: missing DAO ID");
          return null;
        }
        
        // Check if user is a member of the DAO
        const dao = await this.getDAOById(daoId);
        if (!dao || !dao.members.includes(nostrService.publicKey)) {
          console.error("Only members can vote on proposals");
          return null;
        }
        
        // Check if option index is valid
        const options = proposalEvent.tags.filter(tag => tag[0] === "option");
        if (optionIndex < 0 || optionIndex >= options.length) {
          console.error("Invalid option index");
          return null;
        }
        
        // Prepare the vote event
        const event: Partial<Event> = {
          kind: DAO_VOTE_KIND,
          content: "",
          tags: [
            ["d", daoId],
            ["e", proposalId, "", "reply"],
            ["option", optionIndex.toString()]
          ]
        };
        
        // Sign the event
        const signedEvent = nostrService.signEvent(event);
        
        // Publish to relays
        const relays = nostrService.getRelayUrls();
        
        if (relays.length === 0) {
          console.error("No relays available to find proposal");
          return null;
        }
        
        try {
          // Use settlePromises instead of Promise.any
          await settlePromises(relays.map(relay => this.pool.publish(relay, signedEvent)));
          
          console.log(`Voted for option ${optionIndex} on proposal ${proposalId}`);
          
          return signedEvent.id;
        } catch (error) {
          console.error("Failed to publish vote event:", error);
          return null;
        }
      } catch (error) {
        console.error(`Error finding proposal ${proposalId}:`, error);
        return null;
      }
    } catch (error) {
      console.error("Error voting on proposal:", error);
      return null;
    }
  }
  
  /**
   * Update DAO metadata (e.g., privacy settings, guidelines, tags)
   * @param daoId The ID of the DAO
   * @param metadata Metadata to update
   * @returns A promise that resolves to true if successful
   */
  async updateDAOMetadata(daoId: string, metadata: any): Promise<boolean> {
    try {
      if (!nostrService.publicKey) {
        console.error("User not authenticated");
        return false;
      }
      
      // Check if DAO exists
      const dao = await this.getDAOById(daoId);
      if (!dao) {
        console.error(`DAO ${daoId} not found`);
        return false;
      }
      
      // Verify user is the creator
      if (dao.creator !== nostrService.publicKey) {
        console.error("Only the creator can update DAO metadata");
        return false;
      }
      
      // Prepare the event
      const event: Partial<Event> = {
        kind: DAO_METADATA_KIND,
        content: JSON.stringify(metadata),
        tags: [
          ["d", daoId]
        ]
      };
      
      // Add any special handlers based on metadata type
      if (metadata.type === "privacy") {
        event.tags!.push(["metadataType", "privacy"]);
      } else if (metadata.type === "guidelines") {
        event.tags!.push(["metadataType", "guidelines"]);
      } else if (metadata.type === "tags") {
        event.tags!.push(["metadataType", "tags"]);
      }
      
      // Sign the event
      const signedEvent = nostrService.signEvent(event);
      
      // Publish to relays
      const relays = nostrService.getRelayUrls();
      
      if (relays.length === 0) {
        console.error("No relays available to update DAO metadata");
        return false;
      }
      
      try {
        // Use settlePromises instead of Promise.any
        await settlePromises(relays.map(relay => this.pool.publish(relay, signedEvent)));
        
        console.log(`Updated DAO ${daoId} metadata`);
        
        // Invalidate cache
        await daoCache.invalidateDAODetails(daoId);
        
        return true;
      } catch (error) {
        console.error("Failed to publish DAO metadata update:", error);
        return false;
      }
    } catch (error) {
      console.error(`Error updating DAO ${daoId} metadata:`, error);
      return false;
    }
  }
  
  /**
   * Update DAO guidelines
   * @param daoId The ID of the DAO
   * @param guidelines New guidelines text
   * @returns A promise that resolves to true if successful
   */
  async updateDAOGuidelines(daoId: string, guidelines: string): Promise<boolean> {
    return this.updateDAOMetadata(daoId, {
      type: "guidelines",
      guidelines
    });
  }
  
  /**
   * Update DAO privacy setting
   * @param daoId The ID of the DAO
   * @param isPrivate Whether the DAO is private
   * @returns A promise that resolves to true if successful
   */
  async updateDAOPrivacy(daoId: string, isPrivate: boolean): Promise<boolean> {
    return this.updateDAOMetadata(daoId, {
      type: "privacy",
      isPrivate
    });
  }
  
  /**
   * Update DAO tags
   * @param daoId The ID of the DAO
   * @param tags Array of tags
   * @returns A promise that resolves to true if successful
   */
  async updateDAOTags(daoId: string, tags: string[]): Promise<boolean> {
    return this.updateDAOMetadata(daoId, {
      type: "tags",
      tags
    });
  }
  
  /**
   * Add a moderator to a DAO
   * @param daoId The ID of the DAO
   * @param pubkey The public key of the user to add as moderator
   * @returns A promise that resolves to true if successful
   */
  async addDAOModerator(daoId: string, pubkey: string): Promise<boolean> {
    try {
      if (!nostrService.publicKey) {
        console.error("User not authenticated");
        return false;
      }
      
      // Check if DAO exists
      const dao = await this.getDAOById(daoId);
      if (!dao) {
        console.error(`DAO ${daoId} not found`);
        return false;
      }
      
      // Verify user is the creator
      if (dao.creator !== nostrService.publicKey) {
        console.error("Only the creator can add moderators");
        return false;
      }
      
      // Create a copy of current moderators and add the new one
      const moderators = [...(dao.moderators || [])];
      if (!moderators.includes(pubkey)) {
        moderators.push(pubkey);
      }
      
      // Update metadata
      return this.updateDAOMetadata(daoId, {
        type: "moderators",
        moderators
      });
    } catch (error) {
      console.error(`Error adding moderator to DAO ${daoId}:`, error);
      return false;
    }
  }
  
  /**
   * Remove a moderator from a DAO
   * @param daoId The ID of the DAO
   * @param pubkey The public key of the moderator to remove
   * @returns A promise that resolves to true if successful
   */
  async removeDAOModerator(daoId: string, pubkey: string): Promise<boolean> {
    try {
      if (!nostrService.publicKey) {
        console.error("User not authenticated");
        return false;
      }
      
      // Check if DAO exists
      const dao = await this.getDAOById(daoId);
      if (!dao) {
        console.error(`DAO ${daoId} not found`);
        return false;
      }
      
      // Verify user is the creator
      if (dao.creator !== nostrService.publicKey) {
        console.error("Only the creator can remove moderators");
        return false;
      }
      
      console.log(`Removing moderator ${pubkey} from DAO ${daoId}`);
      
      // Create a copy of current moderators and remove the specified one
      const moderators = (dao.moderators || []).filter(mod => mod !== pubkey);
      
      // Update metadata
      return this.updateDAOMetadata(daoId, {
        type: "moderators",
        moderators
      });
    } catch (error) {
      console.error(`Error removing moderator from DAO ${daoId}:`, error);
      return false;
    }
  }
  
  /**
   * Create a kick proposal to remove a member from a DAO
   * @param daoId The ID of the DAO
   * @param memberPubkey The public key of the member to kick
   * @param reason The reason for the kick
   * @returns A promise that resolves to the ID of the created proposal or null if creation failed
   */
  async createKickProposal(
    daoId: string,
    memberPubkey: string,
    reason: string
  ): Promise<string | null> {
    try {
      if (!nostrService.publicKey) {
        console.error("User not authenticated");
        return null;
      }
      
      // Check if DAO exists
      const dao = await this.getDAOById(daoId);
      if (!dao) {
        console.error(`DAO ${daoId} not found`);
        return null;
      }
      
      // Verify user is a member
      if (!dao.members.includes(nostrService.publicKey)) {
        console.error("Only members can create kick proposals");
        return null;
      }
      
      // Can't kick the creator
      if (memberPubkey === dao.creator) {
        console.error("Cannot kick the DAO creator");
        return null;
      }
      
      // Prepare special description for kick proposal
      const kickContent = JSON.stringify({
        type: "kick",
        targetPubkey: memberPubkey,
        reason
      });
      
      // Create a proposal with special kick metadata
      return this.createProposal(
        daoId,
        `Remove member ${memberPubkey.substring(0, 8)}...`,
        kickContent,
        ["Yes, remove member", "No, keep member"]
      );
    } catch (error) {
      console.error("Error creating kick proposal:", error);
      return null;
    }
  }
  
  /**
   * Vote on a kick proposal
   * @param proposalId The ID of the kick proposal
   * @param optionIndex The index of the option to vote for
   * @returns A promise that resolves to the ID of the created vote event or null if voting failed
   */
  async voteOnKickProposal(proposalId: string, optionIndex: number): Promise<string | null> {
    // Kick proposals use the same voting mechanism as regular proposals
    return this.voteOnProposal(proposalId, optionIndex);
  }
  
  /**
   * Process kick proposal result when it completes
   * @param proposalId The ID of the completed kick proposal
   * @returns A promise that resolves to true if the member was kicked
   */
  async processKickProposal(proposalId: string): Promise<boolean> {
    try {
      // Find the proposal
      const relays = nostrService.getRelayUrls();
      
      if (relays.length === 0) {
        console.error("No relays available to find proposal");
        return false;
      }
      
      // Get proposal event and votes
      const filter: Filter = { kinds: [DAO_PROPOSAL_KIND], ids: [proposalId] };
      const voteFilter: Filter = { kinds: [DAO_VOTE_KIND], "#e": [proposalId] };
      
      try {
        const events = await this.pool.querySync(relays, [filter]) as Event[];
        const voteEvents = await this.pool.querySync(relays, [voteFilter]) as Event[];
        
        if (events.length === 0) {
          console.error(`Kick proposal ${proposalId} not found`);
          return false;
        }
        
        const proposalEvent = events[0];
        const daoId = proposalEvent.tags.find(tag => tag[0] === "d")?.[1];
        
        if (!daoId) {
          console.error("Invalid kick proposal: missing DAO ID");
          return false;
        }
        
        // Parse kick proposal content
        try {
          const kickContent = JSON.parse(proposalEvent.content);
          if (kickContent.type !== "kick" || !kickContent.targetPubkey) {
            console.error("Invalid kick proposal format");
            return false;
          }
          
          const targetPubkey = kickContent.targetPubkey;
          
          // Check if the user is a member of the DAO
          const dao = await this.getDAOById(daoId);
          if (!dao) {
            console.error(`DAO ${daoId} not found`);
            return false;
          }
          
          // Count votes
          let yesVotes = 0;
          let noVotes = 0;
          
          for (const event of voteEvents) {
            const optionIndex = event.tags.find(tag => tag[0] === "option")?.[1];
            if (optionIndex === "0") {
              yesVotes++;
            } else if (optionIndex === "1") {
              noVotes++;
            }
          }
          
          // Decision threshold: more yes than no and at least 3 yes votes or 25% of members
          const minVotes = Math.max(3, Math.ceil(dao.members.length * 0.25));
          const shouldKick = yesVotes > noVotes && yesVotes >= minVotes;
          
          if (shouldKick) {
            // Execute the kick
            // Only the creator or a moderator can actually perform the kick
            if (nostrService.publicKey !== dao.creator && !dao.moderators.includes(nostrService.publicKey)) {
              // The current user can't execute the kick directly
              // Just return the decision so another user with appropriate permissions can execute
              return true;
            }
            
            // Prepare the event to remove the member
            const event: Partial<Event> = {
              kind: DAO_MEMBER_REMOVE_KIND,
              content: `Member removed by proposal ${proposalId}`,
              tags: [
                ["d", daoId],
                ["p", targetPubkey],
                ["e", proposalId, "", "reference"]
              ]
            };
            
            // Sign the event
            const signedEvent = nostrService.signEvent(event);
            
            // Publish to relays
            await settlePromises(relays.map(relay => this.pool.publish(relay, signedEvent)));
            
            console.log(`Member ${targetPubkey} removed from DAO ${daoId} by proposal`);
            
            // Invalidate cache
            await daoCache.invalidateDAODetails(daoId);
            await daoCache.invalidateUserDAOs(targetPubkey);
            
            return true;
          } else {
            console.log(`Kick proposal ${proposalId} rejected`);
            return false;
          }
        } catch (e) {
          console.error("Error parsing kick proposal content:", e);
          return false;
        }
      } catch (error) {
        console.error(`Error processing kick proposal ${proposalId}:`, error);
        return false;
      }
    } catch (error) {
      console.error("Error processing kick proposal:", error);
      return false;
    }
  }
  
  /**
   * Create an invite link for a DAO
   * @param daoId The ID of the DAO
   * @returns A promise that resolves to the invite ID or null if creation failed
   */
  async createDAOInvite(daoId: string): Promise<string | null> {
    try {
      if (!nostrService.publicKey) {
        console.error("User not authenticated");
        return null;
      }
      
      // Check if DAO exists
      const dao = await this.getDAOById(daoId);
      if (!dao) {
        console.error(`DAO ${daoId} not found`);
        return null;
      }
      
      // Verify user is the creator or a moderator
      if (dao.creator !== nostrService.publicKey && !dao.moderators.includes(nostrService.publicKey)) {
        console.error("Only the creator or moderators can create invites");
        return null;
      }
      
      // Generate invite ID
      const inviteId = generateRandomId();
      
      // Prepare the event
      const event: Partial<Event> = {
        kind: DAO_INVITE_KIND,
        content: "",
        tags: [
          ["d", daoId],
          ["invite", inviteId],
          ["created_by", nostrService.publicKey],
          ["created_at", Math.floor(Date.now() / 1000).toString()]
        ]
      };
      
      // Sign the event
      const signedEvent = nostrService.signEvent(event);
      
      // Publish to relays
      const relays = nostrService.getRelayUrls();
      
      if (relays.length === 0) {
        console.error("No relays available to publish DAO invite");
        return null;
      }
      
      try {
        // Use settlePromises instead of Promise.any
        await settlePromises(relays.map(relay => this.pool.publish(relay, signedEvent)));
        
        console.log(`Created invite ${inviteId} for DAO ${daoId}`);
        
        return inviteId;
      } catch (error) {
        console.error("Failed to publish DAO invite event:", error);
        return null;
      }
    } catch (error) {
      console.error(`Error creating invite for DAO ${daoId}:`, error);
      return null;
    }
  }
  
  /**
   * Process DAO events into DAO objects
   * @param events Array of DAO events
   * @param joinEvents Optional array of join events
   * @param leaveEvents Optional array of leave events
   * @param removeEvents Optional array of member removal events
   * @returns Array of processed DAO objects
   */
  private async processDAOEvents(
    events: Event[], 
    joinEvents: Event[] = [], 
    leaveEvents: Event[] = [],
    removeEvents: Event[] = []
  ): Promise<DAO[]> {
    const daos: DAO[] = [];
    
    for (const event of events) {
      try {
        // Check if this is a deletion event
        const statusTag = event.tags.find(tag => tag[0] === "status");
        if (statusTag && statusTag[1] === "deleted") {
          // This is a deletion event, skip it
          continue;
        }
        
        const id = event.tags.find(tag => tag[0] === "d")?.[1];
        if (!id) continue;
        
        const name = event.tags.find(tag => tag[0] === "name")?.[1] || "Unnamed DAO";
        const creator = event.tags.find(tag => tag[0] === "creator")?.[1] || event.pubkey;
        const description = event.content;
        const createdAt = event.created_at;
        
        // Extract tags if any
        const tags: string[] = event.tags
          .filter(tag => tag[0] === "t")
          .map(tag => tag[1]);
        
        // Calculate current members based on join, leave, and remove events
        const members = new Set<string>();
        
        // Always add creator as a member
        members.add(creator);
        
        // Process join events
        for (const joinEvent of joinEvents) {
          const daoId = joinEvent.tags.find(tag => tag[0] === "d")?.[1];
          if (daoId === id) {
            const userPubkey = joinEvent.tags.find(tag => tag[0] === "u")?.[1] || joinEvent.pubkey;
            members.add(userPubkey);
          }
        }
        
        // Process leave events
        for (const leaveEvent of leaveEvents) {
          const daoId = leaveEvent.tags.find(tag => tag[0] === "d")?.[1];
          if (daoId === id) {
            const userPubkey = leaveEvent.tags.find(tag => tag[0] === "u")?.[1] || leaveEvent.pubkey;
            members.delete(userPubkey);
          }
        }
        
        // Process removal events
        for (const removeEvent of removeEvents) {
          const daoId = removeEvent.tags.find(tag => tag[0] === "d")?.[1];
          if (daoId === id) {
            const userPubkey = removeEvent.tags.find(tag => tag[0] === "p")?.[1];
            if (userPubkey) {
              members.delete(userPubkey);
            }
          }
        }
        
        // Make sure creator is always a member
        members.add(creator);
        
        daos.push({
          id,
          name,
          description,
          creator,
          createdAt,
          members: Array.from(members),
          moderators: [],
          isPrivate: false,
          tags
        });
      } catch (e) {
        console.error("Error processing DAO event:", e);
        continue;
      }
    }
    
    return daos;
  }
}

// Export a singleton instance
export const daoService = new DAOService();
