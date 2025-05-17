// Import necessary dependencies
import { Event, SimplePool, getEventHash, getSignature, utils } from 'nostr-tools';
import { nostrService } from '../nostr';
import { DAO, DAOProposal } from '@/types/dao';
import { daoCache } from './dao-cache';

// Constants for DAO-related event kinds
const DAO_CREATION_KIND = 8000;
const DAO_UPDATE_KIND = 8001;
const DAO_PROPOSAL_KIND = 8002;
const DAO_VOTE_KIND = 8003;
const DAO_MEMBER_KIND = 8004; // Join/Leave
const DAO_DELETE_KIND = 8005;
const DAO_META_KIND = 8006; // For privacy settings, etc.
const DAO_INVITE_KIND = 8007;
const DAO_KICK_PROPOSAL_KIND = 8008;
const DAO_KICK_VOTE_KIND = 8009;
const DAO_MODERATOR_KIND = 8010;

// Available DAO-related tags
export const DAO_TAGS = {
  DAO_ID: 'd',
  DAO_NAME: 'name',
  PROPOSAL_ID: 'p',
  VOTE: 'vote',
  MEMBER: 'member',
  CREATOR: 'creator',
  PROPOSAL_TITLE: 'title',
  PROPOSAL_OPTIONS: 'options',
  PROPOSAL_CLOSES: 'closes',
  USER: 'u',
  ACTION: 'action',
  INVITE_ID: 'i',
  MODERATOR: 'mod',
  TAGS: 'tags',
};

/**
 * Service for handling DAO-related operations
 */
class DAOService {
  // Private pool for Nostr events
  private pool: SimplePool;
  
  constructor() {
    this.pool = new SimplePool();
  }
  
  /**
   * Get all DAOs from relays
   */
  async getDAOs(): Promise<DAO[]> {
    // Try to get from cache first
    const cachedDaos = await daoCache.getAllDAOs();
    if (cachedDaos.length > 0) {
      console.log("Returning cached DAOs:", cachedDaos.length);
      return cachedDaos;
    }
    
    // If not in cache, fetch from relays
    console.log("Fetching DAOs from relays");
    
    try {
      const relays = nostrService.getRelays();
      const filter = { kinds: [DAO_CREATION_KIND] };
      
      const events = await this.pool.list(relays, [filter]);
      console.log(`Fetched ${events.length} DAO events`);
      
      const daos = events.map(event => this.parseDaoEvent(event)).filter(Boolean) as DAO[];
      
      // Update cache
      await daoCache.cacheDAOs(daos);
      
      return daos;
    } catch (error) {
      console.error("Error fetching DAOs:", error);
      return [];
    }
  }
  
  /**
   * Get DAOs created by or joined by a specific user
   */
  async getUserDAOs(pubkey: string): Promise<DAO[]> {
    // Try to get from cache first
    const cachedDaos = await daoCache.getUserDAOs(pubkey);
    if (cachedDaos.length > 0) {
      console.log(`Returning cached DAOs for user ${pubkey}:`, cachedDaos.length);
      return cachedDaos;
    }
    
    // If not in cache, fetch from relays
    console.log(`Fetching DAOs for user ${pubkey} from relays`);
    
    try {
      const relays = nostrService.getRelays();
      
      // Fetch DAOs where the user is the creator
      const creatorFilter = { 
        kinds: [DAO_CREATION_KIND],
        authors: [pubkey]
      };
      
      // Fetch DAOs where the user is a member
      const memberFilter = {
        kinds: [DAO_MEMBER_KIND],
        '#u': [pubkey],
        '#action': ['join']
      };
      
      const [creatorEvents, memberEvents] = await Promise.all([
        this.pool.list(relays, [creatorFilter]),
        this.pool.list(relays, [memberFilter])
      ]);
      
      console.log(`Fetched ${creatorEvents.length} creator DAO events and ${memberEvents.length} member DAO events`);
      
      // Extract DAO IDs from member events
      const memberDaoIds = memberEvents.map(event => {
        const daoId = event.tags.find(tag => tag[0] === DAO_TAGS.DAO_ID)?.[1];
        return daoId;
      }).filter(Boolean);
      
      // Fetch the full DAO details for member DAOs
      const daoDetailsFilter = {
        kinds: [DAO_CREATION_KIND],
        '#d': memberDaoIds
      };
      
      const memberDaoEvents = await this.pool.list(relays, [daoDetailsFilter]);
      
      // Combine and parse all DAO events
      const allDaoEvents = [...creatorEvents, ...memberDaoEvents];
      const uniqueDaoIds = new Set();
      const daos = allDaoEvents
        .map(event => this.parseDaoEvent(event))
        .filter(dao => {
          if (!dao || uniqueDaoIds.has(dao.id)) return false;
          uniqueDaoIds.add(dao.id);
          return true;
        }) as DAO[];
      
      // Update cache
      await daoCache.cacheUserDAOs(pubkey, daos);
      
      return daos;
    } catch (error) {
      console.error(`Error fetching DAOs for user ${pubkey}:`, error);
      return [];
    }
  }
  
  /**
   * Get trending DAOs (most members or activity)
   */
  async getTrendingDAOs(): Promise<DAO[]> {
    // Try to get from cache first
    const cachedDaos = await daoCache.getTrendingDAOs();
    if (cachedDaos.length > 0) {
      console.log("Returning cached trending DAOs:", cachedDaos.length);
      return cachedDaos;
    }
    
    try {
      // For now, just return the top 10 DAOs by member count
      const allDaos = await this.getDAOs();
      const sortedDaos = allDaos.sort((a, b) => b.members.length - a.members.length);
      const trendingDaos = sortedDaos.slice(0, 10);
      
      // Update cache
      await daoCache.cacheTrendingDAOs(trendingDaos);
      
      return trendingDaos;
    } catch (error) {
      console.error("Error fetching trending DAOs:", error);
      return [];
    }
  }
  
