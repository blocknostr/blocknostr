import * as PIXI from 'pixi.js';
import { AnimatedSprite } from '@pixi/sprite-animated';
import { Emitter } from '@pixi/particle-emitter';
import { Sound as PixiSound } from '@pixi/sound'; // Ensured PixiSound alias for Sound
import { UIUtils } from '../utils/UIUtils';
import { toast } from 'sonner';

/**
 * Stats related to pet evolution, including all relevant pet stats.
 */
export interface EvolutionStats {
  level: number;
  experience: number;
  currentStage: number; // Renamed from evolutionStage for clarity in input
  happiness: number; // Added happiness
  energy: number; // Added energy
  petSprite: AnimatedSprite; // Added petSprite for direct manipulation if needed
  onEvolve: (update: EvolutionUpdate) => void; // Callback for when evolution occurs
}

/**
 * Defines the structure for evolution updates passed to callbacks.
 * These are the new values after an evolution check or action.
 */
export interface EvolutionUpdate {
  newLevel: number;
  newExperience: number;
  newStage: number;
}

/**
 * Manages pet evolution and leveling
 */
export class EvolutionManager {
  /**
   * Check if pet should level up or evolve based on its current stats.
   * Calls the onEvolve callback if an evolution or level up occurs.
   */
  static checkAndProcessEvolution(
    stats: EvolutionStats,
    stageContainer: PIXI.Container, // For UI messages
    petName: string, // For UI messages
    evolveSound: PixiSound | null, // Changed to PixiSound
    ticker: PIXI.ticker.Ticker // Corrected to PIXI.ticker.Ticker
  ): void {
    const xpNeeded = stats.level * 100;
    let evolved = false;
    let leveledUp = false;

    let newLevel = stats.level;
    let newExperience = stats.experience;
    let newStage = stats.currentStage;

    if (newExperience >= xpNeeded) {
      newLevel += 1;
      newExperience -= xpNeeded;
      leveledUp = true;

      if (newLevel >= 10 && newStage === 1) {
        newStage = 2;
        evolved = true;
      } else if (newLevel >= 20 && newStage === 2) {
        newStage = 3;
        evolved = true;
      }

      if (!evolved) { // Only show level up message if no evolution occurred with this level up
        UIUtils.showMessage(stageContainer, ` ${petName} leveled up to ${newLevel}!`, 0xffffff, ticker);
      }
    }

    // If evolution occurred, trigger sound and message
    if (evolved) {
      evolveSound?.play();
      UIUtils.showMessage(stageContainer, ` ${petName} evolved to Stage ${newStage}!`, 0xffff00, ticker);
    }

    // If any change occurred, call the onEvolve callback
    if (evolved || leveledUp) {
      stats.onEvolve({
        newLevel: newLevel,
        newExperience: newExperience,
        newStage: newStage,
      });
    }
  }

  // evolveStage might be deprecated if checkAndProcessEvolution handles all logic including UI.
  // Kept for now if direct stage evolution is ever needed, but it's simplified.
  /**
   * Primarily for triggering evolution effects if evolution is handled externally.
   * Consider integrating fully into checkAndProcessEvolution.
   */
  static triggerEvolutionEffects(
    stageContainer: PIXI.Container,
    petName: string,
    finalStageNumber: number,
    evolveSound: PixiSound | null, // Changed to PixiSound
    ticker: PIXI.ticker.Ticker // Corrected to PIXI.ticker.Ticker
  ): void {
    evolveSound?.play();
    UIUtils.showMessage(stageContainer, ` ${petName} has reached Stage ${finalStageNumber}!`, 0xffff00, ticker);
  }
}