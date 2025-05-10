
import { toast } from "sonner";

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

export class AlephiumService {
  private static instance: AlephiumService;
  private isConnected: boolean = false;
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

  public isWalletAvailable(): boolean {
    return typeof window !== 'undefined' && 
           (window as any).alephium !== undefined;
  }

  public async connectWallet(): Promise<boolean> {
    try {
      // Check if alephium wallet extension exists
      if (!this.isWalletAvailable()) {
        toast.error("Alephium wallet extension not found. Please install it first.");
        console.error("Alephium wallet not available in window object");
        // Open wallet installation page
        window.open("https://chrome.google.com/webstore/detail/alephium-extension-wallet/gdokollfhmnbfckbobkdbakhidagfcjj", "_blank");
        return false;
      }
      
      const alephium = (window as any).alephium;
      
      // For development/testing, provide a mock wallet if real one is not available
      if (process.env.NODE_ENV === 'development' && !alephium) {
        console.log("Using mock wallet for development");
        this.isConnected = true;
        this.currentAddress = "1DrDyTr9RpRsQnDnXo2YRiPzPW4ooHX5LLoqXrqfMrpQH";
        await this.fetchBalances();
        toast.success("Connected to mock wallet (development mode)");
        return true;
      }
      
      await alephium.enable();
      console.log("Wallet enabled successfully");

      // Set connection status
      this.isConnected = true;
      
      // Get current address
      const addresses = await alephium.getAccounts();
      console.log("Accounts received:", addresses);
      
      if (addresses && addresses.length > 0) {
        this.currentAddress = addresses[0];
        await this.fetchBalances();
        toast.success("Wallet connected successfully");
        return true;
      } else {
        toast.error("No accounts found in the wallet");
        console.error("No accounts found in wallet");
        this.isConnected = false;
        return false;
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      toast.error(`Failed to connect wallet: ${error instanceof Error ? error.message : "Unknown error"}`);
      this.isConnected = false;
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    this.isConnected = false;
    this.currentAddress = null;
    this.balances = [];
    toast.success("Wallet disconnected");
  }

  public async fetchBalances(): Promise<WalletBalance[]> {
    if (!this.isConnected || !this.currentAddress) {
      return [];
    }

    try {
      // In a real implementation, we would call the Alephium API here
      // For this demo, we'll use mock data
      this.balances = [{
        address: this.currentAddress,
        balance: "10.5",
        tokens: [
          {
            id: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
            symbol: "ALPH",
            name: "Alephium",
            balance: "10.5",
            decimals: 18,
            logo: "https://cryptologos.cc/logos/alephium-alph-logo.png"
          },
          {
            id: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
            symbol: "TOKEN",
            name: "Example Token",
            balance: "100",
            decimals: 18
          }
        ]
      }];
      
      return this.balances;
    } catch (error) {
      console.error("Failed to fetch balances:", error);
      toast.error("Failed to fetch wallet balances");
      return [];
    }
  }

  public getBalances(): WalletBalance[] {
    return this.balances;
  }

  public getCurrentAddress(): string | null {
    return this.currentAddress;
  }

  public isWalletConnected(): boolean {
    return this.isConnected;
  }

  // Listen for account changes
  public setupEventListeners(): void {
    if (this.isWalletAvailable()) {
      const alephium = (window as any).alephium;
      if (alephium && alephium.on) {
        alephium.on('accountsChanged', async (accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            this.currentAddress = accounts[0];
            await this.fetchBalances();
            toast.info("Account changed");
          } else {
            this.isConnected = false;
            this.currentAddress = null;
            this.balances = [];
          }
        });
      }
    }
  }
}

export const alephiumService = AlephiumService.getInstance();
