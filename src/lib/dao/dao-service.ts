import { getEventHash, verifySignature } from "nostr-tools";
import { DAO } from "@/types/dao";
import { DAOProposal } from "@/types/dao";
import { nostrService } from "../nostr";
import { daoCache } from "./dao-cache";

class DAOService {
  private adapter = nostrService;
  
  constructor() {
    this.adapter = nostrService;
  }
  
  getPubkey(): string | null {
    return this.adapter.publicKey;
  }
  
  async getDAOs(): Promise<DAO[]> {
    try {
      // Try to get from cache first
      const cachedDAOs = await daoCache.getAllDAOs();
      if (cachedDAOs && cachedDAOs.length > 0) {
        console.log("Returning cached DAOs");
        return cachedDAOs;
      }
      
      console.log("Fetching DAOs from Nostr...");
      
      const filter = {
        kinds: [30072],
        limit: 100,
      };
      
      const events = await this.adapter.getEvents([filter]);
      
      if (!events || events.length === 0) {
        console.log("No DAO events found.");
        return [];
      }
      
      const daos: DAO[] = events.map(event => {
        try {
          const dao = JSON.parse(event.content);
          return {
            ...dao,
            createdAt: event.created_at,
            image: "", // Default empty for now
            members: [dao.creator], // Creator is automatically a member
            moderators: [], // No moderators initially
            treasury: {
              balance: 0,
              tokenSymbol: "ALPH"
            },
            proposals: 0,
            activeProposals: 0,
            tags: dao.tags || [],
            isPrivate: dao.isPrivate || false
          };
        } catch (error) {
          console.error("Error parsing DAO event:", event, error);
          return null;
        }
      }).filter(dao => dao !== null) as DAO[];
      
      // Update the cache with the fetched DAOs
      await daoCache.setAllDAOs(daos);
      
      return daos;
    } catch (error) {
      console.error("Error fetching DAOs:", error);
      return [];
    }
  }
  
  async getDAOById(daoId: string): Promise<DAO | null> {
    try {
      // Try to get from cache first
      const cachedDAO = await daoCache.getDAO(daoId);
      if (cachedDAO) {
        console.log(`Returning cached DAO ${daoId}`);
        return cachedDAO;
      }
      
      console.log(`Fetching DAO ${daoId} from Nostr...`);
      
      const filter = {
        kinds: [30072],
        tags: [["d", daoId]],
        limit: 1
      };
      
      const events = await this.adapter.getEvents([filter]);
      
      if (!events || events.length === 0) {
        console.log(`DAO ${daoId} not found.`);
        return null;
      }
      
      const event = events[0];
      try {
        const dao = JSON.parse(event.content);
        
        // Fetch members and moderators separately
        const members = await this.getDAOMembers(daoId);
        const moderators = await this.getDAOModerators(daoId);
        
        const fullDAO: DAO = {
          id: dao.id,
          name: dao.name,
          description: dao.description,
          image: "", // Default empty for now
          creator: dao.creator,
          createdAt: event.created_at,
          members: members,
          moderators: moderators,
          treasury: {
            balance: 0,
            tokenSymbol: "ALPH"
          },
          proposals: 0,
          activeProposals: 0,
          tags: dao.tags || [],
          isPrivate: dao.isPrivate || false,
          guidelines: dao.guidelines || "",
          alephiumProject: dao.alephiumProject || null
        };
        
        // Update the cache with the fetched DAO
        await daoCache.addDAO(fullDAO);
        
        return fullDAO;
      } catch (error) {
        console.error("Error parsing DAO event:", event, error);
        return null;
      }
    } catch (error) {
      console.error(`Error fetching DAO ${daoId}:`, error);
      return null;
    }
  }
  
