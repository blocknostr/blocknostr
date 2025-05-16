
/**
 * Type definitions for NostrPet game
 */

export interface PetState {
  id: string;
  name: string;
  hunger: number;
  happiness: number;
  energy: number;
  level: number;
  experience: number;
  evolutionStage: number;
  customization: PetCustomization;
  inventory: InventoryItem[];
  lastReward: number;
  lastEvent: number;
}

export interface PetCustomization {
  color: string;
  accessory: string;
  aura: string;
}

export interface InventoryItem {
  itemId: string;
  quantity: number;
}
