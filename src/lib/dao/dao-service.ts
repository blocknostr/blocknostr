
import { toast } from "sonner";
import { Event, Filter } from 'nostr-tools';
import { convertToFilter, flattenPromises, promiseAny } from './dao-utils';
import { DAO, DAOProposal } from "@/types/dao";
import { nostrService } from '@/lib/nostr';

export class DAOService {
  private service: any; // Service for Nostr operations
  private adapterInstance: any; // Instance of NostrAdapter

  constructor(service: any, adapterInstance: any) {
    this.service = service;
    this.adapterInstance = adapterInstance;
  }

  async getDAOById(daoId: string): Promise<DAO | null> {
    try {
      const result = await this.service.getDAOById(daoId);
      return result;
    } catch (error) {
      console.error("Error fetching DAO by ID:", error);
      return null;
    }
  }

  async getDAOs(): Promise<DAO[]> {
    try {
      // Implementation for fetching all DAOs
      return [];
    } catch (error) {
      console.error("Error fetching DAOs:", error);
      return [];
    }
  }

  async getUserDAOs(pubkey: string): Promise<DAO[]> {
    try {
      // Implementation for fetching user DAOs
      return [];
    } catch (error) {
      console.error("Error fetching user DAOs:", error);
      return [];
    }
  }

  async getTrendingDAOs(): Promise<DAO[]> {
    try {
      // Implementation for fetching trending DAOs
      return [];
    } catch (error) {
      console.error("Error fetching trending DAOs:", error);
      return [];
    }
  }

  // IMPORTANT: Return a function directly, not a Promise<function>
  subscribeToUserDAOs(pubkey: string, callback: (dao: DAO) => void): () => void {
    try {
      // Setup subscription for user DAOs
      console.log("Setting up subscription for user DAOs");
      return () => {
        console.log("Cleaning up user DAOs subscription");
      };
    } catch (error) {
      console.error("Error subscribing to user DAOs:", error);
      return () => {};
    }
  }

  // IMPORTANT: Return a function directly, not a Promise<function>
  subscribeToDAOProposals(daoId: string, callback: (proposal: DAOProposal) => void): () => void {
    try {
      // Setup subscription for DAO proposals
      console.log("Setting up subscription for DAO proposals");
      return () => {
        console.log("Cleaning up DAO proposals subscription");
      };
    } catch (error) {
      console.error("Error subscribing to DAO proposals:", error);
      return () => {};
    }
  }

  async getDAOProposals(daoId: string): Promise<DAOProposal[]> {
    try {
      const proposals = await this.service.getDAOProposals(daoId);
      return proposals;
    } catch (error) {
      console.error("Error fetching DAO proposals:", error);
      return [];
    }
  }

  async createKickProposal(daoId: string, title: string, description: string): Promise<string | null> {
    try {
      const proposalId = await this.service.createKickProposal(daoId, title, description);
      return proposalId;
    } catch (error) {
      console.error("Error creating kick proposal:", error);
      return null;
    }
  }

  async voteOnProposal(proposalId: string, optionIndex: number): Promise<boolean> {
    try {
      const success = await this.service.voteOnProposal(proposalId, optionIndex);
      return success;
    } catch (error) {
      console.error("Error voting on proposal:", error);
      return false;
    }
  }

  voteOnKickProposal(proposalId: string, optionIndex: number): Promise<boolean> {
    // This is just a wrapper around voteOnProposal for semantic clarity
    return this.voteOnProposal(proposalId, optionIndex);
  }

  // IMPORTANT: Return a function directly, not a Promise<function>
  subscribeToDAOs(callback: (dao: DAO) => void): () => void {
    try {
      // Use the adapterInstance directly instead of adapter or getAdapter()
      const sub = this.adapterInstance.subscribeToEvents([{
        kinds: [30001], // DAO kind
        limit: 50
      }], [], {
        onevent: (event: any) => {
          // Parse the event to a DAO object
          const dao = this.parseDAOEvent(event);
          callback(dao);
        },
        onclose: () => {
          console.log("DAO subscription closed");
        }
      });
      
      // Return a proper cleanup function
      return () => {
        if (sub && typeof sub.unsubscribe === 'function') {
          sub.unsubscribe();
        }
      };
    } catch (error) {
      console.error("Error subscribing to DAOs:", error);
      return () => {};
    }
  }

  private parseDAOEvent(event: any): DAO {
    // Basic parsing function
    return {
      id: event.id,
      name: event.content?.name || "Unnamed DAO",
      description: event.content?.description || "",
      image: event.content?.image || "",
      creator: event.pubkey,
      createdAt: event.created_at,
      members: event.content?.members || [event.pubkey],
      moderators: event.content?.moderators || [],
      treasury: {
        balance: 0,
        tokenSymbol: "ALPH"
      },
      proposals: 0,
      activeProposals: 0,
      tags: event.content?.tags || []
    };
  }

