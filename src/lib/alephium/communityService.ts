
import { NodeProvider, SignerProvider, 
  ExplorerProvider, Script, BuildScriptTxResult } from '@alephium/web3'
import { web3 } from '@alephium/web3'
import { getContractBytecode, executeAndSubscribe } from '@/lib/alephium/utils'
import { toast } from 'sonner'

// Define types for our Communities
export interface AlephiumCommunity {
  contractId: string;
  txId: string;
  address: string;
  name: string;
  description: string;
  creator: string;
  memberCount: number;
  isPrivate: boolean;
  createdAt: number;
  members: string[];
  moderators: string[];
}

export interface CreateCommunityParams {
  name: string;
  description: string;
  isPrivate: boolean;
  initialTreasury?: number; // in ALPH
  minQuorum?: number; // 0-100
  votingDuration?: number; // in seconds
}

class AlephiumCommunityService {
  private nodeProvider?: NodeProvider;
  private signerProvider?: SignerProvider;
  private explorerProvider?: ExplorerProvider;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeProviders();
    }
  }

  private initializeProviders() {
    try {
      this.nodeProvider = web3.getCurrentNodeProvider();
      this.signerProvider = web3.getCurrentSignerProvider();
      this.explorerProvider = web3.getCurrentExplorerProvider();
    } catch (error) {
      console.error('Failed to initialize Alephium providers:', error);
    }
  }

  public async isWalletConnected(): Promise<boolean> {
    if (!this.signerProvider) {
      return false;
    }
    
    try {
      const accounts = await this.signerProvider.getAccounts();
      return accounts.length > 0;
    } catch (error) {
      console.error('Failed to check wallet connection:', error);
      return false;
    }
  }

  public async createCommunity(params: CreateCommunityParams): Promise<string | undefined> {
    if (!this.signerProvider || !this.nodeProvider) {
      toast.error('Wallet not connected');
      return;
    }

    try {
      // Convert strings to ByteVec format for the contract
      const nameBytes = web3.stringToHex(params.name);
      const descriptionBytes = web3.stringToHex(params.description);
      
      // Get the current account
      const accounts = await this.signerProvider.getAccounts();
      if (accounts.length === 0) {
        toast.error('No accounts found');
        return;
      }
      
      const creator = accounts[0];
      
      // Get contract bytecode
      const bytecode = await getContractBytecode('CommunityDAO');
      
      // Build the contract deployment transaction
      const initialTreasury = params.initialTreasury ?? 0;
      const minQuorum = params.minQuorum ?? 50; // Default 50%
      const votingDuration = params.votingDuration ?? 86400; // Default 1 day
      
      const deployContractTx = await this.signerProvider.buildDeployContractTx({
        bytecode,
        initialFields: {
          creator: creator,
          communityName: nameBytes,
          communityDescription: descriptionBytes,
          isPrivate: params.isPrivate,
          initialTreasuryAmount: initialTreasury.toString(),
          minQuorum: minQuorum.toString(),
          minVotingDuration: votingDuration.toString()
        }
      });
      
      // Sign and submit the transaction
      const deployResult = await executeAndSubscribe(
        this.signerProvider,
        deployContractTx,
        'Creating community...',
        'Community created successfully!',
        'Failed to create community'
      );
      
      if (!deployResult?.txId) {
        throw new Error('No transaction ID returned');
      }
      
      // Return the transaction ID
      return deployResult.txId;
    } catch (error) {
      console.error('Error creating community:', error);
      toast.error('Failed to create community', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
      return undefined;
    }
  }

  public async joinCommunity(contractId: string): Promise<boolean> {
    if (!this.signerProvider || !this.nodeProvider) {
      toast.error('Wallet not connected');
      return false;
    }
    
    try {
      // Build the script to call the joinCommunity function
      const script: Script = {
        scriptType: 'contract',
        contractAddress: contractId,
        methodName: 'joinCommunity',
        args: [] // No arguments needed for join
      };
      
      const result = await this.signerProvider.buildScriptTx({
        script
      });
      
      // Sign and submit the transaction
      const txResult = await executeAndSubscribe(
        this.signerProvider,
        result,
        'Joining community...',
        'Joined community successfully!',
        'Failed to join community'
      );
      
      return !!txResult?.txId;
    } catch (error) {
      console.error('Error joining community:', error);
      toast.error('Failed to join community', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  public async leaveCommunity(contractId: string): Promise<boolean> {
    if (!this.signerProvider || !this.nodeProvider) {
      toast.error('Wallet not connected');
      return false;
    }
    
    try {
      // Build the script to call the leaveCommunity function
      const script: Script = {
        scriptType: 'contract',
        contractAddress: contractId,
        methodName: 'leaveCommunity',
        args: [] // No arguments needed for leave
      };
      
      const result = await this.signerProvider.buildScriptTx({
        script
      });
      
      // Sign and submit the transaction
      const txResult = await executeAndSubscribe(
        this.signerProvider,
        result,
        'Leaving community...',
        'Left community successfully!',
        'Failed to leave community'
      );
      
      return !!txResult?.txId;
    } catch (error) {
      console.error('Error leaving community:', error);
      toast.error('Failed to leave community', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  public async createProposal(contractId: string, description: string, duration: number): Promise<boolean> {
    if (!this.signerProvider || !this.nodeProvider) {
      toast.error('Wallet not connected');
      return false;
    }
    
    try {
      // Convert the description to ByteVec format
      const descriptionBytes = web3.stringToHex(description);
      
      // Build the script to call the createProposal function
      const script: Script = {
        scriptType: 'contract',
        contractAddress: contractId,
        methodName: 'createProposal',
        args: [
          { type: 'ByteVec', value: descriptionBytes },
          { type: 'U256', value: duration.toString() }
        ]
      };
      
      const result = await this.signerProvider.buildScriptTx({
        script
      });
      
      // Sign and submit the transaction
      const txResult = await executeAndSubscribe(
        this.signerProvider,
        result,
        'Creating proposal...',
        'Proposal created successfully!',
        'Failed to create proposal'
      );
      
      return !!txResult?.txId;
    } catch (error) {
      console.error('Error creating proposal:', error);
      toast.error('Failed to create proposal', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }
  
  // Additional methods like addModerator, removeModerator, etc. would be implemented here
}

export const alephiumCommunityService = new AlephiumCommunityService();