  /**
   * Get a specific DAO by ID
   */
  async getDAOById(daoId: string): Promise<DAO | null> {
    // Try to get from cache first
    const cachedDao = await daoCache.getDAOById(daoId);
    if (cachedDao) {
      console.log(`Returning cached DAO ${daoId}`);
      return cachedDao;
    }
    
    console.log(`Fetching DAO ${daoId} from relays`);
    
    try {
      const relays = nostrService.getRelays();
      const filter = { 
        kinds: [DAO_CREATION_KIND],
        '#d': [daoId]
      };
      
      const events = await this.pool.list(relays, [filter]);
      console.log(`Fetched ${events.length} events for DAO ${daoId}`);
      
      if (events.length === 0) {
        return null;
      }
      
      // Use the most recent event
      const latestEvent = events.sort((a, b) => b.created_at - a.created_at)[0];
      const dao = this.parseDaoEvent(latestEvent);
      
      if (!dao) {
        return null;
      }
      
      // Get DAO members
      const membersFilter = {
        kinds: [DAO_MEMBER_KIND],
        '#d': [daoId],
        '#action': ['join']
      };
      
      const memberEvents = await this.pool.list(relays, [membersFilter]);
      console.log(`Fetched ${memberEvents.length} member events for DAO ${daoId}`);
      
      const members = memberEvents.map(event => event.tags
        .find(tag => tag[0] === DAO_TAGS.USER)?.[1])
        .filter(Boolean) as string[];
      
      // Get DAO moderators
      const moderatorsFilter = {
        kinds: [DAO_MODERATOR_KIND],
        '#d': [daoId]
      };
      
      const moderatorEvents = await this.pool.list(relays, [moderatorsFilter]);
      console.log(`Fetched ${moderatorEvents.length} moderator events for DAO ${daoId}`);
      
      const moderators = moderatorEvents.map(event => event.tags
        .find(tag => tag[0] === DAO_TAGS.MODERATOR)?.[1])
        .filter(Boolean) as string[];
      
      // Get metadata updates (privacy settings, etc.)
      const metaFilter = {
        kinds: [DAO_META_KIND],
        '#d': [daoId]
      };
      
      const metaEvents = await this.pool.list(relays, [metaFilter]);
      console.log(`Fetched ${metaEvents.length} metadata events for DAO ${daoId}`);
      
      // Process metadata (e.g., privacy settings)
      let isPrivate = false;
      let guidelines = '';
      
      if (metaEvents.length > 0) {
        // Sort by timestamp to get the latest
        const sortedMetaEvents = metaEvents.sort((a, b) => b.created_at - a.created_at);
        
        for (const event of sortedMetaEvents) {
          try {
            const content = JSON.parse(event.content);
            
            if ('isPrivate' in content) {
              isPrivate = content.isPrivate;
            }
            
            if ('guidelines' in content) {
              guidelines = content.guidelines;
            }
          } catch (error) {
            console.error("Error parsing metadata event content:", error);
          }
        }
      }
      
      // Create the complete DAO object with members and metadata
      const completeDao: DAO = {
        ...dao,
        members: Array.from(new Set([dao.creator, ...members])),
        moderators: Array.from(new Set(moderators)),
        isPrivate,
        guidelines
      };
      
      // Update cache
      await daoCache.cacheDAO(completeDao);
      
      return completeDao;
    } catch (error) {
      console.error(`Error fetching DAO ${daoId}:`, error);
      return null;
    }
  }
  
  /**
   * Get proposals for a specific DAO
   */
  async getDAOProposals(daoId: string): Promise<DAOProposal[]> {
    console.log(`Fetching proposals for DAO ${daoId}`);
    
    try {
      const relays = nostrService.getRelays();
      const filter = { 
        kinds: [DAO_PROPOSAL_KIND, DAO_KICK_PROPOSAL_KIND],
        '#d': [daoId]
      };
      
      // Get votes filter to fetch all votes for this DAO's proposals
      const votesFilter = {
        kinds: [DAO_VOTE_KIND, DAO_KICK_VOTE_KIND],
        '#d': [daoId]
      };
      
      const [proposalEvents, voteEvents] = await Promise.all([
        this.pool.list(relays, [filter]),
        this.pool.list(relays, [votesFilter])
      ]);
      
      console.log(`Fetched ${proposalEvents.length} proposals and ${voteEvents.length} votes for DAO ${daoId}`);
      
      // Organize votes by proposal ID
      const votesByProposal: Record<string, Record<string, number>> = {};
      
      for (const voteEvent of voteEvents) {
        const proposalId = voteEvent.tags.find(tag => tag[0] === DAO_TAGS.PROPOSAL_ID)?.[1];
        if (!proposalId) continue;
        
        const vote = voteEvent.tags.find(tag => tag[0] === DAO_TAGS.VOTE)?.[1];
        if (!vote) continue;
        
        const voteIndex = parseInt(vote);
        if (isNaN(voteIndex)) continue;
        
        if (!votesByProposal[proposalId]) {
          votesByProposal[proposalId] = {};
        }
        
        votesByProposal[proposalId][voteEvent.pubkey] = voteIndex;
      }
      
      // Parse proposals
      const proposals = proposalEvents.map(event => {
        const proposal = this.parseProposalEvent(event);
        if (!proposal) return null;
        
        // Add votes to the proposal
        proposal.votes = votesByProposal[proposal.id] || {};
        
        return proposal;
      }).filter(Boolean) as DAOProposal[];
      
      // Sort by created_at (newest first)
      return proposals.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error(`Error fetching proposals for DAO ${daoId}:`, error);
      return [];
    }
  }
  
