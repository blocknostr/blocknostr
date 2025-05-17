import { toast } from "sonner";
import { daoService } from "@/lib/dao/dao-service";
import { DAO, DAOProposal } from "@/types/dao";
import { nostrService } from "@/lib/nostr";
import { Event, Filter } from 'nostr-tools';
import { convertToFilter, flattenPromises, promiseAny } from './dao-utils';

export class DAOService {
  private _service: any; // Replace with actual service type
  private adapter: any; // Replace with actual adapter type

  constructor(service: any, adapter: any) {
    this._service = service;
    this.adapter = adapter;
  }

  async getDAOById(daoId: string): Promise<DAO | null> {
    try {
      const result = await this._service.getDAOById(daoId);
      return result;
    } catch (error) {
      console.error("Error fetching DAO by ID:", error);
      return null;
    }
  }

  async getDAOProposals(daoId: string): Promise<DAOProposal[]> {
    try {
      const proposals = await this._service.getDAOProposals(daoId);
      return proposals;
    } catch (error) {
      console.error("Error fetching DAO proposals:", error);
      return [];
    }
  }

  async createKickProposal(daoId: string, title: string, description: string): Promise<string | null> {
    try {
      const proposalId = await this._service.createKickProposal(daoId, title, description);
      return proposalId;
    } catch (error) {
      console.error("Error creating kick proposal:", error);
      return null;
    }
  }

  async voteOnProposal(proposalId: string, optionIndex: number): Promise<boolean> {
    try {
      const success = await this._service.voteOnProposal(proposalId, optionIndex);
      return success;
    } catch (error) {
      console.error("Error voting on proposal:", error);
      return false;
    }
  }

  async subscribeToDAOs(callback: (dao: DAO) => void): Promise<void> {
    const unsubscribe = this.adapter.pool.subscribeToEvents([], (dao: DAO) => {
      callback(dao);
    });
    return unsubscribe;
  }

  async subscribeToDAO(daoId: string, callback: (dao: DAO) => void): Promise<void> {
    const unsubscribe = this.adapter.pool.subscribeToEvents([], (dao: DAO) => {
      callback(dao);
    });
    return unsubscribe;
  }

  async list(relays: string[], filter: Filter): Promise<Event[]> {
    const events = await this.adapter.pool.list(relays, convertToFilter(filter));
    return events;
  }

  async createProposal(daoId: string, title: string, description: string, options: string[]): Promise<string | null> {
    try {
      const proposalId = await this._service.createProposal(daoId, title, description, options);
      return proposalId;
    } catch (error) {
      console.error("Error creating proposal:", error);
      return null;
    }
  }

  async signEvent(event: Partial<Event>): Promise<Event> {
    return this.adapter.signEvent(event);
  }

  async fetchAllProposals(daoId: string): Promise<DAOProposal[]> {
    const proposals = await this.getDAOProposals(daoId);
    return proposals;
  }

  async processPendingOperations() {
    // Implementation for processing pending operations
  }

  async getEventById(id: string): Promise<Event | null> {
    return this.adapter.getEventById(id);
  }

  async getEvents(ids: string[]): Promise<Event[]> {
    return this.adapter.getEvents(ids);
  }

  async getProfilesByPubkeys(pubkeys: string[]): Promise<any[]> {
    return this.adapter.getProfilesByPubkeys(pubkeys);
  }

  async getUserProfile(pubkey: string): Promise<any | null> {
    return this.adapter.getUserProfile(pubkey);
  }

  async verifyNip05(identifier: string, pubkey: string): Promise<boolean> {
    return this.adapter.verifyNip05(identifier, pubkey);
  }

  async createCommunity(name: string, description: string): Promise<string | null> {
    return this.adapter.createCommunity(name, description);
  }

  async publishRelayList(relays: { url: string, read: boolean, write: boolean }[]): Promise<boolean> {
    return this.adapter.publishRelayList(relays);
  }
}
