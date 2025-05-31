import { SimplePool, Filter, Event, nip19 } from 'nostr-tools';
import { DAO, DAOProposal, CommunityPost, PostApproval, PendingPost, PostRejection, RejectedPost, ModerationAction, MemberBan, ContentReport, ModerationLogEntry } from '@/api/types/dao';
import { nostrService } from '@/lib/nostr';
import { 
  cacheAllDAOsLongTerm, 
  getCachedAllDAOs, 
  cacheUserDAOsLongTerm, 
  getCachedUserDAOs,
  cacheTrendingDAOs,
  getCachedTrendingDAOs,
  cacheDAO,
  getCachedDAO,
  cacheDAOProposals,
  getCachedDAOProposals,
  getUserDAOsCacheAge,
  invalidateUserDAOsCache,
  cacheKickProposals,
  getCachedKickProposals,
  clearAllDAOCache
} from './dao-cache';

// Type declaration for window.nostr
declare global {
  interface Window {
    nostr?: {
      getPublicKey(): Promise<string>;
      signEvent(event: any): Promise<any>;
      nip04?: {
        encrypt(pubkey: string, plaintext: string): Promise<string>;
        decrypt(pubkey: string, ciphertext: string): Promise<string>;
      };
    };
  }
}

// NIP-72 kind numbers (ensure full compliance)
const DAO_KINDS = {
  COMMUNITY: 34550,       // Community definition
  PROPOSAL: 34551,        // Community proposal
  VOTE: 34552,           // Vote on a proposal
  METADATA: 34553,       // Community metadata (guidelines, etc)
  MODERATION: 34554,      // Moderation events (kick, ban)
  INVITE: 34555,         // Invite to private community
  POST_APPROVAL: 4550,   // Post approval by moderators (NIP-72)
  POST_REJECTION: 4551,  // Post rejection by moderators (enhanced)
  MODERATION_LOG: 4552,  // Moderation action logging
  CONTENT_REPORT: 4553,  // Content reporting by users
  MEMBER_BAN: 4554,      // Member ban/unban actions
};

/**
 * Service for interacting with DAOs using NIP-72
 */
export class DAOService {
  private pool: SimplePool;
  private relays: string[];
  private fastRelays: string[]; // Subset of faster, more reliable relays
  
  constructor() {
    this.pool = new SimplePool();
    // Add NIP-72 compatible relays that support community events
    this.relays = [
      "wss://relay.damus.io",      // General purpose but reliable and free
      "wss://relay.nostr.band",    // Known to support communities, free
      "wss://nos.lol",             // Community-friendly, free
      "wss://offchain.pub",        // Alternative relay, free
      "wss://nostr.wine",          // European relay, free
      "wss://relay.snort.social",  // Social features, free
      "wss://purplepag.es",        // Community-focused relay, free
      "wss://relay.blocknostr.com" // BlockNostr relay
    ];
    
    // Community-specific relays for publishing (these are known to accept community events)
    // Fast and reliable free relays prioritized
    this.fastRelays = [
      "wss://relay.damus.io",      // Most reliable free relay
      "wss://relay.nostr.band",    // Best for communities, free
      "wss://nos.lol",             // Community-friendly, free
      "wss://offchain.pub",        // Alternative for communities, free
      "wss://relay.blocknostr.com" // BlockNostr relay
    ];
  }