  /**
   * Subscribe to DAOs (real-time updates)
   */
  subscribeToDAOs(callback: (dao: DAO) => void): () => void {
    console.log("Setting up subscription for DAOs");
    const relays = nostrService.getRelays();
    
    // First try to get cached DAOs
    daoCache.getAllDAOs().then(daos => {
      for (const dao of daos) {
        callback(dao);
      }
    });
    
    // Subscribe to new DAO events
    const filter = { kinds: [DAO_CREATION_KIND] };
    
    const sub = this.pool.subscribe(relays, [filter], {
      onevent: (event) => {
        const dao = this.parseDaoEvent(event);
        if (dao) {
          callback(dao);
          // Update cache
          daoCache.cacheDAO(dao);
        }
      },
      oneose: () => {
        console.log("Initial DAO load complete");
      }
    });
    
    return () => {
      sub.close();
    };
  }
  
  /**
   * Subscribe to a specific DAO
   */
  subscribeToDAO(daoId: string, callback: (dao: DAO | null) => void): () => void {
    console.log(`Setting up subscription for DAO ${daoId}`);
    const relays = nostrService.getRelays();
    
    // First try to get cached DAO
    daoCache.getDAOById(daoId).then(dao => {
      if (dao) {
        callback(dao);
      }
    });
    
    // Subscribe to DAO events
    const daoFilter = { 
      kinds: [DAO_CREATION_KIND],
      '#d': [daoId]
    };
    
    const memberFilter = {
      kinds: [DAO_MEMBER_KIND],
      '#d': [daoId]
    };
    
    const modFilter = {
      kinds: [DAO_MODERATOR_KIND],
      '#d': [daoId]
    };
    
    const metaFilter = {
      kinds: [DAO_META_KIND],
      '#d': [daoId]
    };
    
    const sub = this.pool.subscribe(relays, [daoFilter, memberFilter, modFilter, metaFilter], {
      onevent: async (event) => {
        if (event.kind === DAO_CREATION_KIND) {
          // DAO creation/update event
          const dao = this.parseDaoEvent(event);
          if (dao) {
            // Fetch complete DAO info
            const completeDao = await this.getDAOById(daoId);
            if (completeDao) {
              callback(completeDao);
              // Update cache
              daoCache.cacheDAO(completeDao);
            }
          }
        } else if (event.kind === DAO_MEMBER_KIND || 
                   event.kind === DAO_MODERATOR_KIND || 
                   event.kind === DAO_META_KIND) {
          // Member/Moderator/Metadata update, refetch the complete DAO
          const completeDao = await this.getDAOById(daoId);
          if (completeDao) {
            callback(completeDao);
            // Update cache
            daoCache.cacheDAO(completeDao);
          }
        }
      },
      oneose: () => {
        console.log(`Initial DAO ${daoId} load complete`);
      }
    });
    
    return () => {
      sub.close();
    };
  }
  
  /**
   * Subscribe to DAOs for a specific user
   */
  subscribeToUserDAOs(pubkey: string, callback: (dao: DAO) => void): () => void {
    console.log(`Setting up subscription for DAOs belonging to ${pubkey}`);
    const relays = nostrService.getRelays();
    
    // First try to get cached DAOs
    daoCache.getUserDAOs(pubkey).then(daos => {
      for (const dao of daos) {
        callback(dao);
      }
    });
    
    // Subscribe to DAO events for this user
    const createdFilter = { 
      kinds: [DAO_CREATION_KIND],
      authors: [pubkey]
    };
    
    const memberFilter = {
      kinds: [DAO_MEMBER_KIND],
      '#u': [pubkey],
      '#action': ['join']
    };
    
    const sub = this.pool.subscribe(relays, [createdFilter, memberFilter], {
      onevent: async (event) => {
        if (event.kind === DAO_CREATION_KIND) {
          // DAO creation event by the user
          const dao = this.parseDaoEvent(event);
          if (dao) {
            callback(dao);
            // Update cache
            daoCache.cacheDAO(dao);
            daoCache.addUserDAO(pubkey, dao.id);
          }
        } else if (event.kind === DAO_MEMBER_KIND) {
          // User joined a DAO
          const daoId = event.tags.find(tag => tag[0] === DAO_TAGS.DAO_ID)?.[1];
          if (daoId) {
            const dao = await this.getDAOById(daoId);
            if (dao) {
              callback(dao);
              // Update cache
              daoCache.addUserDAO(pubkey, daoId);
            }
          }
        }
      },
      oneose: () => {
        console.log(`Initial user DAOs for ${pubkey} load complete`);
      }
    });
    
    return () => {
      sub.close();
    };
  }
  