  async getUserDAOs(pubkey: string): Promise<DAO[]> {
    try {
      console.log(`Fetching DAOs for user ${pubkey}...`);
      
      // Get all DAO membership events for this user
      const filter = {
        kinds: [30071],
        authors: [pubkey],
        limit: 100
      };
      
      const events = await this.adapter.getEvents([filter]);
      
      if (!events || events.length === 0) {
        console.log(`No DAO membership events found for user ${pubkey}.`);
        return [];
      }
      
      // Extract DAO IDs from the events
      const daoIds = events.map(event => {
        const dTag = event.tags.find(tag => tag[0] === "d");
        return dTag ? dTag[1] : null;
      }).filter(daoId => daoId !== null) as string[];
      
      // Fetch the DAO details for each DAO ID
      const daos = await Promise.all(
        daoIds.map(daoId => this.getDAOById(daoId))
      );
      
      // Filter out any DAOs that couldn't be fetched
      return daos.filter(dao => dao !== null) as DAO[];
    } catch (error) {
      console.error(`Error fetching DAOs for user ${pubkey}:`, error);
      return [];
    }
  }
  
  async getTrendingDAOs(): Promise<DAO[]> {
    try {
      console.log("Fetching trending DAOs...");
      
      // Get all DAOs
      const daos = await this.getDAOs();
      
      // Sort DAOs by number of members (descending)
      const trendingDAOs = daos.sort((a, b) => b.members.length - a.members.length);
      
      // Return the top 10 trending DAOs
      return trendingDAOs.slice(0, 10);
    } catch (error) {
      console.error("Error fetching trending DAOs:", error);
      return [];
    }
  }
  
  // Create a new DAO
  async createDAO(name: string, description: string, tags: string[] = [], alephiumProjectId?: string): Promise<string | null> {
    try {
      const pubkey = this.getPubkey();
      if (!pubkey) {
        throw new Error("User not logged in");
      }

      console.log(`Creating DAO: ${name} for user ${pubkey}`);
      
      // Generate a unique ID for the DAO
      const daoId = crypto.randomUUID();
      
      // Create the DAO object
      const daoContent = {
        id: daoId,
        name,
        description,
        tags: tags || [],
        creator: pubkey,
        isPrivate: false,
        alephiumProject: alephiumProjectId || null  // Store the Alephium project ID
      };
      
      // Create an event for this DAO with NIP-72 tag
      const now = Math.floor(Date.now() / 1000);
      
      const tags = [
        ["d", daoId],
        ["title", name],
        ["nip72", "dao-creation"],
      ];
      
      // Add Alephium project tag if provided
      if (alephiumProjectId) {
        tags.push(["alephium", alephiumProjectId]);
      }
      
      const event = {
        kind: 30072,
        created_at: now,
        tags,
        content: JSON.stringify(daoContent)
      };
      
      const publishResult = await this.adapter.publishEvent(event);
      console.log("DAO creation result:", publishResult);
      
      if (publishResult) {
        // Immediately update the cache with the new DAO
        await daoCache.addDAO({
          id: daoId,
          name,
          description,
          image: "", // Default empty for now
          creator: pubkey,
          createdAt: now,
          members: [pubkey], // Creator is automatically a member
          moderators: [], // No moderators initially
          treasury: {
            balance: 0,
            tokenSymbol: "ALPH"
          },
          proposals: 0,
          activeProposals: 0,
          tags: tags || [],
          isPrivate: false,
          alephiumProject: alephiumProjectId || null // Store the Alephium project ID
        });
        
        return daoId;
      }
      
      return null;
    } catch (error) {
      console.error("Error creating DAO:", error);
      return null;
    }
  }
  
