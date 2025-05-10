
import { toast } from "sonner";
import { AlephiumWalletState, Transaction, WalletEvent } from './types';
import { STORAGE_KEYS, NETWORKS, ERROR_MESSAGES, WALLET_EVENTS } from './constants';

class AlephiumWalletManager {
  private _state: AlephiumWalletState = {
    connected: false,
    address: null,
    balance: null,
    network: null,
    connecting: false,
    error: null
  };
  
  private _eventListeners: Map<string, Function[]> = new Map();
  private _balanceUnsubscribe: (() => void) | null = null;
  
  constructor() {
    this.loadSavedState();
    this.checkExtension();
  }
  
  get state(): AlephiumWalletState {
    return { ...this._state };
  }
  
  get isConnected(): boolean {
    return this._state.connected;
  }
  
  get address(): string | null {
    return this._state.address;
  }
  
  get balance(): string | null {
    return this._state.balance;
  }
  
  get network(): string | null {
    return this._state.network;
  }
  
  private loadSavedState(): void {
    const savedAddress = localStorage.getItem(STORAGE_KEYS.CONNECTED_ADDRESS);
    if (savedAddress) {
      this._state.address = savedAddress;
    }
  }
  
  private async checkExtension(): Promise<boolean> {
    if (!window.alephium) {
      this._state.error = ERROR_MESSAGES.NO_EXTENSION;
      return false;
    }
    
    // Check if already connected
    try {
      const isConnected = await window.alephium.isConnected();
      
      if (isConnected) {
        await this.restoreConnection();
      }
      
      return isConnected;
    } catch (error) {
      console.error("Error checking extension connection:", error);
      return false;
    }
  }
  
  private async restoreConnection(): Promise<void> {
    try {
      // Get active address
      const activeAddress = window.alephium?.address.activeAddress;
      
      if (activeAddress) {
        this._state.address = activeAddress;
        this._state.connected = true;
        
        // Get network
        const network = await window.alephium.getNetwork();
        this._state.network = NETWORKS[network.networkId] || 'unknown';
        
        // Get balance
        await this.updateBalance();
        
        // Subscribe to balance changes
        this.subscribeToBalanceChanges();
        
        this.emit(WALLET_EVENTS.CONNECT, { address: activeAddress });
      }
    } catch (error) {
      console.error("Error restoring connection:", error);
    }
  }
  
  async connect(): Promise<boolean> {
    if (this._state.connecting) return false;
    
    if (!window.alephium) {
      toast.error(ERROR_MESSAGES.NO_EXTENSION);
      this._state.error = ERROR_MESSAGES.NO_EXTENSION;
      return false;
    }
    
    this._state.connecting = true;
    
    try {
      // Request connection to wallet
      const addresses = await window.alephium.enable();
      
      if (addresses && addresses.length > 0) {
        const address = addresses[0];
        
        this._state.address = address;
        this._state.connected = true;
        this._state.error = null;
        
        // Save to localStorage
        localStorage.setItem(STORAGE_KEYS.CONNECTED_ADDRESS, address);
        
        // Get network
        const network = await window.alephium.getNetwork();
        this._state.network = NETWORKS[network.networkId] || 'unknown';
        
        // Get balance
        await this.updateBalance();
        
        // Subscribe to balance changes
        this.subscribeToBalanceChanges();
        
        toast.success("Wallet connected successfully");
        this.emit(WALLET_EVENTS.CONNECT, { address });
        
        return true;
      } else {
        throw new Error("No addresses returned from wallet");
      }
    } catch (error) {
      console.error("Connection error:", error);
      toast.error(ERROR_MESSAGES.CONNECTION_FAILED);
      this._state.error = ERROR_MESSAGES.CONNECTION_FAILED;
      
      this.emit(WALLET_EVENTS.ERROR, { error });
      return false;
    } finally {
      this._state.connecting = false;
    }
  }
  
  async disconnect(): Promise<void> {
    // Unsubscribe from balance changes
    if (this._balanceUnsubscribe) {
      this._balanceUnsubscribe();
      this._balanceUnsubscribe = null;
    }
    
    // Clear state
    this._state = {
      connected: false,
      address: null,
      balance: null,
      network: null,
      connecting: false,
      error: null
    };
    
    // Clear localStorage
    localStorage.removeItem(STORAGE_KEYS.CONNECTED_ADDRESS);
    
    this.emit(WALLET_EVENTS.DISCONNECT, {});
    toast.success("Wallet disconnected");
  }
  
  async updateBalance(): Promise<void> {
    if (!this._state.address || !window.alephium) return;
    
    try {
      const result = await window.alephium.getBalance(this._state.address);
      this._state.balance = result.balance;
    } catch (error) {
      console.error("Error getting balance:", error);
    }
  }
  
  private subscribeToBalanceChanges(): void {
    if (!this._state.address || !window.alephium) return;
    
    // Unsubscribe if already subscribed
    if (this._balanceUnsubscribe) {
      this._balanceUnsubscribe();
    }
    
    this._balanceUnsubscribe = window.alephium.subscribeBalanceChange((balance) => {
      this._state.balance = balance;
      this.emit('balanceChanged', { balance });
    });
  }
  
  async signMessage(message: string): Promise<string | null> {
    if (!this._state.address || !window.alephium) {
      toast.error("Wallet not connected");
      return null;
    }
    
    try {
      return await window.alephium.address.sign(message);
    } catch (error) {
      console.error("Error signing message:", error);
      toast.error(ERROR_MESSAGES.SIGN_FAILED);
      return null;
    }
  }
  
  async sendTransaction(
    to: string, 
    amount: string
  ): Promise<string | null> {
    if (!this._state.address || !window.alephium) {
      toast.error("Wallet not connected");
      return null;
    }
    
    try {
      const result = await window.alephium.transactions.send({
        from: this._state.address,
        to: to,
        amount: amount
      });
      
      toast.success("Transaction sent successfully");
      return result.txId;
    } catch (error) {
      console.error("Error sending transaction:", error);
      toast.error(ERROR_MESSAGES.TRANSACTION_FAILED);
      return null;
    }
  }
  
  // Event handling
  on(event: string, callback: Function): void {
    if (!this._eventListeners.has(event)) {
      this._eventListeners.set(event, []);
    }
    this._eventListeners.get(event)?.push(callback);
  }
  
  off(event: string, callback: Function): void {
    const callbacks = this._eventListeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }
  
  private emit(event: string, data: any): void {
    const callbacks = this._eventListeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }
  
  // Format address for display
  formatAddress(address: string, startLength: number = 6, endLength: number = 4): string {
    if (!address) return '';
    if (address.length <= startLength + endLength) return address;
    
    return `${address.substring(0, startLength)}...${address.substring(address.length - endLength)}`;
  }
}

export default AlephiumWalletManager;