  /**
   * Subscribe to DAO proposals
   */
  subscribeToDAOProposals(daoId: string, callback: (proposal: DAOProposal) => void): () => void {
    console.log(`Setting up subscription for proposals of DAO ${daoId}`);
    const relays = nostrService.getRelays();
    
    // First try to get cached proposals
    this.getDAOProposals(daoId).then(proposals => {
      for (const proposal of proposals) {
        callback(proposal);
      }
    });
    
    // Subscribe to proposal events
    const proposalFilter = { 
      kinds: [DAO_PROPOSAL_KIND, DAO_KICK_PROPOSAL_KIND],
      '#d': [daoId]
    };
    
    const voteFilter = {
      kinds: [DAO_VOTE_KIND, DAO_KICK_VOTE_KIND],
      '#d': [daoId]
    };
    
    // Keep track of proposals and their votes
    const proposals: Record<string, DAOProposal> = {};
    const votesByProposal: Record<string, Record<string, number>> = {};
    
    const sub = this.pool.subscribe(relays, [proposalFilter, voteFilter], {
      onevent: (event) => {
        if (event.kind === DAO_PROPOSAL_KIND || event.kind === DAO_KICK_PROPOSAL_KIND) {
          // New proposal
          const proposal = this.parseProposalEvent(event);
          if (proposal) {
            // Add existing votes if any
            const existingVotes = votesByProposal[proposal.id] || {};
            proposal.votes = existingVotes;
            proposals[proposal.id] = proposal;
            callback(proposal);
          }
        } else if (event.kind === DAO_VOTE_KIND || event.kind === DAO_KICK_VOTE_KIND) {
          // New vote
          const proposalId = event.tags.find(tag => tag[0] === DAO_TAGS.PROPOSAL_ID)?.[1];
          if (!proposalId) return;
          
          const vote = event.tags.find(tag => tag[0] === DAO_TAGS.VOTE)?.[1];
          if (!vote) return;
          
          const voteIndex = parseInt(vote);
          if (isNaN(voteIndex)) return;
          
          // Store the vote
          if (!votesByProposal[proposalId]) {
            votesByProposal[proposalId] = {};
          }
          votesByProposal[proposalId][event.pubkey] = voteIndex;
          
          // Update the proposal if we have it
          if (proposals[proposalId]) {
            const updatedProposal = {
              ...proposals[proposalId],
              votes: { ...votesByProposal[proposalId] }
            };
            proposals[proposalId] = updatedProposal;
            callback(updatedProposal);
          }
        }
      },
      oneose: () => {
        console.log(`Initial proposals for DAO ${daoId} load complete`);
      }
    });
    
    return () => {
      sub.close();
    };
  }
  
  /**
   * Parse a DAO event
   */
  public parseDaoEvent(event: Event): DAO | null {
    try {
      const daoId = event.tags.find(tag => tag[0] === DAO_TAGS.DAO_ID)?.[1];
      if (!daoId) {
        console.error("DAO event missing ID tag:", event);
        return null;
      }
      
      const name = event.tags.find(tag => tag[0] === DAO_TAGS.DAO_NAME)?.[1];
      if (!name) {
        console.error("DAO event missing name tag:", event);
        return null;
      }
      
      // Extract tags from the event
      const tagsTags = event.tags.filter(tag => tag[0] === DAO_TAGS.TAGS);
      const tags = tagsTags.map(tag => tag[1]).filter(Boolean);
      
      return {
        id: daoId,
        name,
        creator: event.pubkey,
        description: event.content,
        createdAt: event.created_at,
        members: [event.pubkey], // Initially, just the creator
        moderators: [], // Initially empty
        isPrivate: false, // Default to public
        proposals: [], // Will be filled separately
        tags: tags, // Tags from the event
        guidelines: '' // Will be filled from metadata events
      };
    } catch (error) {
      console.error("Error parsing DAO event:", error);
      return null;
    }
  }
  
  /**
   * Parse a proposal event
   */
  public parseProposalEvent(event: Event): DAOProposal | null {
    try {
      const proposalId = event.id;
      
      const daoId = event.tags.find(tag => tag[0] === DAO_TAGS.DAO_ID)?.[1];
      if (!daoId) {
        console.error("Proposal event missing DAO ID tag:", event);
        return null;
      }
      
      const title = event.tags.find(tag => tag[0] === DAO_TAGS.PROPOSAL_TITLE)?.[1];
      if (!title) {
        console.error("Proposal event missing title tag:", event);
        return null;
      }
      
      const optionsTag = event.tags.find(tag => tag[0] === DAO_TAGS.PROPOSAL_OPTIONS);
      if (!optionsTag || optionsTag.length < 2) {
        console.error("Proposal event missing options tag:", event);
        return null;
      }
      
      // Options are stored as additional values in the tag
      const options = optionsTag.slice(1);
      
      const closesTag = event.tags.find(tag => tag[0] === DAO_TAGS.PROPOSAL_CLOSES)?.[1];
      const closesAt = closesTag ? parseInt(closesTag) : (event.created_at + 7 * 24 * 60 * 60); // Default to 7 days
      
      return {
        id: proposalId,
        daoId,
        creator: event.pubkey,
        title,
        description: event.content,
        options,
        createdAt: event.created_at,
        closesAt,
        votes: {} // Will be filled separately
      };
    } catch (error) {
      console.error("Error parsing proposal event:", error);
      return null;
    }
  }
  
