
import { toast } from "sonner";
import { 
  AlephiumConnectProvider, 
  AlephiumWalletProvider, 
  useAlephiumConnectContext,
  AlephiumConnectButton as WcAlephiumConnectButton
} from "@alephium/web3-react";

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

export const AlephiumConnectButton = WcAlephiumConnectButton;

// Fixed the component to be a proper functional React component
export const AlephiumWalletContext = ({ children }: { children: React.ReactNode }) => {
  return (
    <AlephiumConnectProvider
      projectId="840a690e3ccb0cd3cb3189c0cd37a877"
      network="mainnet"
      theme="dark"
      dAppName="BlockNoster"
      autoConnect={true}
    >
      <AlephiumWalletProvider>
        {children}
      </AlephiumWalletProvider>
    </AlephiumConnectProvider>
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