  // IMPORTANT: Return a function directly, not a Promise<function>
  subscribeToDAO(daoId: string, callback: (dao: DAO) => void): () => void {
    try {
      // Use the adapterInstance property
      const sub = this.adapterInstance.subscribeToEvents([{
        ids: [daoId],
        kinds: [30001] // DAO kind
      }], [], {
        onevent: (event: any) => {
          const dao = this.parseDAOEvent(event);
          callback(dao);
        },
        onclose: () => {
          console.log("DAO subscription closed");
        }
      });
      
      // Return a proper cleanup function
      return () => {
        if (sub && typeof sub.unsubscribe === 'function') {
          sub.unsubscribe();
        }
      };
    } catch (error) {
      console.error("Error subscribing to DAO:", error);
      return () => {};
    }
  }

  async list(relays: string[], filter: Filter): Promise<Event[]> {
    const events = await this.adapterInstance.pool.list(relays, convertToFilter(filter));
    return events;
  }

  async createProposal(daoId: string, title: string, description: string, options: string[]): Promise<string | null> {
    try {
      const proposalId = await this.service.createProposal(daoId, title, description, options);
      return proposalId;
    } catch (error) {
      console.error("Error creating proposal:", error);
      return null;
    }
  }

  async createDAO(name: string, description: string, tags: string[] = []): Promise<string | null> {
    try {
      // Implementation for creating a DAO
      return "dao-id-placeholder";
    } catch (error) {
      console.error("Error creating DAO:", error);
      return null;
    }
  }

  async joinDAO(daoId: string): Promise<boolean> {
    try {
      // Implementation for joining a DAO
      return true;
    } catch (error) {
      console.error("Error joining DAO:", error);
      return false;
    }
  }

  async leaveDAO(daoId: string): Promise<boolean> {
    try {
      // Implementation for leaving a DAO
      return true;
    } catch (error) {
      console.error("Error leaving DAO:", error);
      return false;
    }
  }

  async deleteDAO(daoId: string): Promise<boolean> {
    try {
      // Implementation for deleting a DAO
      return true;
    } catch (error) {
      console.error("Error deleting DAO:", error);
      return false;
    }
  }

  async updateDAOMetadata(daoId: string, metadata: {type: string, [key: string]: any}): Promise<boolean> {
    try {
      // Implementation for updating DAO metadata
      return true;
    } catch (error) {
      console.error("Error updating DAO metadata:", error);
      return false;
    }
  }

  async updateDAOGuidelines(daoId: string, guidelines: string): Promise<boolean> {
    try {
      // Implementation for updating DAO guidelines
      return true;
    } catch (error) {
      console.error("Error updating DAO guidelines:", error);
      return false;
    }
  }

  async updateDAOTags(daoId: string, tags: string[]): Promise<boolean> {
    try {
      // Implementation for updating DAO tags
      return true;
    } catch (error) {
      console.error("Error updating DAO tags:", error);
      return false;
    }
  }

  async addDAOModerator(daoId: string, pubkey: string): Promise<boolean> {
    try {
      // Implementation for adding a DAO moderator
      return true;
    } catch (error) {
      console.error("Error adding DAO moderator:", error);
      return false;
    }
  }

  async removeDAOModerator(daoId: string, pubkey: string): Promise<boolean> {
    try {
      // Implementation for removing a DAO moderator
      return true;
    } catch (error) {
      console.error("Error removing DAO moderator:", error);
      return false;
    }
  }

  async createDAOInvite(daoId: string): Promise<string | null> {
    try {
      // Implementation for creating a DAO invite
      return "invite-id-placeholder";
    } catch (error) {
      console.error("Error creating DAO invite:", error);
      return null;
    }
  }

  async signEvent(event: Partial<Event>): Promise<Event> {
    return this.adapterInstance.signEvent(event);
  }

  async fetchAllProposals(daoId: string): Promise<DAOProposal[]> {
    const proposals = await this.getDAOProposals(daoId);
    return proposals;
  }

  async processPendingOperations() {
    // Implementation for processing pending operations
  }

  async getEventById(id: string): Promise<Event | null> {
    return this.adapterInstance.getEventById(id);
  }

  async getEvents(ids: string[]): Promise<Event[]> {
    return this.adapterInstance.getEvents(ids);
  }

  async getProfilesByPubkeys(pubkeys: string[]): Promise<any[]> {
    return this.adapterInstance.getProfilesByPubkeys(pubkeys);
  }

  async getUserProfile(pubkey: string): Promise<any | null> {
    return this.adapterInstance.getUserProfile(pubkey);
  }

  async verifyNip05(identifier: string, pubkey: string): Promise<boolean> {
    return this.adapterInstance.verifyNip05(identifier, pubkey);
  }

  async createCommunity(name: string, description: string): Promise<string | null> {
    return this.adapterInstance.createCommunity(name, description);
  }

  async publishRelayList(relays: { url: string, read: boolean, write: boolean }[]): Promise<boolean> {
    return this.adapterInstance.publishRelayList(relays);
  }
}

// Create and export the daoService instance
// Use the actual adapter instance if available, or a placeholder that will be updated later
export const daoService = new DAOService(
  nostrService,
  nostrService.getAdapter() || {}
);

// Ensure the adapter is set when it becomes available
if (!nostrService.getAdapter()) {
  setTimeout(() => {
    const adapter = nostrService.getAdapter();
    if (adapter) {
      // Update the adapterInstance on the daoService
      Object.defineProperty(daoService, 'adapterInstance', {
        value: adapter,
        writable: true
      });
    }
  }, 1000);
}