  /**
   * Create a new DAO
   */
  async createDAO(name: string, description: string, tags: string[] = []): Promise<string | null> {
    if (!nostrService.publicKey) {
      throw new Error("Not logged in");
    }
    
    try {
      const daoId = utils.randomId(); // Generate a random ID for the DAO
      
      const daoTags = [
        [DAO_TAGS.DAO_ID, daoId],
        [DAO_TAGS.DAO_NAME, name],
        ['client', 'blocknoster']
      ];
      
      // Add tags if provided
      for (const tag of tags) {
        daoTags.push([DAO_TAGS.TAGS, tag]);
      }
      
      const event: Partial<Event> = {
        kind: DAO_CREATION_KIND,
        created_at: Math.floor(Date.now() / 1000),
        tags: daoTags,
        content: description || "",
        pubkey: nostrService.publicKey
      };
      
      const signedEvent = await nostrService.signEvent(event);
      if (!signedEvent) {
        throw new Error("Failed to sign event");
      }
      
      const relays = nostrService.getRelays();
      const pubs = this.pool.publish(relays, signedEvent);
      
      // Wait for confirmation from at least one relay
      await Promise.any(pubs);
      
      // Invalidate cache
      daoCache.invalidateDAO(daoId);
      
      return daoId;
    } catch (error) {
      console.error("Error creating DAO:", error);
      return null;
    }
  }
  
  /**
   * Update DAO metadata (privacy, etc.)
   */
  async updateDAOMetadata(daoId: string, metadata: { type: string; isPrivate?: boolean; guidelines?: string }): Promise<boolean> {
    if (!nostrService.publicKey) {
      throw new Error("Not logged in");
    }
    
    try {
      const dao = await this.getDAOById(daoId);
      if (!dao) {
        throw new Error("DAO not found");
      }
      
      // Verify user is the creator
      if (dao.creator !== nostrService.publicKey) {
        throw new Error("Only the creator can update DAO metadata");
      }
      
      const metaTags = [
        [DAO_TAGS.DAO_ID, daoId],
        ['client', 'blocknoster'],
        ['type', metadata.type]
      ];
      
      const event: Partial<Event> = {
        kind: DAO_META_KIND,
        created_at: Math.floor(Date.now() / 1000),
        tags: metaTags,
        content: JSON.stringify(metadata),
        pubkey: nostrService.publicKey
      };
      
      const signedEvent = await nostrService.signEvent(event);
      if (!signedEvent) {
        throw new Error("Failed to sign event");
      }
      
      const relays = nostrService.getRelays();
      const pubs = this.pool.publish(relays, signedEvent);
      
      // Wait for confirmation from at least one relay
      await Promise.any(pubs);
      
      // Invalidate cache
      daoCache.invalidateDAO(daoId);
      
      return true;
    } catch (error) {
      console.error("Error updating DAO metadata:", error);
      return false;
    }
  }
  
  /**
   * Update DAO guidelines
   */
  async updateDAOGuidelines(daoId: string, guidelines: string): Promise<boolean> {
    return this.updateDAOMetadata(daoId, { type: 'guidelines', guidelines });
  }
  
  /**
   * Update DAO tags
   */
  async updateDAOTags(daoId: string, tags: string[]): Promise<boolean> {
    if (!nostrService.publicKey) {
      throw new Error("Not logged in");
    }
    
    try {
      const dao = await this.getDAOById(daoId);
      if (!dao) {
        throw new Error("DAO not found");
      }
      
      // Verify user is the creator
      if (dao.creator !== nostrService.publicKey) {
        throw new Error("Only the creator can update DAO tags");
      }
      
      // Create an update event with the new tags
      const tagArray = [
        [DAO_TAGS.DAO_ID, daoId],
        [DAO_TAGS.DAO_NAME, dao.name],
        ['client', 'blocknoster']
      ];
      
      // Add tags
      for (const tag of tags) {
        tagArray.push([DAO_TAGS.TAGS, tag]);
      }
      
      const event: Partial<Event> = {
        kind: DAO_UPDATE_KIND,
        created_at: Math.floor(Date.now() / 1000),
        tags: tagArray,
        content: dao.description || "",
        pubkey: nostrService.publicKey
      };
      
      const signedEvent = await nostrService.signEvent(event);
      if (!signedEvent) {
        throw new Error("Failed to sign event");
      }
      
      const relays = nostrService.getRelays();
      const pubs = this.pool.publish(relays, signedEvent);
      
      // Wait for confirmation from at least one relay
      await Promise.any(pubs);
      
      // Invalidate cache
      daoCache.invalidateDAO(daoId);
      
      return true;
    } catch (error) {
      console.error("Error updating DAO tags:", error);
      return false;
    }
  }
  
  /**
   * Add a moderator to the DAO
   */
  async addDAOModerator(daoId: string, moderatorPubkey: string): Promise<boolean> {
    if (!nostrService.publicKey) {
      throw new Error("Not logged in");
    }
    
    try {
      const dao = await this.getDAOById(daoId);
      if (!dao) {
        throw new Error("DAO not found");
      }
      
      // Verify user is the creator
      if (dao.creator !== nostrService.publicKey) {
        throw new Error("Only the creator can add moderators");
      }
      
      // Create a moderator event
      const modTags = [
        [DAO_TAGS.DAO_ID, daoId],
        [DAO_TAGS.MODERATOR, moderatorPubkey],
        ['client', 'blocknoster']
      ];
      
      const event: Partial<Event> = {
        kind: DAO_MODERATOR_KIND,
        created_at: Math.floor(Date.now() / 1000),
        tags: modTags,
        content: "",
        pubkey: nostrService.publicKey
      };
      
      const signedEvent = await nostrService.signEvent(event);
      if (!signedEvent) {
        throw new Error("Failed to sign event");
      }
      
      const relays = nostrService.getRelays();
      const pubs = this.pool.publish(relays, signedEvent);
      
      // Wait for confirmation from at least one relay
      await Promise.any(pubs);
      
      // Invalidate cache
      daoCache.invalidateDAO(daoId);
      
      return true;
    } catch (error) {
      console.error("Error adding moderator:", error);
      return false;
    }
  }
  
