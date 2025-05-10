import { toast } from "sonner";
import { 
  NodeProvider, 
  WalletConnector 
} from "@alephium/web3";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ExplorerProvider } from "@alephium/web3/dist/explorer";

export interface WalletBalance {
  address: string;
  balance: string;
  tokens: TokenBalance[];
}

export interface TokenBalance {
  id: string;
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  logo?: string;
}

// Create context for Alephium wallet
const AlephiumContext = createContext<{
  connector: WalletConnector | null;
  isConnected: boolean;
  address: string | null;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  balances: WalletBalance[];
  isLoading: boolean;
  refreshBalances: () => Promise<void>;
}>({
  connector: null,
  isConnected: false,
  address: null,
  connect: async () => false,
  disconnect: () => {},
  balances: [],
  isLoading: false,
  refreshBalances: async () => {},
});

export const useAlephiumWallet = () => useContext(AlephiumContext);

export const AlephiumWalletContext: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [connector, setConnector] = useState<WalletConnector | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // Initialize NodeProvider and WalletConnector
    const nodeProvider = new NodeProvider('https://node-v20.mainnet.alephium.org');
    const explorer = new ExplorerProvider('https://explorer-backend.mainnet.alephium.org');
    const walletConnector = new WalletConnector({
      nodeProvider,
      explorerProvider: explorer
    });
    
    setConnector(walletConnector);
    
    // Check if already connected
    const checkConnection = async () => {
      try {
        const isWalletConnected = await walletConnector.isConnected();
        if (isWalletConnected) {
          setIsConnected(true);
          const accounts = await walletConnector.getAccounts();
          if (accounts.length > 0) {
            setAddress(accounts[0]);
            fetchBalances(accounts[0], walletConnector);
          }
        }
      } catch (error) {
        console.error("Failed to check wallet connection:", error);
      }
    };
    
    checkConnection();
    
    return () => {
      // Cleanup if needed
    };
  }, []);
  
  const fetchBalances = async (addr: string, walletConnector: WalletConnector) => {
    setIsLoading(true);
    try {
      const addrBalance = await walletConnector.nodeProvider.addresses.getAddressesAddressBalance(addr);
      const tokenBalances = await walletConnector.explorerProvider.addresses.getTokenBalances(addr);
      
      const formattedBalance = (parseInt(addrBalance.balance) / 10**18).toFixed(4);
      
      const formattedTokens = tokenBalances.map((token) => ({
        id: token.tokenId,
        symbol: token.symbol || "Unknown",
        name: token.name || "Unknown Token",
        balance: (parseInt(token.balance) / 10**token.decimals).toFixed(4),
        decimals: token.decimals,
        logo: undefined // Explorer API doesn't provide logos
      }));
      
      setBalances([{
        address: addr,
        balance: formattedBalance,
        tokens: formattedTokens
      }]);
    } catch (error) {
      console.error("Failed to fetch balances:", error);
      toast.error("Failed to fetch wallet balances");
    } finally {
      setIsLoading(false);
    }
  };
  
  const connect = async (): Promise<boolean> => {
    if (!connector) {
      toast.error("Wallet connector not initialized");
      return false;
    }
    
    setIsLoading(true);
    try {
      await connector.connect();
      const isConnected = await connector.isConnected();
      
      if (isConnected) {
        setIsConnected(true);
        const accounts = await connector.getAccounts();
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          fetchBalances(accounts[0], connector);
        }
        toast.success("Wallet connected successfully");
        return true;
      } else {
        toast.error("Failed to connect wallet");
        return false;
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      toast.error(`Failed to connect wallet: ${error instanceof Error ? error.message : "Unknown error"}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  const disconnect = async () => {
    if (!connector) return;
    
    try {
      await connector.disconnect();
      setIsConnected(false);
      setAddress(null);
      setBalances([]);
      toast.success("Wallet disconnected");
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
      toast.error(`Failed to disconnect: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };
  
  const refreshBalances = async () => {
    if (!connector || !address) return;
    await fetchBalances(address, connector);
    toast.success("Balances refreshed");
  };
  
  return (
    <AlephiumContext.Provider value={{
      connector,
      isConnected,
      address,
      connect,
      disconnect,
      balances,
      isLoading,
      refreshBalances
    }}>
      {children}
    </AlephiumContext.Provider>
  );
};

export class AlephiumService {
  private static instance: AlephiumService;
  private currentAddress: string | null = null;
  private balances: WalletBalance[] = [];

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): AlephiumService {
    if (!AlephiumService.instance) {
      AlephiumService.instance = new AlephiumService();
    }
    return AlephiumService.instance;
  }

  // This is a helper function to format balances for display
  public formatBalances(rawBalances: any): WalletBalance[] {
    try {
      if (!rawBalances) {
        return [];
      }
      
      // Extract the main ALPH balance
      const alphBalance = rawBalances.balance ? (parseInt(rawBalances.balance) / 10**18).toFixed(4) : "0";
      
      // Format the tokens
      const tokens = rawBalances.tokenBalances ? 
        Object.entries(rawBalances.tokenBalances).map(([id, details]: [string, any]) => ({
          id,
          symbol: details.symbol || "Unknown",
          name: details.name || "Unknown Token",
          balance: (parseInt(details.balance) / 10**details.decimals).toFixed(4),
          decimals: details.decimals || 18,
          logo: details.logo || undefined
        })) : [];
      
      return [{
        address: this.currentAddress || "",
        balance: alphBalance,
        tokens: tokens as TokenBalance[]
      }];
    } catch (error) {
      console.error("Error formatting balances:", error);
      return [];
    }
  }

  public getCurrentAddress(): string | null {
    return this.currentAddress;
  }

  public setCurrentAddress(address: string | null): void {
    this.currentAddress = address;
  }

  public getBalances(): WalletBalance[] {
    return this.balances;
  }

  public setBalances(balances: WalletBalance[]): void {
    this.balances = balances;
  }
}

export const alephiumService = AlephiumService.getInstance();