  /**
   * Safe query method that properly handles subscription cleanup
   */
  private async safeQuery(relays: string[], filter: Filter, timeout: number = 3000): Promise<Event[]> {
    return new Promise((resolve) => {
      const events: Event[] = [];
      let isResolved = false;
      let hasReceivedEvents = false;
      
      try {
        const sub = this.pool.subscribeMany(relays, [filter], {
          onevent: (event) => {
            if (!isResolved) {
              events.push(event);
              hasReceivedEvents = true;
              
              // For single event queries (like getDAOById), resolve immediately after first event
              if (filter.limit === 1 && events.length === 1) {
                isResolved = true;
                sub.close();
                resolve(events);
              }
            }
          },
          oneose: () => {
            if (!isResolved) {
              isResolved = true;
              sub.close();
              resolve(events);
            }
          },
          onclose: () => {
            if (!isResolved) {
              isResolved = true;
              resolve(events);
            }
          }
        });

        // Adaptive timeout: shorter for single events, longer for multiple
        const adaptiveTimeout = filter.limit === 1 ? Math.min(timeout, 2000) : timeout;
        
        // Fallback timeout to prevent hanging
        setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            try {
              sub.close();
            } catch (error) {
              console.warn('Error closing subscription:', error);
            }
            resolve(events);
          }
        }, adaptiveTimeout);
      } catch (error) {
        console.error('Error in safeQuery:', error);
        resolve([]);
      }
    });
  }
  
  /**
   * Get list of DAOs/communities
   */
  async getDAOs(limit: number = 20): Promise<DAO[]> {
    try {
      // Try to get from cache first
      const cachedDAOs = getCachedAllDAOs();
      if (cachedDAOs) {
        console.log("Using cached DAOs");
        // Fetch fresh data in the background to update cache
        this.refreshDAOs(limit);
        return cachedDAOs.filter(dao => dao.name !== "Unnamed DAO" && dao.name.trim() !== "");
      }
      
      const filter: Filter = {
        kinds: [DAO_KINDS.COMMUNITY],
        limit: limit
      };
      
      console.log("Fetching DAOs with filter:", filter);
      console.log("Using fast relays:", this.fastRelays);
      
      // Use fast relays for initial load
      const events = await this.safeQuery(this.fastRelays, filter);
      console.log("Received DAO events:", events.length);
      
      const daos = events
        .map(event => this.parseDaoEvent(event))
        .filter((dao): dao is DAO => dao !== null);
      
      // Cache the results with timestamp tracking
      cacheAllDAOsLongTerm(daos);
      
      return daos;
    } catch (error) {
      console.error("Error fetching DAOs:", error);
      return [];
    }
  }
  
  /**
   * Background refresh of DAOs to update cache
   */
  private async refreshDAOs(limit: number = 20): Promise<void> {
    try {
      const filter: Filter = {
        kinds: [DAO_KINDS.COMMUNITY],
        limit: limit
      };
      
      // Use all relays for complete refresh
      const events = await this.pool.querySync(this.relays, filter);
      
      const daos = events
        .map(event => this.parseDaoEvent(event))
        .filter((dao): dao is DAO => dao !== null);
      
      // Cache the results with timestamp tracking
      cacheAllDAOsLongTerm(daos);
    } catch (error) {
      console.error("Error refreshing DAOs:", error);
    }
  }
  
  /**
   * Get DAOs that a user is a member of
   */
  async getUserDAOs(pubkey: string, limit: number = 20, forceRefresh: boolean = false): Promise<DAO[]> {
    if (!pubkey) return [];
    
    try {
      // Check for force refresh
      if (forceRefresh) {
        invalidateUserDAOsCache(pubkey);
      }
      
      // Try to get from cache first (now with indefinite TTL)
      const cachedUserDAOs = getCachedUserDAOs(pubkey);
      if (cachedUserDAOs && !forceRefresh) {
        const cacheAge = getUserDAOsCacheAge(pubkey) || 0;
        console.log(`Using cached DAOs for user ${pubkey} (cached ${Math.round(cacheAge / 1000 / 60)} minutes ago)`);
        
        // Fetch fresh data in the background if cache is getting old (but still serve cached)
        if (cacheAge > 10 * 60 * 1000) { // 10 minutes
          this.refreshUserDAOs(pubkey, limit);
        }
        
        return cachedUserDAOs;
      }
      
      const filter: Filter = {
        kinds: [DAO_KINDS.COMMUNITY],
        '#p': [pubkey],
        limit: limit
      };
      
      console.log(`Fetching DAOs for user ${pubkey}`);
      const events = await this.pool.querySync(this.fastRelays, filter);
      console.log(`Received ${events.length} user DAO events`);
      
      const daos = events
        .map(event => this.parseDaoEvent(event))
        .filter((dao): dao is DAO => dao !== null);
      
      // Cache with indefinite TTL for instant loading next time
      cacheUserDAOsLongTerm(pubkey, daos);
      
      return daos;
    } catch (error) {
      console.error("Error fetching user DAOs:", error);
      return [];
    }
  }
  
  /**
   * Background refresh of user DAOs
   */
  private async refreshUserDAOs(pubkey: string, limit: number = 20): Promise<void> {
    try {
      const filter: Filter = {
        kinds: [DAO_KINDS.COMMUNITY],
        '#p': [pubkey],
        limit: limit
      };
      
      console.log(`Background refreshing user DAOs for ${pubkey}`);
      const events = await this.pool.querySync(this.relays, filter);
      
      const daos = events
        .map(event => this.parseDaoEvent(event))
        .filter((dao): dao is DAO => dao !== null);
      
      // Update cache with fresh data using indefinite TTL
      cacheUserDAOsLongTerm(pubkey, daos);
      console.log(`Background refresh completed: ${daos.length} user DAOs updated`);
    } catch (error) {
      console.error(`Error refreshing user DAOs for ${pubkey}:`, error);
    }
  }
  
  /**
   * Get trending DAOs based on member count
   */
  async getTrendingDAOs(limit: number = 20): Promise<DAO[]> {
    // Try to get from cache first
    const cachedTrending = getCachedTrendingDAOs();
    if (cachedTrending) {
      console.log("Using cached trending DAOs");
      return cachedTrending;
    }
    
    const daos = await this.getDAOs(limit * 2);
    const trending = daos
      .sort((a, b) => b.members.length - a.members.length)
      .slice(0, limit);
      
    // Cache trending results
    cacheTrendingDAOs(trending);
    
    return trending;
  }
  
  /**
   * Get a single DAO by ID
   */
  async getDAOById(id: string): Promise<DAO | null> {
    try {
      // Check cache first
      const cachedDAO = getCachedDAO(id);
      if (cachedDAO) {
        console.log(`Using cached DAO with ID: ${id}`);
        // Refresh in background (non-blocking)
        this.refreshDAOById(id);
        return cachedDAO;
      }
      
      console.log(`Fetching DAO with ID: ${id}`);
      
      const filter: Filter = {
        kinds: [DAO_KINDS.COMMUNITY],
        ids: [id],
        limit: 1
      };
      
      // Use faster timeout for individual DAO fetch (2 seconds instead of 5)
      const events = await this.safeQuery(this.fastRelays, filter, 2000);
      
      if (events.length === 0) {
        console.log(`No DAO found with ID: ${id}, trying all relays`);
        // Fallback to all relays with slightly longer timeout
        const fallbackEvents = await this.safeQuery(this.relays, filter, 3000);
        if (fallbackEvents.length === 0) {
          console.log(`DAO not found on any relay: ${id}`);
          return null;
        }
        const dao = this.parseDaoEvent(fallbackEvents[0]);
        if (dao) {
          cacheDAO(id, dao);
        }
        return dao;
      }
      
      const dao = this.parseDaoEvent(events[0]);
      
      // Cache the result
      if (dao) {
        cacheDAO(id, dao);
      }
      
      return dao;
    } catch (error) {
      console.error(`Error fetching DAO ${id}:`, error);
      return null;
    }
  }
  
  /**
   * Background refresh of a single DAO
   */
  private async refreshDAOById(id: string): Promise<void> {
    try {
      const filter: Filter = {
        kinds: [DAO_KINDS.COMMUNITY],
        ids: [id],
        limit: 1
      };
      
      const events = await this.pool.querySync(this.relays, filter);
      
      if (events.length > 0) {
        const dao = this.parseDaoEvent(events[0]);
        if (dao) {
          cacheDAO(id, dao);
        }
      }
    } catch (error) {
      console.error(`Error refreshing DAO ${id}:`, error);
    }
  }
  
  /**
   * Get DAO proposals
   */
  async getDAOProposals(daoId: string): Promise<DAOProposal[]> {
    try {
      // Try to get from cache first
      const cachedProposals = getCachedDAOProposals(daoId);
      if (cachedProposals) {
        console.log(`Using cached proposals for DAO: ${daoId}`);
        return cachedProposals;
      }
      
      const filter: Filter = {
        kinds: [DAO_KINDS.PROPOSAL],
        '#e': [daoId],
        limit: 50
      };
      
      console.log(`Fetching proposals for DAO: ${daoId}`);
      const events = await this.safeQuery(this.fastRelays, filter);
      console.log(`Found ${events.length} proposals for DAO ${daoId}`);
      
      const proposals = events
        .map(event => this.parseProposalEvent(event, daoId))
        .filter((proposal): proposal is DAOProposal => proposal !== null);
        
      // Fetch votes for each proposal
      const votesPromises = proposals.map(proposal => this.getVotesForProposal(proposal.id));
      const votesResults = await Promise.all(votesPromises);
      
      // Merge votes into proposals
      const proposalsWithVotes = proposals.map((proposal, index) => ({
        ...proposal,
        votes: votesResults[index]
      }));
      
      // Cache results with updated proposals that include votes
      cacheDAOProposals(daoId, proposalsWithVotes);
      
      return proposalsWithVotes;
    } catch (error) {
      console.error(`Error fetching proposals for DAO ${daoId}:`, error);
      return [];
    }
  }
  
  /**
   * Background refresh of DAO proposals
   */
  private async refreshDAOProposals(daoId: string): Promise<void> {
    try {
      const filter: Filter = {
        kinds: [DAO_KINDS.PROPOSAL],
        '#e': [daoId],
        limit: 50
      };
      
      const events = await this.pool.querySync(this.relays, filter);
      
      const proposals = events
        .map(event => this.parseProposalEvent(event, daoId))
        .filter((proposal): proposal is DAOProposal => proposal !== null);
        
      // Only fetch votes for active proposals to save bandwidth
      const activeProposals = proposals.filter(p => p.status === "active");
      const votesPromises = activeProposals.map(proposal => this.getVotesForProposal(proposal.id));
      const votesResults = await Promise.all(votesPromises);
      
      // Update only active proposals with votes
      activeProposals.forEach((proposal, index) => {
        proposal.votes = votesResults[index];
      });
      
      // For non-active proposals, keep existing votes or use empty object
      const allProposalsWithVotes = proposals.map(proposal => {
        if (proposal.status !== "active") {
          const existingProposal = getCachedDAOProposals(daoId)?.find(p => p.id === proposal.id);
          return {
            ...proposal,
            votes: existingProposal?.votes || {}
          };
        }
        return proposal;
      });
      
      // Cache the updated result
      cacheDAOProposals(daoId, allProposalsWithVotes);
    } catch (error) {
      console.error(`Error refreshing proposals for DAO ${daoId}:`, error);
    }
  }
  
  /**
   * Get votes for a specific proposal
   */
  async getVotesForProposal(proposalId: string): Promise<Record<string, number>> {
    try {
      const filter: Filter = {
        kinds: [DAO_KINDS.VOTE],
        '#e': [proposalId],
        limit: 200
      };
      
      const events = await this.safeQuery(this.relays, filter);
      console.log(`Found ${events.length} votes for proposal ${proposalId}`);
      
      const votes: Record<string, number> = {};
      
      for (const event of events) {
        try {
          // Handle both JSON and non-JSON vote formats (for compatibility)
          let optionIndex: number;
          
          if (event.content.startsWith('{')) {
            const content = JSON.parse(event.content);
            optionIndex = content.optionIndex;
          } else {
            // Simple format where content is just the option index
            optionIndex = parseInt(event.content.trim());
          }
          
          if (!isNaN(optionIndex) && event.pubkey) {
            votes[event.pubkey] = optionIndex;
          }
        } catch (e) {
          console.error("Error parsing vote content:", e, "Content:", event.content);
        }
      }
      
      return votes;
    } catch (error) {
      console.error(`Error fetching votes for proposal ${proposalId}:`, error);
      return {};
    }
  }
  
  /**
   * Create a new DAO/community
   */
  async createDAO(name: string, description: string, tags: string[] = [], avatar?: string, banner?: string): Promise<string | null> {
    try {
      // Get the user's pubkey from the Nostr service
      const pubkey = nostrService.publicKey;
      if (!pubkey) {
        throw new Error("User not authenticated");
      }
      
      // Validate name - prevent empty names
      const trimmedName = name.trim();
      if (!trimmedName) {
        console.error("DAO creation failed: Name cannot be empty");
        throw new Error("DAO name cannot be empty");
      }
      
      console.log(`Creating DAO: ${trimmedName} with creator ${pubkey}`);
      
      // Generate a unique identifier for the DAO
      const uniqueId = `dao_${Math.random().toString(36).substring(2, 10)}`;
      
      const communityData = {
        name: trimmedName, // Use trimmed name
        description,
        creator: pubkey,
        createdAt: Math.floor(Date.now() / 1000),
        image: avatar || "", // Use avatar as primary image (legacy field)
        avatar: avatar || "", // Community avatar/logo URL
        banner: banner || "", // Community banner image URL
        treasury: {
          balance: 0,
          tokenSymbol: "ALPH"
        },
        proposals: 0,
        activeProposals: 0,
        tags: tags
      };
      
      // NIP-72 compliant community event
      const eventData = {
        kind: DAO_KINDS.COMMUNITY,
        content: JSON.stringify(communityData),
        tags: [
          ["d", uniqueId], // Unique identifier as required by NIP-72
          ["p", pubkey] // Creator is the first member
        ]
      };
      
      console.log("Publishing DAO event:", eventData);
      
      // Use dedicated community relays for publishing
      const eventId = await this.publishCommunityEvent(eventData);
      console.log("DAO created with ID:", eventId);
      
      if (eventId && pubkey) {
              invalidateUserDAOsCache(pubkey);
      setTimeout(() => clearAllDAOCache(), 1000); // Clear all DAO caches after a delay
      }
      
      return eventId;
    } catch (error) {
      console.error("Error creating DAO:", error);
      return null;
    }
  }
  
  /**
   * Create a proposal for a DAO
   */
  async createProposal(
    daoId: string,
    title: string,
    description: string,
    options: string[],
    durationDays: number = 7
  ): Promise<string | null> {
    try {
      const pubkey = nostrService.publicKey;
      if (!pubkey) {
        throw new Error("User not authenticated");
      }
      
      const now = Math.floor(Date.now() / 1000);
      const endsAt = now + (durationDays * 24 * 60 * 60); // Convert days to seconds
      
      const proposalData = {
        title,
        description,
        options,
        createdAt: now,
        endsAt: endsAt,
      };
      
      // Generate a unique identifier for the proposal
      const uniqueId = `proposal_${Math.random().toString(36).substring(2, 10)}`;
      
      // NIP-72 compliant proposal event
      const eventData = {
        kind: DAO_KINDS.PROPOSAL,
        content: JSON.stringify(proposalData),
        tags: [
          ["e", daoId], // Reference to DAO/community event
          ["d", uniqueId] // Unique identifier
        ]
      };
      
      console.log("Publishing proposal event:", eventData);
      
      const eventId = await nostrService.publishEvent(eventData);
      console.log("Proposal created with ID:", eventId);
      
      // If successful, immediately invalidate the cache for proposals
      if (eventId) {
        // Construct a basic proposal object to add to the cache temporarily 
        // until a full refresh happens
        const newProposal: DAOProposal = {
          id: eventId,
          daoId: daoId,
          title: title,
          description: description,
          options: options,
          createdAt: now,
          endsAt: endsAt,
          creator: pubkey,
          votes: {},
          status: "active" as "active" | "passed" | "rejected" | "canceled"
        };
        
        // Get existing cached proposals or empty array
        const existingProposals = getCachedDAOProposals(daoId) || [];
        
        // Add the new proposal to the beginning of the array
        // This ensures we preserve all existing proposals rather than replacing them
        cacheDAOProposals(daoId, [newProposal, ...existingProposals]);
      }
      
      return eventId;
    } catch (error) {
      console.error("Error creating proposal:", error);
      return null;
    }
  }
  
  /**
   * Vote on a proposal
   */
  async voteOnProposal(proposalId: string, optionIndex: number): Promise<string | null> {
    try {
      const pubkey = nostrService.publicKey;
      if (!pubkey) {
        throw new Error("User not authenticated");
      }
      
      // Validate inputs
      if (!proposalId || typeof proposalId !== 'string' || proposalId.trim() === '') {
        throw new Error(`Invalid proposal ID: ${proposalId}`);
      }
      
      if (typeof optionIndex !== 'number' || optionIndex < 0 || !Number.isInteger(optionIndex)) {
        throw new Error(`Invalid option index: ${optionIndex}`);
      }
      
      // NIP-72 compliant vote event with all required properties
      const eventData = {
        kind: DAO_KINDS.VOTE,
        content: String(optionIndex), // Simple string content instead of JSON
        tags: [
          ["e", proposalId], // Reference to proposal event
          ["p", pubkey] // Include voter's pubkey in tags for better indexing
        ],
        created_at: Math.floor(Date.now() / 1000),
        pubkey: pubkey
      };
      
      console.log("Publishing vote event:", {
        kind: eventData.kind,
        content: eventData.content,
        tags: eventData.tags,
        proposalId
      });
      
      const eventId = await nostrService.publishEvent(eventData);
      console.log("Vote recorded with ID:", eventId);
      
      return eventId;
    } catch (error) {
      console.error("Error voting on proposal:", error);
      return null;
    }
  }
  
  /**
   * Join a DAO/community
   */
  async joinDAO(daoId: string): Promise<boolean> {
    try {
      // First fetch the DAO to get current data
      const dao = await this.getDAOById(daoId);
      if (!dao) {
        console.error("DAO not found:", daoId);
        throw new Error("DAO not found");
      }
      
      const pubkey = nostrService.publicKey;
      if (!pubkey) {
        throw new Error("User not authenticated");
      }
      
      console.log(`User ${pubkey} joining DAO ${daoId}`);
      
      // Check if already a member
      if (dao.members.includes(pubkey)) {
        console.log("Already a member of this DAO");
        return true;
      }
      
      // Extract the unique identifier from d tag if available
      let uniqueId = daoId;
      const event = await this.getDAOEventById(daoId);
      if (event) {
        const dTag = event.tags.find(tag => tag[0] === 'd');
        if (dTag && dTag[1]) {
          uniqueId = dTag[1];
        }
      }
      
      // Create updated member list including the current user
      const members = [...dao.members, pubkey];
      
      // Create a new community event with the same uniqueId
      // This follows NIP-72 replacement approach
      const updatedData = {
        name: dao.name,
        description: dao.description,
        creator: dao.creator,
        createdAt: dao.createdAt,
        image: dao.image,
        treasury: dao.treasury,
        proposals: dao.proposals,
        activeProposals: dao.activeProposals,
        tags: dao.tags
      };
      
      // NIP-72 compliant event for joining
      const eventData = {
        kind: DAO_KINDS.COMMUNITY,
        content: JSON.stringify(updatedData),
        tags: [
          ["d", uniqueId], // Same unique identifier
          ...members.map(member => ["p", member]) // Include all members
        ]
      };
      
      console.log("Publishing join DAO event:", eventData);
      
      await nostrService.publishEvent(eventData);
      console.log(`Successfully joined DAO ${daoId}`);
      
      return true;
    } catch (error) {
      console.error("Error joining DAO:", error);
      return false;
    }
  }
  
  /**
   * Update DAO metadata (privacy, guidelines, tags)
   */
  async updateDAOMetadata(daoId: string, metadata: {
    type: string;
    content?: any;
    isPrivate?: boolean;
  }): Promise<boolean> {
    try {
      // Get the current DAO data
      const dao = await this.getDAOById(daoId);
      if (!dao) {
        console.error("DAO not found:", daoId);
        return false;
      }
      
      const pubkey = nostrService.publicKey;
      if (!pubkey) {
        throw new Error("User not authenticated");
      }
      
      // Only the creator can update metadata
      if (dao.creator !== pubkey) {
        throw new Error("Only the DAO creator can update metadata");
      }
      
      console.log(`Updating DAO metadata for ${daoId}, type: ${metadata.type}`);
      
      // Create updated data based on metadata type
      let updatedData = { ...dao };
      
      switch (metadata.type) {
        case "privacy":
          updatedData.isPrivate = metadata.isPrivate;
          break;
        case "guidelines":
          updatedData.guidelines = metadata.content;
          break;
        case "tags":
          updatedData.tags = metadata.content;
          break;
        default:
          throw new Error("Unknown metadata type");
      }
      
      // Get the original unique identifier if available
      let uniqueId = daoId;
      const event = await this.getDAOEventById(daoId);
      if (event) {
        const dTag = event.tags.find(tag => tag[0] === 'd');
        if (dTag && dTag[1]) {
          uniqueId = dTag[1];
        }
      }
      
      // NIP-72 compliant event for metadata update
      const eventData = {
        kind: DAO_KINDS.METADATA,
        content: JSON.stringify({ 
          type: metadata.type,
          content: metadata.content,
          isPrivate: metadata.isPrivate,
          updatedAt: Math.floor(Date.now() / 1000)
        }),
        tags: [
          ["e", daoId], // Reference to DAO
          ["d", uniqueId]
        ]
      };
      
      console.log("Publishing DAO metadata event:", eventData);
      await nostrService.publishEvent(eventData);
      
      // Also update the main DAO definition with the changes for clients that don't follow the metadata events
      // This ensures backwards compatibility
      const mainEventData = {
        kind: DAO_KINDS.COMMUNITY,
        content: JSON.stringify({
          name: dao.name,
          description: dao.description,
          creator: dao.creator,
          createdAt: dao.createdAt,
          image: dao.image,
          guidelines: metadata.type === "guidelines" ? metadata.content : dao.guidelines,
          isPrivate: metadata.type === "privacy" ? metadata.isPrivate : dao.isPrivate,
          treasury: dao.treasury,
          proposals: dao.proposals,
          activeProposals: dao.activeProposals,
          tags: metadata.type === "tags" ? metadata.content : dao.tags
        }),
        tags: [
          ["d", uniqueId],
          ...dao.members.map(member => ["p", member]),
          ...dao.moderators.map(mod => ["p", mod, "moderator"])
        ]
      };
      
      await nostrService.publishEvent(mainEventData);
      
      console.log(`Successfully updated DAO ${daoId} metadata`);
      return true;
    } catch (error) {
      console.error("Error updating DAO metadata:", error);
      return false;
    }
  }
  
  /**
   * Update DAO roles (add/remove moderators)
   */
  async updateDAORoles(daoId: string, update: {
    role: string;
    action: "add" | "remove";
    pubkey: string;
  }): Promise<boolean> {
    try {
      // Get the current DAO data
      const dao = await this.getDAOById(daoId);
      if (!dao) {
        console.error("DAO not found:", daoId);
        return false;
      }
      
      const pubkey = nostrService.publicKey;
      if (!pubkey) {
        throw new Error("User not authenticated");
      }
      
      // Only the creator can update roles
      if (dao.creator !== pubkey) {
        throw new Error("Only the DAO creator can update roles");
      }
      
      console.log(`Updating DAO role for ${daoId}, ${update.action} ${update.role}: ${update.pubkey}`);
      
      // Update the moderators list
      let moderators = [...dao.moderators];
      
      if (update.role === "moderator") {
        if (update.action === "add" && !moderators.includes(update.pubkey)) {
          moderators.push(update.pubkey);
        } else if (update.action === "remove") {
          moderators = moderators.filter(mod => mod !== update.pubkey);
        }
      }
      
      // Get the original unique identifier if available
      let uniqueId = daoId;
      const event = await this.getDAOEventById(daoId);
      if (event) {
        const dTag = event.tags.find(tag => tag[0] === 'd');
        if (dTag && dTag[1]) {
          uniqueId = dTag[1];
        }
      }
      
      // NIP-72 compliant event for role update
      const eventData = {
        kind: DAO_KINDS.MODERATION,
        content: JSON.stringify({ 
          role: update.role,
          action: update.action,
          updatedAt: Math.floor(Date.now() / 1000)
        }),
        tags: [
          ["e", daoId], // Reference to DAO
          ["p", update.pubkey, update.role] // Target pubkey with role
        ]
      };
      
      console.log("Publishing DAO role event:", eventData);
      await nostrService.publishEvent(eventData);
      
      // Also update the main DAO definition with the new moderators
      // This ensures backwards compatibility
      const mainEventData = {
        kind: DAO_KINDS.COMMUNITY,
        content: JSON.stringify({
          name: dao.name,
          description: dao.description,
          creator: dao.creator,
          createdAt: dao.createdAt,
          image: dao.image,
          guidelines: dao.guidelines,
          isPrivate: dao.isPrivate,
          treasury: dao.treasury,
          proposals: dao.proposals,
          activeProposals: dao.activeProposals,
          tags: dao.tags
        }),
        tags: [
          ["d", uniqueId],
          ...dao.members.map(member => ["p", member]),
          ...moderators.map(mod => ["p", mod, "moderator"])
        ]
      };
      
      await nostrService.publishEvent(mainEventData);
      
      console.log(`Successfully updated DAO ${daoId} roles`);
      return true;
    } catch (error) {
      console.error("Error updating DAO roles:", error);
      return false;
    }
  }
  
  /**
   * Create invite link for a DAO
   */
  async createDAOInvite(daoId: string, expiresIn?: number, maxUses?: number): Promise<string | null> {
    try {
      const dao = await this.getDAOById(daoId);
      if (!dao) {
        console.error("DAO not found:", daoId);
        return null;
      }
      
      const pubkey = nostrService.publicKey;
      if (!pubkey) {
        throw new Error("User not authenticated");
      }
      
      // Check if user is creator or moderator
      if (dao.creator !== pubkey && !dao.moderators.includes(pubkey)) {
        throw new Error("Only creator or moderators can create invites");
      }
      
      const now = Math.floor(Date.now() / 1000);
      const inviteData = {
        daoId,
        createdAt: now,
        creatorPubkey: pubkey,
        expiresAt: expiresIn ? now + expiresIn : undefined,
        maxUses,
        usedCount: 0
      };
      
      // Create a unique identifier for this invite
      const uniqueId = `invite_${Math.random().toString(36).substring(2, 10)}`;
      
      // NIP-72 compliant event for invitation
      const eventData = {
        kind: DAO_KINDS.INVITE,
        content: JSON.stringify(inviteData),
        tags: [
          ["e", daoId], // Reference to DAO
          ["d", uniqueId] // Unique identifier for this invite
        ]
      };
      
      console.log("Publishing DAO invite event:", eventData);
      const inviteId = await nostrService.publishEvent(eventData);
      
      if (inviteId) {
        console.log(`Successfully created DAO invite ${inviteId}`);
        return inviteId;
      } else {
        throw new Error("Failed to publish invite event");
      }
    } catch (error) {
      console.error("Error creating DAO invite:", error);
      return null;
    }
  }
  
  /**
   * Create a kick proposal
   */
  async createKickProposal(
    daoId: string,
    title: string,
    description: string,
    options: string[],
    memberToKick: string,
    durationDays: number = 7
  ): Promise<string | null> {
    try {
      const pubkey = nostrService.publicKey;
      if (!pubkey) {
        throw new Error("User not authenticated");
      }
      
      const dao = await this.getDAOById(daoId);
      if (!dao) {
        throw new Error("DAO not found");
      }
      
      // Check if the target is a member
      if (!dao.members.includes(memberToKick)) {
        throw new Error("Target is not a member of the DAO");
      }
      
      // Check if the target is the creator (who cannot be kicked)
      if (memberToKick === dao.creator) {
        throw new Error("The creator cannot be kicked from the DAO");
      }
      
      // Check if the initiator is a member
      if (!dao.members.includes(pubkey)) {
        throw new Error("Only members can propose kicks");
      }
      
      const now = Math.floor(Date.now() / 1000);
      const endsAt = now + (durationDays * 24 * 60 * 60); // Convert days to seconds
      
      // Prepare proposal data - include kick metadata
      const proposalData = {
        title,
        description,
        options,
        createdAt: now,
        endsAt: endsAt,
        type: "kick",
        targetPubkey: memberToKick
      };
      
      // Generate a unique identifier for the proposal
      const uniqueId = `kickproposal_${Math.random().toString(36).substring(2, 10)}`;
      
      // NIP-72 compliant proposal event with kick metadata
      const eventData = {
        kind: DAO_KINDS.PROPOSAL,
        content: JSON.stringify(proposalData),
        tags: [
          ["e", daoId], // Reference to DAO/community event
          ["d", uniqueId], // Unique identifier
          ["p", memberToKick, "kick"] // Tag the target user with kick action
        ]
      };
      
      console.log("Publishing kick proposal event:", eventData);
      
      const eventId = await nostrService.publishEvent(eventData);
      console.log("Kick proposal created with ID:", eventId);
      
      return eventId;
    } catch (error) {
      console.error("Error creating kick proposal:", error);
      return null;
    }
  }
  
  /**
   * Check if a kick proposal has passed (>51% voted yes)
   * and execute kick if necessary
   */
  async checkAndExecuteKickProposal(proposal: DAOProposal): Promise<boolean> {
    try {
      // Parse the proposal content to get kick metadata
      const content = JSON.parse(proposal.description);
      if (content.type !== "kick" || !content.targetPubkey) {
        return false; // Not a kick proposal
      }
      
      const memberToKick = content.targetPubkey;
      
      // Get total votes
      const totalVotes = Object.keys(proposal.votes).length;
      if (totalVotes === 0) return false;
      
      // Count yes votes (option 0)
      const yesVotes = Object.values(proposal.votes).filter(vote => vote === 0).length;
      
      // Calculate percentage
      const yesPercentage = (yesVotes / totalVotes) * 100;
      
      console.log(`Kick proposal for ${memberToKick}: ${yesPercentage}% voted yes`);
      
      // If >51% voted yes, execute the kick
      if (yesPercentage > 51) {
        console.log(`Executing kick for ${memberToKick}`);
        return await this.kickMember(proposal.daoId, memberToKick);
      }
      
      return false;
    } catch (error) {
      console.error("Error checking kick proposal:", error);
      return false;
    }
  }
  
  /**
   * Kick a member from the DAO
   */
  private async kickMember(daoId: string, memberToKick: string): Promise<boolean> {
    try {
      const dao = await this.getDAOById(daoId);
      if (!dao) return false;
      
      const pubkey = nostrService.publicKey;
      if (!pubkey) return false;
      
      // Only creator, moderators, or kick proposals can kick members
      const isCreatorOrMod = dao.creator === pubkey || dao.moderators.includes(pubkey);
      if (!isCreatorOrMod) {
        throw new Error("Not authorized to kick members");
      }
      
      // Check if target is a member and not the creator
      if (!dao.members.includes(memberToKick) || memberToKick === dao.creator) {
        return false;
      }
      
      // Get the unique identifier
      let uniqueId = daoId;
      const event = await this.getDAOEventById(daoId);
      if (event) {
        const dTag = event.tags.find(tag => tag[0] === 'd');
        if (dTag && dTag[1]) {
          uniqueId = dTag[1];
        }
      }
      
      // Create updated member list without kicked member
      const updatedMembers = dao.members.filter(member => member !== memberToKick);
      
      // Remove from moderators as well if applicable
      const updatedModerators = dao.moderators.filter(mod => mod !== memberToKick);
      
      // Create event to update DAO membership
      const eventData = {
        kind: DAO_KINDS.COMMUNITY,
        content: JSON.stringify({
          name: dao.name,
          description: dao.description,
          creator: dao.creator,
          createdAt: dao.createdAt,
          image: dao.image,
          guidelines: dao.guidelines,
          isPrivate: dao.isPrivate,
          treasury: dao.treasury,
          proposals: dao.proposals,
          activeProposals: dao.activeProposals,
          tags: dao.tags
        }),
        tags: [
          ["d", uniqueId],
          ...updatedMembers.map(member => ["p", member]),
          ...updatedModerators.map(mod => ["p", mod, "moderator"])
        ]
      };
      
      await nostrService.publishEvent(eventData);
      
      // Also publish a moderation event
      const moderationEvent = {
        kind: DAO_KINDS.MODERATION,
        content: JSON.stringify({
          action: "kick",
          target: memberToKick,
          reason: "Voted by DAO members",
          executedBy: pubkey,
          executedAt: Math.floor(Date.now() / 1000)
        }),
        tags: [
          ["e", daoId], // Reference to DAO
          ["p", memberToKick, "kicked"] // Target pubkey with action
        ]
      };
      
      await nostrService.publishEvent(moderationEvent);
      
      return true;
    } catch (error) {
      console.error("Error kicking member:", error);
      return false;
    }
  }
  
  /**
   * Get kick proposals for a DAO
   */
  async getDAOKickProposals(daoId: string): Promise<any[]> {
    try {
      // Check cache first
      const cachedKickProposals = getCachedKickProposals(daoId);
      if (cachedKickProposals) {
        console.log(`Using cached kick proposals for DAO: ${daoId}`);
        return cachedKickProposals;
      }
      
      // Use standard proposal fetching and filter for kick proposals
      const allProposals = await this.getDAOProposals(daoId);
      const kickProps = allProposals.filter(proposal => {
        try {
          const content = JSON.parse(proposal.description);
          return content.type === "kick" && content.targetPubkey;
        } catch (e) {
          return false;
        }
      }).map(proposal => {
        try {
          const content = JSON.parse(proposal.description);
          return {
            ...proposal,
            targetPubkey: content.targetPubkey
          };
        } catch (e) {
          return null;
        }
      }).filter(p => p !== null);
      
      // Cache the result
      cacheKickProposals(daoId, kickProps);
      
      return kickProps;
    } catch (error) {
      console.error(`Error fetching kick proposals for DAO ${daoId}:`, error);
      return [];
    }
  }
  
  /**
   * Leave a DAO/community
   */
  async leaveDAO(daoId: string): Promise<boolean> {
    try {
      // First fetch the DAO to get current data
      const dao = await this.getDAOById(daoId);
      if (!dao) {
        console.error("DAO not found:", daoId);
        throw new Error("DAO not found");
      }
      
      const pubkey = nostrService.publicKey;
      if (!pubkey) {
        throw new Error("User not authenticated");
      }
      
      console.log(`User ${pubkey} leaving DAO ${daoId}`);
      
      // Check if user is a member
      if (!dao.members.includes(pubkey)) {
        console.log("Not a member of this DAO");
        return false;
      }
      
      // Check if user is the creator and the only member
      if (dao.creator === pubkey && dao.members.length === 1) {
        throw new Error("The creator cannot leave if they are the only member. Delete the DAO instead.");
      }
      
      // Extract the unique identifier from d tag if available
      let uniqueId = daoId;
      const event = await this.getDAOEventById(daoId);
      if (event) {
        const dTag = event.tags.find(tag => tag[0] === 'd');
        if (dTag && dTag[1]) {
          uniqueId = dTag[1];
        }
      }
      
      // Create updated member list excluding the current user
      const members = dao.members.filter(member => member !== pubkey);
      
      // Also remove from moderators if applicable
      const moderators = dao.moderators.filter(mod => mod !== pubkey);
      
      // Create a new community event with the same uniqueId
      // This follows NIP-72 replacement approach
      const updatedData = {
        name: dao.name,
        description: dao.description,
        creator: dao.creator,
        createdAt: dao.createdAt,
        image: dao.image,
        treasury: dao.treasury,
        proposals: dao.proposals,
        activeProposals: dao.activeProposals,
        tags: dao.tags,
        guidelines: dao.guidelines,
        isPrivate: dao.isPrivate
      };
      
      // NIP-72 compliant event for leaving
      const eventData = {
        kind: DAO_KINDS.COMMUNITY,
        content: JSON.stringify(updatedData),
        tags: [
          ["d", uniqueId], // Same unique identifier
          ...members.map(member => ["p", member]), // Include remaining members
          ...moderators.map(mod => ["p", mod, "moderator"]) // Include remaining moderators
        ]
      };
      
      console.log("Publishing leave DAO event:", eventData);
      
      await nostrService.publishEvent(eventData);
      console.log(`Successfully left DAO ${daoId}`);
      
      // Invalidate user DAOs cache
      invalidateUserDAOsCache(pubkey);
      
      return true;
    } catch (error) {
      console.error("Error leaving DAO:", error);
      return false;
    }
  }
  
  /**
   * Helper function to get the original DAO event
   */
  private async getDAOEventById(id: string): Promise<Event | null> {
    try {
      const filter: Filter = {
        ids: [id],
        kinds: [DAO_KINDS.COMMUNITY],
      };
      
      const events = await this.pool.querySync(this.relays, filter);
      return events.length > 0 ? events[0] : null;
    } catch (error) {
      console.error(`Error fetching DAO event ${id}:`, error);
      return null;
    }
  }
  
  /**
   * Helper function to parse a DAO event
   */
  private parseDaoEvent(event: Event): DAO | null {
    try {
      // Parse content with improved error handling
      let content: any = {};
      try {
        content = event.content ? JSON.parse(event.content) : {};
      } catch (e) {
        // If JSON parsing fails, treat as plain text description
        if (event.content && event.content.trim() && event.content !== "not defined") {
          // Create a basic DAO structure from plain text content
          content = {
            name: this.extractNameFromContent(event.content),
            description: event.content.substring(0, 500), // Limit description length
            tags: []
          };
          console.log(`Converted plain text DAO event ${event.id} to structured format`);
        } else {
          console.warn(`Skipping DAO event ${event.id} with invalid/empty content`);
          return null;
        }
      }
      
      // Validate name - require a valid name for DAOs
      const name = content.name?.trim() || this.extractNameFromContent(event.content) || "Community";
      
      // Extract members from p tags
      const members = event.tags
        .filter(tag => tag.length >= 2 && tag[0] === 'p' && (!tag[2] || tag[2] === ''))
        .map(tag => tag[1]);
      
      // Extract moderators from p tags with role=moderator
      const moderators = event.tags
        .filter(tag => tag.length >= 3 && tag[0] === 'p' && tag[2] === 'moderator')
        .map(tag => tag[1]);
      
      // Extract banned members from p tags with role=banned
      const bannedMembers = event.tags
        .filter(tag => tag.length >= 3 && tag[0] === 'p' && tag[2] === 'banned')
        .map(tag => tag[1]);
      
      // Be more lenient with validation - allow DAOs with minimal content
      const description = content.description || event.content?.substring(0, 500) || "";
      
      // Construct DAO object with better defaults
      const dao: DAO = {
        id: event.id,
        name: name,
        description: description,
        image: content.image || content.avatar || "", // Legacy field - use avatar as fallback
        avatar: content.avatar || content.image || "", // Community avatar/logo URL
        banner: content.banner || "", // Community banner image URL
        creator: event.pubkey,
        createdAt: event.created_at,
        members,
        moderators,
        bannedMembers: bannedMembers || content.bannedMembers || [],
        guidelines: content.guidelines || "",
        isPrivate: content.isPrivate || false,
        treasury: content.treasury || {
          balance: 0,
          tokenSymbol: "ALPH"
        },
        proposals: content.proposals || 0,
        activeProposals: content.activeProposals || 0,
        tags: content.tags || []
      };
      
      return dao;
    } catch (e) {
      console.warn(`Error parsing DAO event ${event.id}:`, e.message);
      return null;
    }
  }
  
  /**
   * Helper function to extract a reasonable name from content
   */
  private extractNameFromContent(content: string): string {
    if (!content) return "Community";
    
    // Try to extract first sentence or line as name
    const firstLine = content.split('\n')[0].trim();
    const firstSentence = firstLine.split('.')[0].trim();
    
    // Use first 50 characters as name if it's reasonable
    const candidateName = firstSentence.length > 0 && firstSentence.length <= 100 
      ? firstSentence 
      : firstLine.substring(0, 50);
    
    return candidateName || "Community";
  }
  
  /**
   * Helper function to parse a proposal event
   */
  private parseProposalEvent(event: Event, daoId: string): DAOProposal | null {
    try {
      // Parse content with error handling
      let content: any = {};
      try {
        content = event.content ? JSON.parse(event.content) : {};
      } catch (e) {
        // Skip events with invalid JSON
        if (event.content === "not defined" || !event.content.trim()) {
          return null;
        }
        console.warn(`Skipping proposal event ${event.id} with invalid JSON`);
        return null;
      }
      
      // Validate required fields
      if (!content.title?.trim()) {
        return null;
      }
      
      // Calculate status based on end time
      const now = Math.floor(Date.now() / 1000);
      const status: "active" | "passed" | "rejected" | "canceled" = 
        content.endsAt > now ? "active" : "passed"; // Simple logic for now
      
      return {
        id: event.id,
        daoId: daoId,
        title: content.title,
        description: content.description || "",
        options: content.options || ["Yes", "No"],
        createdAt: event.created_at,
        endsAt: content.endsAt || (event.created_at + 7 * 24 * 60 * 60), // Default 1 week
        creator: event.pubkey,
        votes: {},  // Will be filled later
        status
      };
    } catch (e) {
      console.warn(`Error parsing proposal event ${event.id}:`, e.message);
      return null;
    }
  }

  /**
   * Submit a post to a community for moderator approval (NIP-72)
   */
  async submitCommunityPost(
    communityId: string, 
    content: string, 
    title?: string
  ): Promise<string | null> {
    try {
      const pubkey = nostrService.publicKey;
      if (!pubkey) {
        throw new Error("User not authenticated");
      }

      console.log(`Submitting post to community ${communityId}`);

      // Create a text note with community 'a' tag (NIP-72)
      const eventData = {
        kind: 1, // Text note
        content: content,
        tags: [
          ["a", `34550:${communityId}`, ""], // Reference to community
        ]
      };

      // Add title as subject tag if provided
      if (title) {
        eventData.tags.push(["subject", title]);
      }

      console.log("Publishing community post:", eventData);
      
      const eventId = await nostrService.publishEvent(eventData);
      console.log("Community post submitted with ID:", eventId);
      
      return eventId;
    } catch (error) {
      console.error("Error submitting community post:", error);
      return null;
    }
  }

  /**
   * Approve a community post (NIP-72 kind 4550)
   */
  async approveCommunityPost(
    postId: string, 
    communityId: string, 
    originalPost: Event
  ): Promise<string | null> {
    try {
      const pubkey = nostrService.publicKey;
      if (!pubkey) {
        throw new Error("User not authenticated");
      }

      console.log(`Approving post ${postId} for community ${communityId}`);

      // Create NIP-72 post approval event (kind 4550)
      const eventData = {
        kind: DAO_KINDS.POST_APPROVAL,
        content: JSON.stringify(originalPost), // NIP-18 style
        tags: [
          ["a", `34550:${communityId}`, ""], // Community reference
          ["e", postId, ""], // Post reference
          ["p", originalPost.pubkey, ""], // Post author
          ["k", originalPost.kind.toString()], // Original post kind
        ]
      };

      console.log("Publishing post approval:", eventData);
      
      const approvalId = await nostrService.publishEvent(eventData);
      console.log("Post approval published with ID:", approvalId);
      
      return approvalId;
    } catch (error) {
      console.error("Error approving community post:", error);
      return null;
    }
  }

  /**
   * Get pending posts for a community (posts not yet approved)
   */
  async getPendingCommunityPosts(communityId: string): Promise<PendingPost[]> {
    try {
      console.log(`Fetching pending posts for community ${communityId}`);

      // Get all posts tagged with this community
      const postFilter: Filter = {
        kinds: [1], // Text notes
        "#a": [`34550:${communityId}`],
        limit: 50
      };

      // Get all approvals for this community
      const approvalFilter: Filter = {
        kinds: [DAO_KINDS.POST_APPROVAL],
        "#a": [`34550:${communityId}`],
        limit: 100
      };

      const [postEvents, approvalEvents] = await Promise.all([
        this.pool.querySync(this.relays, postFilter),
        this.pool.querySync(this.relays, approvalFilter)
      ]);

      console.log(`Found ${postEvents.length} posts and ${approvalEvents.length} approvals`);

      // Create set of approved post IDs
      const approvedPostIds = new Set(
        approvalEvents.map(approval => {
          const eTag = approval.tags.find(tag => tag[0] === 'e');
          return eTag ? eTag[1] : null;
        }).filter(Boolean)
      );

      // Filter to only pending posts
      const pendingPosts = postEvents
        .filter(post => !approvedPostIds.has(post.id))
        .map(post => this.parsePostEvent(post, communityId))
        .filter((post): post is PendingPost => post !== null);

      console.log(`Found ${pendingPosts.length} pending posts`);
      return pendingPosts;
    } catch (error) {
      console.error("Error fetching pending community posts:", error);
      return [];
    }
  }

  /**
   * Get approved posts for a community
   */
  async getApprovedCommunityPosts(communityId: string): Promise<CommunityPost[]> {
    try {
      console.log(`Fetching approved posts for community ${communityId}`);

      // Get all approvals for this community
      const approvalFilter: Filter = {
        kinds: [DAO_KINDS.POST_APPROVAL],
        "#a": [`34550:${communityId}`],
        limit: 50
      };

      const approvalEvents = await this.pool.querySync(this.relays, approvalFilter);
      console.log(`Found ${approvalEvents.length} approvals`);

      const approvedPosts: CommunityPost[] = [];

      for (const approval of approvalEvents) {
        try {
          // Parse the original post from approval content
          const originalPost = JSON.parse(approval.content);
          const eTag = approval.tags.find(tag => tag[0] === 'e');
          
          if (eTag && originalPost) {
            const communityPost: CommunityPost = {
              id: originalPost.id,
              communityId,
              content: originalPost.content,
              title: this.extractTitle(originalPost.tags),
              author: originalPost.pubkey,
              createdAt: originalPost.created_at,
              kind: originalPost.kind,
              tags: originalPost.tags,
              approvals: [{
                id: approval.id,
                postId: originalPost.id,
                communityId,
                moderator: approval.pubkey,
                approvedAt: approval.created_at,
                originalPost: approval.content
              }],
              isApproved: true,
              approvedBy: approval.pubkey,
              approvedAt: approval.created_at
            };

            approvedPosts.push(communityPost);
          }
        } catch (parseError) {
          console.error("Error parsing approval event:", parseError);
        }
      }

      // Sort by approval time (newest first)
      approvedPosts.sort((a, b) => (b.approvedAt || 0) - (a.approvedAt || 0));

      console.log(`Found ${approvedPosts.length} approved posts`);
      return approvedPosts;
    } catch (error) {
      console.error("Error fetching approved community posts:", error);
      return [];
    }
  }

  /**
   * Parse a post event into PendingPost
   */
  private parsePostEvent(event: Event, communityId: string): PendingPost | null {
    try {
      return {
        id: event.id,
        communityId,
        content: event.content,
        title: this.extractTitle(event.tags),
        author: event.pubkey,
        createdAt: event.created_at,
        kind: event.kind,
        tags: event.tags
      };
    } catch (error) {
      console.error("Error parsing post event:", error);
      return null;
    }
  }

  /**
   * Extract title from event tags (subject tag)
   */
  private extractTitle(tags: string[][]): string | undefined {
    const subjectTag = tags.find(tag => tag[0] === 'subject');
    return subjectTag ? subjectTag[1] : undefined;
  }

  /**
   * Reject a community post with reason (Enhanced moderation)
   */
  async rejectCommunityPost(
    postId: string, 
    communityId: string, 
    originalPost: Event,
    reason: string
  ): Promise<string | null> {
    try {
      const pubkey = nostrService.publicKey;
      if (!pubkey) {
        throw new Error("User not authenticated");
      }

      console.log(`Rejecting post ${postId} for community ${communityId} with reason: ${reason}`);

      // Create NIP-72 extended post rejection event (kind 4551)
      const eventData = {
        kind: DAO_KINDS.POST_REJECTION,
        content: JSON.stringify({
          originalPost: JSON.stringify(originalPost),
          reason: reason,
          rejectedAt: Math.floor(Date.now() / 1000)
        }),
        tags: [
          ["a", `34550:${communityId}`, ""], // Community reference
          ["e", postId, ""], // Post reference
          ["p", originalPost.pubkey, ""], // Post author
          ["k", originalPost.kind.toString()], // Original post kind
        ]
      };

      console.log("Publishing post rejection:", eventData);
      
      const rejectionId = await nostrService.publishEvent(eventData);
      
      if (rejectionId) {
        // Log the moderation action
        await this.logModerationAction(communityId, 'reject_post', postId, reason);
        console.log("Post rejection published with ID:", rejectionId);
      }
      
      return rejectionId;
    } catch (error) {
      console.error("Error rejecting community post:", error);
      return null;
    }
  }

  /**
   * Ban a member from the community
   */
  async banMember(
    communityId: string, 
    memberToBan: string, 
    reason: string, 
    durationHours?: number
  ): Promise<string | null> {
    try {
      const pubkey = nostrService.publicKey;
      if (!pubkey) {
        throw new Error("User not authenticated");
      }

      console.log(`Banning member ${memberToBan} from community ${communityId}`);

      const now = Math.floor(Date.now() / 1000);
      const expiresAt = durationHours ? now + (durationHours * 3600) : undefined;

      // Create member ban event
      const banData = {
        bannedUser: memberToBan,
        moderator: pubkey,
        reason: reason,
        bannedAt: now,
        expiresAt: expiresAt,
        isActive: true
      };

      const eventData = {
        kind: DAO_KINDS.MEMBER_BAN,
        content: JSON.stringify(banData),
        tags: [
          ["a", `34550:${communityId}`, ""], // Community reference
          ["p", memberToBan, "banned"], // Banned member
          ["moderator", pubkey], // Moderator who issued ban
        ]
      };

      console.log("Publishing member ban:", eventData);
      
      const banId = await nostrService.publishEvent(eventData);
      
      if (banId) {
        // Log the moderation action
        await this.logModerationAction(communityId, 'ban', memberToBan, reason, { durationHours });
        
        // Update the community definition to remove banned member
        await this.removeMemberFromCommunity(communityId, memberToBan);
        
        console.log("Member ban published with ID:", banId);
      }
      
      return banId;
    } catch (error) {
      console.error("Error banning member:", error);
      return null;
    }
  }

  /**
   * Unban a member from the community
   */
  async unbanMember(communityId: string, memberToUnban: string, reason?: string): Promise<string | null> {
    try {
      const pubkey = nostrService.publicKey;
      if (!pubkey) {
        throw new Error("User not authenticated");
      }

      console.log(`Unbanning member ${memberToUnban} from community ${communityId}`);

      const now = Math.floor(Date.now() / 1000);

      // Create member unban event
      const unbanData = {
        unbannedUser: memberToUnban,
        moderator: pubkey,
        reason: reason || "Ban lifted",
        unbannedAt: now
      };

      const eventData = {
        kind: DAO_KINDS.MEMBER_BAN,
        content: JSON.stringify(unbanData),
        tags: [
          ["a", `34550:${communityId}`, ""], // Community reference
          ["p", memberToUnban, "unbanned"], // Unbanned member
          ["moderator", pubkey], // Moderator who lifted ban
        ]
      };

      console.log("Publishing member unban:", eventData);
      
      const unbanId = await nostrService.publishEvent(eventData);
      
      if (unbanId) {
        // Log the moderation action
        await this.logModerationAction(communityId, 'unban', memberToUnban, reason);
        console.log("Member unban published with ID:", unbanId);
      }
      
      return unbanId;
    } catch (error) {
      console.error("Error unbanning member:", error);
      return null;
    }
  }

  /**
   * Report content for moderation review
   */
  async reportContent(
    communityId: string,
    targetId: string,
    targetType: 'post' | 'comment' | 'user',
    category: 'spam' | 'harassment' | 'inappropriate' | 'misinformation' | 'other',
    reason: string
  ): Promise<string | null> {
    try {
      const pubkey = nostrService.publicKey;
      if (!pubkey) {
        throw new Error("User not authenticated");
      }

      console.log(`Reporting ${targetType} ${targetId} in community ${communityId}`);

      const reportData = {
        targetId,
        targetType,
        category,
        reason,
        reportedAt: Math.floor(Date.now() / 1000),
        status: 'pending'
      };

      const eventData = {
        kind: DAO_KINDS.CONTENT_REPORT,
        content: JSON.stringify(reportData),
        tags: [
          ["a", `34550:${communityId}`, ""], // Community reference
          ["e", targetId, targetType], // Target content
          ["report", category], // Report category
        ]
      };

      console.log("Publishing content report:", eventData);
      
      const reportId = await nostrService.publishEvent(eventData);
      console.log("Content report published with ID:", reportId);
      
      return reportId;
    } catch (error) {
      console.error("Error reporting content:", error);
      return null;
    }
  }

  /**
   * Log moderation action for transparency
   */
  async logModerationAction(
    communityId: string,
    action: string,
    target: string,
    reason?: string,
    metadata?: any
  ): Promise<string | null> {
    try {
      const pubkey = nostrService.publicKey;
      if (!pubkey) {
        throw new Error("User not authenticated");
      }

      const logData = {
        action,
        target,
        reason,
        metadata,
        timestamp: Math.floor(Date.now() / 1000)
      };

      const eventData = {
        kind: DAO_KINDS.MODERATION_LOG,
        content: JSON.stringify(logData),
        tags: [
          ["a", `34550:${communityId}`, ""], // Community reference
          ["action", action], // Action type
          ["target", target], // Target of action
        ]
      };

      const logId = await nostrService.publishEvent(eventData);
      return logId;
    } catch (error) {
      console.error("Error logging moderation action:", error);
      return null;
    }
  }

  /**
   * Get rejected posts for a community
   */
  async getRejectedCommunityPosts(communityId: string): Promise<RejectedPost[]> {
    try {
      console.log(`Fetching rejected posts for community ${communityId}`);

      // Get all rejections for this community
      const rejectionFilter: Filter = {
        kinds: [DAO_KINDS.POST_REJECTION],
        "#a": [`34550:${communityId}`],
        limit: 50
      };

      const rejectionEvents = await this.pool.querySync(this.relays, rejectionFilter);
      console.log(`Found ${rejectionEvents.length} rejections`);

      const rejectedPosts: RejectedPost[] = [];

      for (const rejection of rejectionEvents) {
        try {
          const rejectionData = JSON.parse(rejection.content);
          const originalPost = JSON.parse(rejectionData.originalPost);
          const eTag = rejection.tags.find(tag => tag[0] === 'e');
          
          if (eTag && originalPost) {
            const rejectedPost: RejectedPost = {
              id: originalPost.id,
              communityId,
              content: originalPost.content,
              title: this.extractTitle(originalPost.tags),
              author: originalPost.pubkey,
              createdAt: originalPost.created_at,
              kind: originalPost.kind,
              tags: originalPost.tags,
              rejection: {
                id: rejection.id,
                postId: originalPost.id,
                communityId,
                moderator: rejection.pubkey,
                rejectedAt: rejection.created_at,
                reason: rejectionData.reason,
                originalPost: rejectionData.originalPost
              },
              isRejected: true
            };

            rejectedPosts.push(rejectedPost);
          }
        } catch (parseError) {
          console.error("Error parsing rejection event:", parseError);
        }
      }

      // Sort by rejection time (newest first)
      rejectedPosts.sort((a, b) => b.rejection.rejectedAt - a.rejection.rejectedAt);

      console.log(`Found ${rejectedPosts.length} rejected posts`);
      return rejectedPosts;
    } catch (error) {
      console.error("Error fetching rejected community posts:", error);
      return [];
    }
  }

  /**
   * Get banned members for a community
   */
  async getBannedMembers(communityId: string): Promise<MemberBan[]> {
    try {
      console.log(`Fetching banned members for community ${communityId}`);

      const banFilter: Filter = {
        kinds: [DAO_KINDS.MEMBER_BAN],
        "#a": [`34550:${communityId}`],
        limit: 100
      };

      const banEvents = await this.pool.querySync(this.relays, banFilter);
      console.log(`Found ${banEvents.length} ban events`);

      const bans: MemberBan[] = [];

      for (const banEvent of banEvents) {
        try {
          const banData = JSON.parse(banEvent.content);
          
          if (banData.bannedUser) { // This is a ban event
            const ban: MemberBan = {
              id: banEvent.id,
              communityId,
              bannedUser: banData.bannedUser,
              moderator: banData.moderator,
              reason: banData.reason,
              bannedAt: banData.bannedAt,
              expiresAt: banData.expiresAt,
              isActive: this.isBanActive(banData)
            };
            bans.push(ban);
          }
        } catch (parseError) {
          console.error("Error parsing ban event:", parseError);
        }
      }

      // Sort by ban time (newest first)
      bans.sort((a, b) => b.bannedAt - a.bannedAt);

      return bans;
    } catch (error) {
      console.error("Error fetching banned members:", error);
      return [];
    }
  }

  /**
   * Get content reports for a community
   */
  async getContentReports(communityId: string): Promise<ContentReport[]> {
    try {
      console.log(`Fetching content reports for community ${communityId}`);

      const reportFilter: Filter = {
        kinds: [DAO_KINDS.CONTENT_REPORT],
        "#a": [`34550:${communityId}`],
        limit: 100
      };

      const reportEvents = await this.pool.querySync(this.relays, reportFilter);
      console.log(`Found ${reportEvents.length} reports`);

      const reports: ContentReport[] = [];

      for (const reportEvent of reportEvents) {
        try {
          const reportData = JSON.parse(reportEvent.content);
          
          const report: ContentReport = {
            id: reportEvent.id,
            communityId,
            reporter: reportEvent.pubkey,
            targetId: reportData.targetId,
            targetType: reportData.targetType,
            category: reportData.category,
            reason: reportData.reason,
            reportedAt: reportData.reportedAt,
            status: reportData.status || 'pending',
            reviewedBy: reportData.reviewedBy,
            reviewedAt: reportData.reviewedAt,
            resolution: reportData.resolution
          };

          reports.push(report);
        } catch (parseError) {
          console.error("Error parsing report event:", parseError);
        }
      }

      // Sort by report time (newest first)
      reports.sort((a, b) => b.reportedAt - a.reportedAt);

      return reports;
    } catch (error) {
      console.error("Error fetching content reports:", error);
      return [];
    }
  }

  /**
   * Get moderation logs for a community
   */
  async getModerationLogs(communityId: string): Promise<ModerationLogEntry[]> {
    try {
      console.log(`Fetching moderation logs for community ${communityId}`);

      const logFilter: Filter = {
        kinds: [DAO_KINDS.MODERATION_LOG],
        "#a": [`34550:${communityId}`],
        limit: 200
      };

      const logEvents = await this.pool.querySync(this.relays, logFilter);
      console.log(`Found ${logEvents.length} moderation log entries`);

      const logs: ModerationLogEntry[] = [];

      for (const logEvent of logEvents) {
        try {
          const logData = JSON.parse(logEvent.content);
          
          const log: ModerationLogEntry = {
            id: logEvent.id,
            communityId,
            moderator: logEvent.pubkey,
            action: logData.action,
            target: logData.target,
            reason: logData.reason,
            timestamp: logData.timestamp,
            metadata: logData.metadata
          };

          logs.push(log);
        } catch (parseError) {
          console.error("Error parsing log event:", parseError);
        }
      }

      // Sort by timestamp (newest first)
      logs.sort((a, b) => b.timestamp - a.timestamp);

      return logs;
    } catch (error) {
      console.error("Error fetching moderation logs:", error);
      return [];
    }
  }

  /**
   * Review and resolve a content report
   */
  async reviewContentReport(
    reportId: string,
    communityId: string,
    resolution: string,
    status: 'reviewed' | 'resolved' | 'dismissed'
  ): Promise<string | null> {
    try {
      const pubkey = nostrService.publicKey;
      if (!pubkey) {
        throw new Error("User not authenticated");
      }

      console.log(`Reviewing content report ${reportId}`);

      const reviewData = {
        reportId,
        reviewedBy: pubkey,
        reviewedAt: Math.floor(Date.now() / 1000),
        resolution,
        status
      };

      const eventData = {
        kind: DAO_KINDS.CONTENT_REPORT,
        content: JSON.stringify(reviewData),
        tags: [
          ["a", `34550:${communityId}`, ""],
          ["e", reportId, "review"],
          ["status", status],
        ]
      };

      const reviewId = await nostrService.publishEvent(eventData);
      
      if (reviewId) {
        // Log the moderation action
        await this.logModerationAction(communityId, 'review_report', reportId, resolution);
      }
      
      return reviewId;
    } catch (error) {
      console.error("Error reviewing content report:", error);
      return null;
    }
  }

  /**
   * Helper to check if a ban is still active
   */
  private isBanActive(banData: any): boolean {
    const now = Math.floor(Date.now() / 1000);
    if (banData.expiresAt && now > banData.expiresAt) {
      return false; // Ban has expired
    }
    return true;
  }

  /**
   * Helper to remove member from community definition
   */
  private async removeMemberFromCommunity(communityId: string, memberToRemove: string): Promise<void> {
    try {
      const dao = await this.getDAOById(communityId);
      if (!dao) return;

      // Get the unique identifier
      let uniqueId = communityId;
      const event = await this.getDAOEventById(communityId);
      if (event) {
        const dTag = event.tags.find(tag => tag[0] === 'd');
        if (dTag && dTag[1]) {
          uniqueId = dTag[1];
        }
      }

      // Create updated member list without the banned member
      const updatedMembers = dao.members.filter(member => member !== memberToRemove);
      const updatedModerators = dao.moderators.filter(mod => mod !== memberToRemove);
      const bannedMembers = [...(dao.bannedMembers || []), memberToRemove];

      // Update community definition
      const eventData = {
        kind: DAO_KINDS.COMMUNITY,
        content: JSON.stringify({
          name: dao.name,
          description: dao.description,
          creator: dao.creator,
          createdAt: dao.createdAt,
          image: dao.image,
          guidelines: dao.guidelines,
          isPrivate: dao.isPrivate,
          treasury: dao.treasury,
          proposals: dao.proposals,
          activeProposals: dao.activeProposals,
          tags: dao.tags,
          bannedMembers
        }),
        tags: [
          ["d", uniqueId],
          ...updatedMembers.map(member => ["p", member]),
          ...updatedModerators.map(mod => ["p", mod, "moderator"]),
          ...bannedMembers.map(banned => ["p", banned, "banned"])
        ]
      };

      await nostrService.publishEvent(eventData);
    } catch (error) {
      console.error("Error removing member from community:", error);
    }
  }

  /**
   * Cleanup method to properly close connections
   */
  public cleanup(): void {
    try {
      this.pool.close();
      console.log('[DAO Service] Pool connections closed');
    } catch (error) {
      console.warn('[DAO Service] Error closing pool:', error);
    }
  }

  /**
   * Publish community events to dedicated relays with better error handling
   */
  private async publishCommunityEvent(eventData: any): Promise<string | null> {
    try {
      // Get user's private key for signing (if available)
      const pubkey = nostrService.publicKey;
      if (!pubkey) {
        throw new Error("User not authenticated");
      }

      console.log('[DAO Service] Publishing to community-friendly relays:', this.fastRelays);

      // Try to use window.nostr for signing if available
      if (typeof window !== 'undefined' && window.nostr) {
        try {
          console.log('[DAO Service] Using browser extension for signing');
          
          // Prepare event for signing
          const unsignedEvent = {
            ...eventData,
            pubkey,
            created_at: eventData.created_at || Math.floor(Date.now() / 1000)
          };

          // Sign the event using browser extension
          const signedEvent = await window.nostr.signEvent(unsignedEvent);
          console.log('[DAO Service] Event signed successfully:', signedEvent.id);

          // Publish to community-friendly relays with retry logic
          const publishPromises = this.fastRelays.map(async (relay) => {
            try {
              console.log(`[DAO Service] Publishing to ${relay}`);
              const pub = this.pool.publish([relay], signedEvent);
              
              return new Promise<{ relay: string; success: boolean; error?: string }>((resolve) => {
                const timeout = setTimeout(() => {
                  resolve({ relay, success: false, error: 'timeout' });
                }, 10000); // 10 second timeout

                pub.on('ok', () => {
                  clearTimeout(timeout);
                  console.log(`[DAO Service] Successfully published to ${relay}`);
                  resolve({ relay, success: true });
                });

                pub.on('failed', (reason: string) => {
                  clearTimeout(timeout);
                  console.warn(`[DAO Service] Failed to publish to ${relay}:`, reason);
                  resolve({ relay, success: false, error: reason });
                });
              });
            } catch (error) {
              console.error(`[DAO Service] Error publishing to ${relay}:`, error);
              return { relay, success: false, error: error.message };
            }
          });

          // Wait for all publish attempts
          const results = await Promise.all(publishPromises);
          
          // Check if at least one relay accepted the event
          const successfulPublishes = results.filter(r => r.success);
          const failedPublishes = results.filter(r => !r.success);

          console.log('[DAO Service] Publish results:', {
            successful: successfulPublishes.length,
            failed: failedPublishes.length,
            failures: failedPublishes.map(f => ({ relay: f.relay, error: f.error }))
          });

          if (successfulPublishes.length > 0) {
            console.log(`[DAO Service] Event published successfully to ${successfulPublishes.length} relays`);
            return signedEvent.id;
          } else {
            // All relays failed - provide helpful error message
            const errorMessages = failedPublishes.map(f => f.error).filter(Boolean);
            const uniqueErrors = [...new Set(errorMessages)];
            
            if (uniqueErrors.some(err => err.includes('blocked') || err.includes('moderated'))) {
              throw new Error('Community events are not supported by the connected relays. Please try again or contact support.');
            } else if (uniqueErrors.some(err => err.includes('subscription'))) {
              throw new Error('Relay connection issue. Please check your internet connection and try again.');
            } else {
              throw new Error(`Failed to publish to any relay. Errors: ${uniqueErrors.join(', ')}`);
            }
          }

        } catch (signingError) {
          console.error('[DAO Service] Error during signing:', signingError);
          throw new Error(`Failed to sign event: ${signingError.message}`);
        }
      } else {
        throw new Error('Nostr browser extension not available. Please install a Nostr extension like Alby or nos2x.');
      }

    } catch (error) {
      console.error('[DAO Service] Error in publishCommunityEvent:', error);
      throw error;
    }
  }
}

export const daoService = new DAOService();