  /**
   * Remove a moderator from the DAO
   */
  async removeDAOModerator(daoId: string, moderatorPubkey: string): Promise<boolean> {
    if (!nostrService.publicKey) {
      throw new Error("Not logged in");
    }
    
    try {
      const dao = await this.getDAOById(daoId);
      if (!dao) {
        throw new Error("DAO not found");
      }
      
      // Verify user is the creator
      if (dao.creator !== nostrService.publicKey) {
        throw new Error("Only the creator can remove moderators");
      }
      
      // Create a moderator removal event (using the same kind but with 'remove' action)
      const modTags = [
        [DAO_TAGS.DAO_ID, daoId],
        [DAO_TAGS.MODERATOR, moderatorPubkey],
        [DAO_TAGS.ACTION, 'remove'],
        ['client', 'blocknoster']
      ];
      
      const event: Partial<Event> = {
        kind: DAO_MODERATOR_KIND,
        created_at: Math.floor(Date.now() / 1000),
        tags: modTags,
        content: "",
        pubkey: nostrService.publicKey
      };
      
      const signedEvent = await nostrService.signEvent(event);
      if (!signedEvent) {
        throw new Error("Failed to sign event");
      }
      
      const relays = nostrService.getRelays();
      const pubs = this.pool.publish(relays, signedEvent);
      
      // Wait for confirmation from at least one relay
      await Promise.any(pubs);
      
      // Invalidate cache
      daoCache.invalidateDAO(daoId);
      
      return true;
    } catch (error) {
      console.error("Error removing moderator:", error);
      return false;
    }
  }
  
  /**
   * Create a new proposal for the DAO
   */
  async createProposal(
    daoId: string, 
    title: string, 
    description: string, 
    options: string[],
    durationDays: number = 7
  ): Promise<string | null> {
    if (!nostrService.publicKey) {
      throw new Error("Not logged in");
    }
    
    try {
      const dao = await this.getDAOById(daoId);
      if (!dao) {
        throw new Error("DAO not found");
      }
      
      // Verify user is a member
      if (!dao.members.includes(nostrService.publicKey)) {
        throw new Error("Only members can create proposals");
      }
      
      if (!options || options.length < 2) {
        throw new Error("At least two options are required");
      }
      
      // Calculate proposal closing time
      const now = Math.floor(Date.now() / 1000);
      const closesAt = now + (durationDays * 24 * 60 * 60);
      
      // Create proposal tags
      const proposalTags = [
        [DAO_TAGS.DAO_ID, daoId],
        [DAO_TAGS.PROPOSAL_TITLE, title],
        [DAO_TAGS.PROPOSAL_CLOSES, closesAt.toString()],
        ['client', 'blocknoster']
      ];
      
      // Add options as a single tag with multiple values
      const optionsTag = [DAO_TAGS.PROPOSAL_OPTIONS].concat(options);
      proposalTags.push(optionsTag);
      
      const event: Partial<Event> = {
        kind: DAO_PROPOSAL_KIND,
        created_at: now,
        tags: proposalTags,
        content: description || "",
        pubkey: nostrService.publicKey
      };
      
      const signedEvent = await nostrService.signEvent(event);
      if (!signedEvent) {
        throw new Error("Failed to sign event");
      }
      
      const relays = nostrService.getRelays();
      const pubs = this.pool.publish(relays, signedEvent);
      
      // Wait for confirmation from at least one relay
      await Promise.any(pubs);
      
      return signedEvent.id;
    } catch (error) {
      console.error("Error creating proposal:", error);
      return null;
    }
  }
  
  /**
   * Create a kick proposal
   */
  async createKickProposal(
    daoId: string, 
    title: string, 
    reason: string, 
    options: string[],
    targetPubkey: string,
    durationDays: number = 7
  ): Promise<string | null> {
    if (!nostrService.publicKey) {
      throw new Error("Not logged in");
    }
    
    try {
      const dao = await this.getDAOById(daoId);
      if (!dao) {
        throw new Error("DAO not found");
      }
      
      // Verify user is a member
      if (!dao.members.includes(nostrService.publicKey)) {
        throw new Error("Only members can create kick proposals");
      }
      
      // Cannot kick the creator
      if (targetPubkey === dao.creator) {
        throw new Error("Cannot kick the DAO creator");
      }
      
      // Cannot kick yourself
      if (targetPubkey === nostrService.publicKey) {
        throw new Error("Cannot kick yourself. Use 'Leave DAO' instead.");
      }
      
      // Verify target is a member
      if (!dao.members.includes(targetPubkey)) {
        throw new Error("Target is not a member of the DAO");
      }
      
      // Calculate proposal closing time
      const now = Math.floor(Date.now() / 1000);
      const closesAt = now + (durationDays * 24 * 60 * 60);
      
      // Create proposal content with kick metadata
      const content = JSON.stringify({
        type: "kick",
        reason,
        targetPubkey
      });
      
      // Create proposal tags
      const proposalTags = [
        [DAO_TAGS.DAO_ID, daoId],
        [DAO_TAGS.PROPOSAL_TITLE, title],
        [DAO_TAGS.PROPOSAL_CLOSES, closesAt.toString()],
        [DAO_TAGS.USER, targetPubkey], // Target user
        ['client', 'blocknoster']
      ];
      
      // Add options as a single tag with multiple values
      const optionsTag = [DAO_TAGS.PROPOSAL_OPTIONS].concat(options);
      proposalTags.push(optionsTag);
      
      const event: Partial<Event> = {
        kind: DAO_KICK_PROPOSAL_KIND,
        created_at: now,
        tags: proposalTags,
        content,
        pubkey: nostrService.publicKey
      };
      
      const signedEvent = await nostrService.signEvent(event);
      if (!signedEvent) {
        throw new Error("Failed to sign event");
      }
      
      const relays = nostrService.getRelays();
      const pubs = this.pool.publish(relays, signedEvent);
      
      // Wait for confirmation from at least one relay
      await Promise.any(pubs);
      
      return signedEvent.id;
    } catch (error) {
      console.error("Error creating kick proposal:", error);
      return null;
    }
  }
  
