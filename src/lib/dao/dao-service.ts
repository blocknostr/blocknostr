import { SimplePool, Filter, Event, nip19 } from 'nostr-tools';
import { DAO, DAOProposal } from '@/types/dao';
import { nostrService } from '@/lib/nostr';

// NIP-72 kind numbers (ensure full compliance)
const DAO_KINDS = {
  COMMUNITY: 34550,       // Community definition
  PROPOSAL: 34551,        // Community proposal
  VOTE: 34552,           // Vote on a proposal
  METADATA: 34553,       // Community metadata (guidelines, etc)
  MODERATION: 34554,      // Moderation events (kick, ban)
};

/**
 * Service for interacting with DAOs using NIP-72
 */
export class DAOService {
  private pool: SimplePool;
  private relays: string[];
  
  constructor() {
    this.pool = new SimplePool();
    // Add NIP-72 compatible relays
    this.relays = [
      "wss://relay.damus.io",
      "wss://nos.lol",
      "wss://relay.nostr.band",
      "wss://nostr.bitcoiner.social",
      "wss://relay.nostr.bg",
      "wss://relay.snort.social"
    ];
  }
  
  /**
   * Get list of DAOs/communities
   */
  async getDAOs(limit: number = 20): Promise<DAO[]> {
    try {
      const filter: Filter = {
        kinds: [DAO_KINDS.COMMUNITY],
        limit: limit
      };
      
      console.log("Fetching DAOs with filter:", filter);
      console.log("Using relays:", this.relays);
      
      const events = await this.pool.querySync(this.relays, filter);
      console.log("Received DAO events:", events.length);
      
      return events
        .map(event => this.parseDaoEvent(event))
        .filter((dao): dao is DAO => dao !== null);
    } catch (error) {
      console.error("Error fetching DAOs:", error);
      return [];
    }
  }
  
  /**
   * Get DAOs that a user is a member of
   */
  async getUserDAOs(pubkey: string, limit: number = 20): Promise<DAO[]> {
    if (!pubkey) return [];
    
    try {
      const filter: Filter = {
        kinds: [DAO_KINDS.COMMUNITY],
        '#p': [pubkey],
        limit: limit
      };
      
      console.log(`Fetching DAOs for user ${pubkey}`);
      const events = await this.pool.querySync(this.relays, filter);
      console.log(`Received ${events.length} user DAO events`);
      
      return events
        .map(event => this.parseDaoEvent(event))
        .filter((dao): dao is DAO => dao !== null);
    } catch (error) {
      console.error("Error fetching user DAOs:", error);
      return [];
    }
  }
  
  /**
   * Get trending DAOs based on member count
   */
  async getTrendingDAOs(limit: number = 20): Promise<DAO[]> {
    const daos = await this.getDAOs(limit * 2);
    return daos
      .sort((a, b) => b.members.length - a.members.length)
      .slice(0, limit);
  }
  
  /**
   * Get a single DAO by ID
   */
  async getDAOById(id: string): Promise<DAO | null> {
    try {
      console.log(`Fetching DAO with ID: ${id}`);
      
      const filter: Filter = {
        kinds: [DAO_KINDS.COMMUNITY],
        ids: [id],
        limit: 1
      };
      
      const events = await this.pool.querySync(this.relays, filter);
      
      if (events.length === 0) {
        console.log(`No DAO found with ID: ${id}`);
        return null;
      }
      
      return this.parseDaoEvent(events[0]);
    } catch (error) {
      console.error(`Error fetching DAO ${id}:`, error);
      return null;
    }
  }
  
  /**
   * Get DAO proposals
   */
  async getDAOProposals(daoId: string): Promise<DAOProposal[]> {
    try {
      const filter: Filter = {
        kinds: [DAO_KINDS.PROPOSAL],
        '#e': [daoId],
        limit: 50
      };
      
      console.log(`Fetching proposals for DAO: ${daoId}`);
      const events = await this.pool.querySync(this.relays, filter);
      console.log(`Found ${events.length} proposals for DAO ${daoId}`);
      
      const proposals = events
        .map(event => this.parseProposalEvent(event, daoId))
        .filter((proposal): proposal is DAOProposal => proposal !== null);
        
      // Fetch votes for each proposal
      const votesPromises = proposals.map(proposal => this.getVotesForProposal(proposal.id));
      const votesResults = await Promise.all(votesPromises);
      
      // Merge votes into proposals
      return proposals.map((proposal, index) => ({
        ...proposal,
        votes: votesResults[index]
      }));
    } catch (error) {
      console.error(`Error fetching proposals for DAO ${daoId}:`, error);
      return [];
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
      
      const events = await this.pool.querySync(this.relays, filter);
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
  async createDAO(name: string, description: string, tags: string[] = []): Promise<string | null> {
    try {
      // Get the user's pubkey from the Nostr service
      const pubkey = nostrService.publicKey;
      if (!pubkey) {
        throw new Error("User not authenticated");
      }
      
      console.log(`Creating DAO: ${name} with creator ${pubkey}`);
      
      // Generate a unique identifier for the DAO
      const uniqueId = `dao_${Math.random().toString(36).substring(2, 10)}`;
      
      const communityData = {
        name,
        description,
        creator: pubkey,
        createdAt: Math.floor(Date.now() / 1000),
        image: "", // Optional image URL
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
      
      // Publish the event using nostrService
      const eventId = await nostrService.publishEvent(eventData);
      console.log("DAO created with ID:", eventId);
      
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
      
      // NIP-72 compliant vote event - keep content simple
      const eventData = {
        kind: DAO_KINDS.VOTE,
        content: JSON.stringify({ optionIndex }),
        tags: [
          ["e", proposalId] // Reference to proposal event
        ]
      };
      
      console.log("Publishing vote event:", eventData);
      
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
      console.log("Parsing DAO event:", event.id);
      
      // Parse the content with error handling
      let content: any = {};
      try {
        content = event.content ? JSON.parse(event.content) : {};
      } catch (e) {
        console.error("Error parsing DAO content JSON:", e);
        content = {};
      }
      
      // Extract members from p tags
      const members = event.tags
        .filter(tag => tag.length >= 2 && tag[0] === 'p')
        .map(tag => tag[1]);
      
      // Extract moderators from p tags with role=moderator
      const moderators = event.tags
        .filter(tag => tag.length >= 3 && tag[0] === 'p' && tag[2] === 'moderator')
        .map(tag => tag[1]);
      
      // Construct DAO object
      const dao: DAO = {
        id: event.id,
        name: content.name || "Unnamed DAO",
        description: content.description || "",
        image: content.image || "",
        creator: event.pubkey,
        createdAt: event.created_at,
        members,
        moderators,
        guidelines: content.guidelines,
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
      console.error("Error parsing DAO event:", e);
      return null;
    }
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
        console.error("Error parsing proposal content JSON:", e);
        content = {};
      }
      
      // Calculate status based on end time
      const now = Math.floor(Date.now() / 1000);
      const status = content.endsAt > now ? "active" : "passed"; // Simple logic for now
      
      return {
        id: event.id,
        daoId: daoId,
        title: content.title || "Unnamed Proposal",
        description: content.description || "",
        options: content.options || ["Yes", "No"],
        createdAt: event.created_at,
        endsAt: content.endsAt || (event.created_at + 7 * 24 * 60 * 60), // Default 1 week
        creator: event.pubkey,
        votes: {},  // Will be filled later
        status
      };
    } catch (e) {
      console.error("Error parsing proposal event:", e);
      return null;
    }
  }
}

export const daoService = new DAOService();