  // Join a DAO
  async joinDAO(daoId: string): Promise<boolean> {
    try {
      const pubkey = this.getPubkey();
      if (!pubkey) {
        throw new Error("User not logged in");
      }
      
      console.log(`Joining DAO ${daoId} for user ${pubkey}`);
      
      // Create an event for this DAO membership
      const now = Math.floor(Date.now() / 1000);
      
      const event = {
        kind: 30071,
        created_at: now,
        tags: [["d", daoId]],
        content: ""
      };
      
      const publishResult = await this.adapter.publishEvent(event);
      console.log("DAO join result:", publishResult);
      
      if (publishResult) {
        // Update DAO members list in cache
        await daoCache.addDAOMember(daoId, pubkey);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error joining DAO:", error);
      return false;
    }
  }
  
  // Leave a DAO
  async leaveDAO(daoId: string): Promise<boolean> {
    try {
      const pubkey = this.getPubkey();
      if (!pubkey) {
        throw new Error("User not logged in");
      }
      
      console.log(`Leaving DAO ${daoId} for user ${pubkey}`);
      
      // To leave a DAO, we publish a deletion event (kind 5) targeting the join event (kind 30071)
      
      // First, find the original join event
      const filter = {
        kinds: [30071],
        authors: [pubkey],
        tags: [["d", daoId]],
        limit: 1
      };
      
      const events = await this.adapter.getEvents([filter]);
      
      if (!events || events.length === 0) {
        console.log(`No DAO membership event found for user ${pubkey} in DAO ${daoId}.`);
        return false;
      }
      
      const joinEvent = events[0];
      
      // Create a deletion event
      const now = Math.floor(Date.now() / 1000);
      
      const event = {
        kind: 5,
        created_at: now,
        tags: [["e", joinEvent.id]],
        content: `Leaving DAO ${daoId}`
      };
      
      const publishResult = await this.adapter.publishEvent(event);
      console.log("DAO leave result:", publishResult);
      
      if (publishResult) {
        // Update DAO members list in cache
        await daoCache.removeDAOMember(daoId, pubkey);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error leaving DAO:", error);
      return false;
    }
  }
  
  // Get DAO members
  async getDAOMembers(daoId: string): Promise<string[]> {
    try {
      console.log(`Fetching members for DAO ${daoId}...`);
      
      // Try to get from cache first
      const cachedMembers = await daoCache.getDAOMembers(daoId);
      if (cachedMembers) {
        console.log(`Returning cached members for DAO ${daoId}`);
        return cachedMembers;
      }
      
      // Get all DAO membership events for this DAO
      const filter = {
        kinds: [30071],
        tags: [["d", daoId]],
        limit: 100
      };
      
      const events = await this.adapter.getEvents([filter]);
      
      if (!events || events.length === 0) {
        console.log(`No DAO membership events found for DAO ${daoId}.`);
        return [];
      }
      
      // Extract pubkeys from the events
      const members = events.map(event => event.pubkey);
      
      // Update the cache with the fetched members
      await daoCache.setDAOMembers(daoId, members);
      
      return members;
    } catch (error) {
      console.error(`Error fetching members for DAO ${daoId}:`, error);
      return [];
    }
  }
  
  // Get DAO moderators
  async getDAOModerators(daoId: string): Promise<string[]> {
    try {
      console.log(`Fetching moderators for DAO ${daoId}...`);
      
      // Try to get from cache first
      const cachedModerators = await daoCache.getDAOModerators(daoId);
      if (cachedModerators) {
        console.log(`Returning cached moderators for DAO ${daoId}`);
        return cachedModerators;
      }
      
      // Get all DAO moderator events for this DAO
      const filter = {
        kinds: [30073],
        tags: [["d", daoId]],
        limit: 100
      };
      
      const events = await this.adapter.getEvents([filter]);
      
      if (!events || events.length === 0) {
        console.log(`No DAO moderator events found for DAO ${daoId}.`);
        return [];
      }
      
      // Extract pubkeys from the events
      const moderators = events.map(event => {
        const pTag = event.tags.find(tag => tag[0] === "p");
        return pTag ? pTag[1] : null;
      }).filter(pubkey => pubkey !== null) as string[];
      
      // Update the cache with the fetched moderators
      await daoCache.setDAOModerators(daoId, moderators);
      
      return moderators;
    } catch (error) {
      console.error(`Error fetching moderators for DAO ${daoId}:`, error);
      return [];
    }
  }
  
  // Update DAO metadata (privacy, guidelines, tags)
  async updateDAOMetadata(daoId: string, metadata: { type: string, content?: any, isPrivate?: boolean }): Promise<boolean> {
    try {
      const pubkey = this.getPubkey();
      if (!pubkey) {
        throw new Error("User not logged in");
      }
      
      console.log(`Updating DAO ${daoId} metadata:`, metadata);
      
      // Get the current DAO
      const dao = await this.getDAOById(daoId);
      if (!dao) {
        throw new Error(`DAO ${daoId} not found`);
      }
      
      // Check if the user is the creator of the DAO
      if (dao.creator !== pubkey) {
        throw new Error("You are not the creator of this DAO");
      }
      
      // Update the DAO object based on the metadata type
      let updatedDAO = { ...dao };
      
      if (metadata.type === "privacy") {
        updatedDAO = { ...updatedDAO, isPrivate: metadata.isPrivate };
      } else if (metadata.type === "guidelines") {
        updatedDAO = { ...updatedDAO, guidelines: metadata.content };
      } else if (metadata.type === "tags") {
        updatedDAO = { ...updatedDAO, tags: metadata.content };
      } else {
        throw new Error(`Invalid metadata type: ${metadata.type}`);
      }
      
      // Create an event for this DAO metadata update
      const now = Math.floor(Date.now() / 1000);
      
      const tags = [
        ["d", daoId],
        ["title", dao.name],
        ["nip72", "dao-metadata-update"],
      ];
      
      const event = {
        kind: 30072,
        created_at: now,
        tags,
        content: JSON.stringify(updatedDAO)
      };
      
      const publishResult = await this.adapter.publishEvent(event);
      console.log("DAO metadata update result:", publishResult);
      
      if (publishResult) {
        // Update the cache with the updated DAO
        await daoCache.addDAO(updatedDAO);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error updating DAO metadata:", error);
      return false;
    }
  }
  
  // Update DAO roles (add/remove moderator)
  async updateDAORoles(daoId: string, roleUpdate: { role: string, action: string, pubkey: string }): Promise<boolean> {
    try {
      const pubkey = this.getPubkey();
      if (!pubkey) {
        throw new Error("User not logged in");
      }
      
      console.log(`Updating DAO ${daoId} roles:`, roleUpdate);
      
      // Get the current DAO
      const dao = await this.getDAOById(daoId);
      if (!dao) {
        throw new Error(`DAO ${daoId} not found`);
      }
      
      // Check if the user is the creator of the DAO
      if (dao.creator !== pubkey) {
        throw new Error("You are not the creator of this DAO");
      }
      
      // Validate pubkey format
      if (!roleUpdate.pubkey.match(/^[0-9a-f]{64}$/)) {
        throw new Error("Invalid pubkey format");
      }
      
      // Determine the kind based on the role
      let kind: number;
      if (roleUpdate.role === "moderator") {
        kind = 30073;
      } else {
        throw new Error(`Invalid role: ${roleUpdate.role}`);
      }
      
      // Handle add/remove action
      if (roleUpdate.action === "add") {
        // Create an event for adding a moderator
        const now = Math.floor(Date.now() / 1000);
        
        const event = {
          kind: kind,
          created_at: now,
          tags: [["d", daoId], ["p", roleUpdate.pubkey]],
          content: ""
        };
        
        const publishResult = await this.adapter.publishEvent(event);
        console.log("DAO moderator add result:", publishResult);
        
        if (publishResult) {
          // Update DAO moderators list in cache
          await daoCache.addDAOModerator(daoId, roleUpdate.pubkey);
          return true;
        }
      } else if (roleUpdate.action === "remove") {
        // To remove a moderator, we publish a deletion event (kind 5) targeting the moderator event (kind 30073)
        
        // First, find the original moderator event
        const filter = {
          kinds: [kind],
          tags: [["d", daoId], ["p", roleUpdate.pubkey]],
          limit: 1
        };
        
        const events = await this.adapter.getEvents([filter]);
        
        if (!events || events.length === 0) {
          console.log(`No DAO moderator event found for user ${roleUpdate.pubkey} in DAO ${daoId}.`);
          return false;
        }
        
        const moderatorEvent = events[0];
        
        // Create a deletion event
        const now = Math.floor(Date.now() / 1000);
        
        const event = {
          kind: 5,
          created_at: now,
          tags: [["e", moderatorEvent.id]],
          content: `Removing moderator ${roleUpdate.pubkey} from DAO ${daoId}`
        };
        
        const publishResult = await this.adapter.publishEvent(event);
        console.log("DAO moderator remove result:", publishResult);
        
        if (publishResult) {
          // Update DAO moderators list in cache
          await daoCache.removeDAOModerator(daoId, roleUpdate.pubkey);
          return true;
        }
      } else {
        throw new Error(`Invalid action: ${roleUpdate.action}`);
      }
      
      return false;
    } catch (error) {
      console.error("Error updating DAO roles:", error);
      return false;
    }
  }
  
  // Create DAO invite link
  async createDAOInvite(daoId: string): Promise<string | null> {
    try {
      const pubkey = this.getPubkey();
      if (!pubkey) {
        throw new Error("User not logged in");
      }
      
      console.log(`Creating invite link for DAO ${daoId}`);
      
      // Generate a unique ID for the invite
      const inviteId = crypto.randomUUID();
      
      // Create an event for this DAO invite
      const now = Math.floor(Date.now() / 1000);
      
      const event = {
        kind: 9000, // Custom kind for DAO invites
        created_at: now,
        tags: [["d", daoId], ["invite", inviteId]],
        content: ""
      };
      
      const publishResult = await this.adapter.publishEvent(event);
      console.log("DAO invite creation result:", publishResult);
      
      if (publishResult) {
        return inviteId;
      }
      
      return null;
    } catch (error) {
      console.error("Error creating DAO invite:", error);
      return null;
    }
  }
  
  // Create a new proposal
  async createProposal(daoId: string, title: string, description: string, options: string[], durationDays: number = 7): Promise<string | null> {
    try {
      const pubkey = this.getPubkey();
      if (!pubkey) {
        throw new Error("User not logged in");
      }
      
      console.log(`Creating proposal for DAO ${daoId}: ${title}`);
      
      // Generate a unique ID for the proposal
      const proposalId = crypto.randomUUID();
      
      // Calculate the end time of the proposal
      const now = Math.floor(Date.now() / 1000);
      const durationSeconds = durationDays * 24 * 60 * 60;
      const endTime = now + durationSeconds;
      
      // Create the proposal object
      const proposalContent = {
        id: proposalId,
        daoId,
        title,
        description,
        options,
        creator: pubkey,
        startTime: now,
        endTime,
        votes: {}
      };
      
      // Create an event for this proposal
      const tags = [
        ["d", proposalId],
        ["dao", daoId],
        ["title", title],
        ["nip72", "dao-proposal"],
      ];
      
      const event = {
        kind: 7000, // Custom kind for DAO proposals
        created_at: now,
        tags,
        content: JSON.stringify(proposalContent)
      };
      
      const publishResult = await this.adapter.publishEvent(event);
      console.log("DAO proposal creation result:", publishResult);
      
      if (publishResult) {
        return proposalId;
      }
      
      return null;
    } catch (error) {
      console.error("Error creating DAO proposal:", error);
      return null;
    }
  }
  
  // Create a kick proposal
  async createKickProposal(daoId: string, title: string, description: string, options: string[], memberToKick: string): Promise<string | null> {
    try {
      const pubkey = this.getPubkey();
      if (!pubkey) {
        throw new Error("User not logged in");
      }
      
      console.log(`Creating kick proposal for DAO ${daoId}: ${title}`);
      
      // Generate a unique ID for the proposal
      const proposalId = crypto.randomUUID();
      
      // Calculate the end time of the proposal
      const now = Math.floor(Date.now() / 1000);
      const durationDays = 7; // Default duration of 7 days
      const durationSeconds = durationDays * 24 * 60 * 60;
      const endTime = now + durationSeconds;
      
      // Create the proposal object with kick metadata
      const proposalContent = {
        id: proposalId,
        daoId,
        title,
        description,
        options,
        creator: pubkey,
        startTime: now,
        endTime,
        votes: {},
        kick: memberToKick // Add the member to kick to the proposal content
      };
      
      // Create an event for this proposal
      const tags = [
        ["d", proposalId],
        ["dao", daoId],
        ["title", title],
        ["nip72", "dao-kick-proposal"], // Different NIP-72 tag for kick proposals
        ["member", memberToKick] // Tag the member being kicked
      ];
      
      const event = {
        kind: 7000, // Custom kind for DAO proposals
        created_at: now,
        tags,
        content: JSON.stringify(proposalContent)
      };
      
      const publishResult = await this.adapter.publishEvent(event);
      console.log("DAO kick proposal creation result:", publishResult);
      
      if (publishResult) {
        return proposalId;
      }
      
      return null;
    } catch (error) {
      console.error("Error creating DAO kick proposal:", error);
      return null;
    }
  }
  
  // Vote on a proposal
  async voteOnProposal(proposalId: string, optionIndex: number): Promise<boolean> {
    try {
      const pubkey = this.getPubkey();
      if (!pubkey) {
        throw new Error("User not logged in");
      }
      
      console.log(`Voting on proposal ${proposalId}, option ${optionIndex}`);
      
      // Create an event for this vote
      const now = Math.floor(Date.now() / 1000);
      
      const event = {
        kind: 7001, // Custom kind for DAO proposal votes
        created_at: now,
        tags: [["d", proposalId], ["option", optionIndex.toString()]],
        content: ""
      };
      
      const publishResult = await this.adapter.publishEvent(event);
      console.log("DAO proposal vote result:", publishResult);
      
      return publishResult;
    } catch (error) {
      console.error("Error voting on DAO proposal:", error);
      return false;
    }
  }
  
  // Get DAO proposals
  async getDAOProposals(daoId: string): Promise<DAOProposal[]> {
    try {
      console.log(`Fetching proposals for DAO ${daoId}...`);
      
      const filter = {
        kinds: [7000], // Custom kind for DAO proposals
        tags: [["dao", daoId]],
        limit: 100
      };
      
      const events = await this.adapter.getEvents([filter]);
      
      if (!events || events.length === 0) {
        console.log(`No DAO proposals found for DAO ${daoId}.`);
        return [];
      }
      
      const proposals: DAOProposal[] = events.map(event => {
        try {
          const proposal = JSON.parse(event.content);
          return {
            ...proposal,
            startTime: proposal.startTime,
            endTime: proposal.endTime,
            votes: proposal.votes || {}
          };
        } catch (error) {
          console.error("Error parsing DAO proposal event:", event, error);
          return null;
        }
      }).filter(proposal => proposal !== null) as DAOProposal[];
      
      return proposals;
    } catch (error) {
      console.error(`Error fetching proposals for DAO ${daoId}:`, error);
      return [];
    }
  }
  
  // Get DAO kick proposals
  async getDAOKickProposals(daoId: string): Promise<any[]> {
    try {
      console.log(`Fetching kick proposals for DAO ${daoId}...`);
      
      const filter = {
        kinds: [7000], // Custom kind for DAO proposals
        tags: [
          ["dao", daoId],
          ["nip72", "dao-kick-proposal"] // Filter by kick proposals
        ],
        limit: 100
      };
      
      const events = await this.adapter.getEvents([filter]);
      
      if (!events || events.length === 0) {
        console.log(`No DAO kick proposals found for DAO ${daoId}.`);
        return [];
      }
      
      const proposals: any[] = events.map(event => {
        try {
          const proposal = JSON.parse(event.content);
          return {
            ...proposal,
            startTime: proposal.startTime,
            endTime: proposal.endTime,
            votes: proposal.votes || {}
          };
        } catch (error) {
          console.error("Error parsing DAO kick proposal event:", event, error);
          return null;
        }
      }).filter(proposal => proposal !== null) as any[];
      
      return proposals;
    } catch (error) {
      console.error(`Error fetching kick proposals for DAO ${daoId}:`, error);
      return [];
    }
  }
}

export const daoService = new DAOService();