  /**
   * Vote on a proposal
   */
  async voteOnProposal(proposalId: string, optionIndex: number): Promise<boolean> {
    if (!nostrService.publicKey) {
      throw new Error("Not logged in");
    }
    
    try {
      // Find the proposal to get its DAO ID
      const relays = nostrService.getRelays();
      const filter = { ids: [proposalId] };
      
      const events = await this.pool.list(relays, [filter]);
      if (events.length === 0) {
        throw new Error("Proposal not found");
      }
      
      const proposalEvent = events[0];
      const daoId = proposalEvent.tags.find(tag => tag[0] === DAO_TAGS.DAO_ID)?.[1];
      if (!daoId) {
        throw new Error("Invalid proposal format");
      }
      
      // Check if the user is a member
      const dao = await this.getDAOById(daoId);
      if (!dao) {
        throw new Error("DAO not found");
      }
      
      if (!dao.members.includes(nostrService.publicKey)) {
        throw new Error("Only members can vote");
      }
      
      // Create vote tags
      const voteTags = [
        [DAO_TAGS.DAO_ID, daoId],
        [DAO_TAGS.PROPOSAL_ID, proposalId],
        [DAO_TAGS.VOTE, optionIndex.toString()],
        ['client', 'blocknoster']
      ];
      
      const event: Partial<Event> = {
        kind: DAO_VOTE_KIND,
        created_at: Math.floor(Date.now() / 1000),
        tags: voteTags,
        content: "",
        pubkey: nostrService.publicKey
      };
      
      const signedEvent = await nostrService.signEvent(event);
      if (!signedEvent) {
        throw new Error("Failed to sign event");
      }
      
      const pubs = this.pool.publish(relays, signedEvent);
      
      // Wait for confirmation from at least one relay
      await Promise.any(pubs);
      
      return true;
    } catch (error) {
      console.error("Error voting on proposal:", error);
      return false;
    }
  }
  
  /**
   * Vote on a kick proposal
   */
  async voteOnKickProposal(proposalId: string, optionIndex: number): Promise<string | null> {
    if (!nostrService.publicKey) {
      throw new Error("Not logged in");
    }
    
    try {
      // Find the proposal to get its DAO ID
      const relays = nostrService.getRelays();
      const filter = { ids: [proposalId] };
      
      const events = await this.pool.list(relays, [filter]);
      if (events.length === 0) {
        throw new Error("Kick proposal not found");
      }
      
      const proposalEvent = events[0];
      const daoId = proposalEvent.tags.find(tag => tag[0] === DAO_TAGS.DAO_ID)?.[1];
      if (!daoId) {
        throw new Error("Invalid proposal format");
      }
      
      // Check if the user is a member
      const dao = await this.getDAOById(daoId);
      if (!dao) {
        throw new Error("DAO not found");
      }
      
      if (!dao.members.includes(nostrService.publicKey)) {
        throw new Error("Only members can vote");
      }
      
      // Create vote tags
      const voteTags = [
        [DAO_TAGS.DAO_ID, daoId],
        [DAO_TAGS.PROPOSAL_ID, proposalId],
        [DAO_TAGS.VOTE, optionIndex.toString()],
        ['client', 'blocknoster']
      ];
      
      const event: Partial<Event> = {
        kind: DAO_KICK_VOTE_KIND,
        created_at: Math.floor(Date.now() / 1000),
        tags: voteTags,
        content: "",
        pubkey: nostrService.publicKey
      };
      
      const signedEvent = await nostrService.signEvent(event);
      if (!signedEvent) {
        throw new Error("Failed to sign event");
      }
      
      const pubs = this.pool.publish(relays, signedEvent);
      
      // Wait for confirmation from at least one relay
      await Promise.any(pubs);
      
      return signedEvent.id;
    } catch (error) {
      console.error("Error voting on kick proposal:", error);
      return null;
    }
  }
  
  /**
   * Join a DAO
   */
  async joinDAO(daoId: string): Promise<boolean> {
    if (!nostrService.publicKey) {
      throw new Error("Not logged in");
    }
    
    try {
      // Check if DAO exists
      const dao = await this.getDAOById(daoId);
      if (!dao) {
        throw new Error("DAO not found");
      }
      
      // Check if already a member
      if (dao.members.includes(nostrService.publicKey)) {
        throw new Error("Already a member");
      }
      
      // Create join event
      const joinTags = [
        [DAO_TAGS.DAO_ID, daoId],
        [DAO_TAGS.USER, nostrService.publicKey],
        [DAO_TAGS.ACTION, 'join'],
        ['client', 'blocknoster']
      ];
      
      const event: Partial<Event> = {
        kind: DAO_MEMBER_KIND,
        created_at: Math.floor(Date.now() / 1000),
        tags: joinTags,
        content: "",
        pubkey: nostrService.publicKey
      };
      
      const signedEvent = await nostrService.signEvent(event);
      if (!signedEvent) {
        throw new Error("Failed to sign event");
      }
      
      const relays = nostrService.getRelays();
      const pubs = this.pool.publish(relays, signedEvent);
      
      // Wait for confirmation from at least one relay
      await Promise.any(pubs);
      
      // Invalidate cache
      daoCache.invalidateDAO(daoId);
      
      return true;
    } catch (error) {
      console.error("Error joining DAO:", error);
      return false;
    }
  }
  
