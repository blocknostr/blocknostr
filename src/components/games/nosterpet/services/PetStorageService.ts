
import { PetState } from '../types/PetTypes';

/**
 * Handles loading and saving pet data
 */
export class PetStorageService {
  /**
   * Load pet state from localStorage
   */
  static loadState(walletAddress: string): PetState | null {
    try {
      const savedState = localStorage.getItem(`nosterpet_${walletAddress}`);
      
      if (savedState) {
        return JSON.parse(savedState) as PetState;
      }
      
      return null;
    } catch (error) {
      console.error("Failed to load pet state:", error);
      return null;
    }
  }

  /**
   * Save pet state to localStorage
   */
  static saveState(walletAddress: string, state: PetState): void {
    try {
      localStorage.setItem(`nosterpet_${walletAddress}`, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save pet state:", error);
    }
  }
}