  /**
   * Leave a DAO
   */
  async leaveDAO(daoId: string): Promise<boolean> {
    if (!nostrService.publicKey) {
      throw new Error("Not logged in");
    }
    
    try {
      // Check if DAO exists
      const dao = await this.getDAOById(daoId);
      if (!dao) {
        throw new Error("DAO not found");
      }
      
      // Check if a member
      if (!dao.members.includes(nostrService.publicKey)) {
        throw new Error("Not a member");
      }
      
      // Creator cannot leave their own DAO
      if (dao.creator === nostrService.publicKey) {
        throw new Error("Creator cannot leave their own DAO. You may delete it instead.");
      }
      
      // Create leave event
      const leaveTags = [
        [DAO_TAGS.DAO_ID, daoId],
        [DAO_TAGS.USER, nostrService.publicKey],
        [DAO_TAGS.ACTION, 'leave'],
        ['client', 'blocknoster']
      ];
      
      const event: Partial<Event> = {
        kind: DAO_MEMBER_KIND,
        created_at: Math.floor(Date.now() / 1000),
        tags: leaveTags,
        content: "",
        pubkey: nostrService.publicKey
      };
      
      const signedEvent = await nostrService.signEvent(event);
      if (!signedEvent) {
        throw new Error("Failed to sign event");
      }
      
      const relays = nostrService.getRelays();
      const pubs = this.pool.publish(relays, signedEvent);
      
      // Wait for confirmation from at least one relay
      await Promise.any(pubs);
      
      // Invalidate cache
      daoCache.invalidateDAO(daoId);
      
      return true;
    } catch (error) {
      console.error("Error leaving DAO:", error);
      throw error; // Rethrow to propagate error message
    }
  }
  
  /**
   * Delete a DAO (creator only)
   */
  async deleteDAO(daoId: string): Promise<boolean> {
    if (!nostrService.publicKey) {
      throw new Error("Not logged in");
    }
    
    try {
      // Check if DAO exists
      const dao = await this.getDAOById(daoId);
      if (!dao) {
        throw new Error("DAO not found");
      }
      
      // Verify user is the creator
      if (dao.creator !== nostrService.publicKey) {
        throw new Error("Only the creator can delete a DAO");
      }
      
      // Create delete event
      const deleteTags = [
        [DAO_TAGS.DAO_ID, daoId],
        ['client', 'blocknoster']
      ];
      
      const event: Partial<Event> = {
        kind: DAO_DELETE_KIND,
        created_at: Math.floor(Date.now() / 1000),
        tags: deleteTags,
        content: "",
        pubkey: nostrService.publicKey
      };
      
      const signedEvent = await nostrService.signEvent(event);
      if (!signedEvent) {
        throw new Error("Failed to sign event");
      }
      
      const relays = nostrService.getRelays();
      const pubs = this.pool.publish(relays, signedEvent);
      
      // Wait for confirmation from at least one relay
      await Promise.any(pubs);
      
      // Invalidate cache
      daoCache.invalidateDAO(daoId);
      daoCache.invalidateUserDAOs(nostrService.publicKey);
      daoCache.invalidateTrendingDAOs();
      daoCache.invalidateAllDAOs();
      
      return true;
    } catch (error) {
      console.error("Error deleting DAO:", error);
      throw error; // Rethrow to propagate error message
    }
  }
  
  /**
   * Create an invite link for a DAO
   */
  async createDAOInvite(daoId: string): Promise<string | null> {
    if (!nostrService.publicKey) {
      throw new Error("Not logged in");
    }
    
    try {
      // Check if DAO exists
      const dao = await this.getDAOById(daoId);
      if (!dao) {
        throw new Error("DAO not found");
      }
      
      // Check if the user has permission (creator or moderator)
      const isCreator = dao.creator === nostrService.publicKey;
      const isModerator = dao.moderators.includes(nostrService.publicKey);
      
      if (!isCreator && !isModerator) {
        throw new Error("Only creators and moderators can create invite links");
      }
      
      // Generate a unique invite ID
      const inviteId = utils.randomId();
      
      // Create invite event
      const inviteTags = [
        [DAO_TAGS.DAO_ID, daoId],
        [DAO_TAGS.INVITE_ID, inviteId],
        ['client', 'blocknoster']
      ];
      
      const event: Partial<Event> = {
        kind: DAO_INVITE_KIND,
        created_at: Math.floor(Date.now() / 1000),
        tags: inviteTags,
        content: "",
        pubkey: nostrService.publicKey
      };
      
      const signedEvent = await nostrService.signEvent(event);
      if (!signedEvent) {
        throw new Error("Failed to sign event");
      }
      
      const relays = nostrService.getRelays();
      const pubs = this.pool.publish(relays, signedEvent);
      
      // Wait for confirmation from at least one relay
      await Promise.any(pubs);
      
      return inviteId;
    } catch (error) {
      console.error("Error creating DAO invite:", error);
      return null;
    }
  }
}

// Export a singleton instance
export const daoService = new DAOService();
