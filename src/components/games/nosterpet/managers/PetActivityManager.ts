import * as PIXI from 'pixi.js';
import { AnimatedSprite } from '@pixi/sprite-animated';
import { Assets } from '@pixi/assets';
import { Sound } from '@pixi/sound';

export interface PetStatsInput {
  hunger: number;
  energy: number;
  experience: number;
  level: number;
  pet: AnimatedSprite;
  stats: { hunger: number; energy: number; experience: number; level: number; happiness: number };
  onUpdateStats: (stats: PetStatsUpdate) => void;
}

export interface PetStatsUpdate {
  hunger?: number;
  energy?: number;
  happiness?: number;
  experience?: number;
  level?: number;
}

/**
 * Manages pet activities like feeding, playing, resting
 */
export class PetActivityManager {
  public static idleFrames: PIXI.Texture[] = [];
  public static eatingFrames: PIXI.Texture[] = [];
  public static playingFrames: PIXI.Texture[] = [];
  public static sleepingFrames: PIXI.Texture[] = [];
  public static happyFrames: PIXI.Texture[] = [];
  public static sadFrames: PIXI.Texture[] = [];
  public static surprisedFrames: PIXI.Texture[] = [];
  public static talkingFrames: PIXI.Texture[] = [];

  private static currentPet: AnimatedSprite | null = null;
  private static currentStats: PetStatsUpdate = {};
  private static onUpdateStatsCallback: ((stats: PetStatsUpdate) => void) | null = null;
  private static lastInteractionTime: number = 0;
  private static readonly INTERACTION_COOLDOWN = 5000; // 5 seconds
  private static readonly STAT_DECAY_INTERVAL = 60000; // 1 minute
  private static statDecayTimer: number | NodeJS.Timeout | null = null; // timer handle for stat decay

  public static async loadAssets(): Promise<void> {
    const svgAssetPaths = [
      '/assets/games/nosterpet/idle.svg',
      '/assets/games/nosterpet/eating.svg',
      '/assets/games/nosterpet/playing.svg',
      '/assets/games/nosterpet/sleeping.svg',
      '/assets/games/nosterpet/happy.svg',
      '/assets/games/nosterpet/sad.svg',
      '/assets/games/nosterpet/surprised.svg',
      '/assets/games/nosterpet/talking.svg',
    ];

    try {
      // Use Assets.load for all SVGs to ensure proper asynchronous loading
      const loadedTexturesMap = await Assets.load(svgAssetPaths);

      PetActivityManager.idleFrames = [loadedTexturesMap[svgAssetPaths[0]]];
      PetActivityManager.eatingFrames = [loadedTexturesMap[svgAssetPaths[1]]];
      PetActivityManager.playingFrames = [loadedTexturesMap[svgAssetPaths[2]]];
      PetActivityManager.sleepingFrames = [loadedTexturesMap[svgAssetPaths[3]]];
      PetActivityManager.happyFrames = [loadedTexturesMap[svgAssetPaths[4]]];
      PetActivityManager.sadFrames = [loadedTexturesMap[svgAssetPaths[5]]];
      PetActivityManager.surprisedFrames = [loadedTexturesMap[svgAssetPaths[6]]];
      PetActivityManager.talkingFrames = [loadedTexturesMap[svgAssetPaths[7]]];

      console.log('Pet activity SVG assets loaded successfully via Assets.load');
    } catch (error) {
      console.error('Error loading pet activity SVG assets via Assets.load:', error);
      const fallbackTexture = PIXI.Texture.WHITE;
      PetActivityManager.idleFrames = [fallbackTexture];
      PetActivityManager.eatingFrames = [fallbackTexture];
      PetActivityManager.playingFrames = [fallbackTexture];
      PetActivityManager.sleepingFrames = [fallbackTexture];
      PetActivityManager.happyFrames = [fallbackTexture];
      PetActivityManager.sadFrames = [fallbackTexture];
      PetActivityManager.surprisedFrames = [fallbackTexture];
      PetActivityManager.talkingFrames = [fallbackTexture];
    }
  }

  public static initializePet(input: PetStatsInput): void {
    this.currentPet = input.pet;
    this.currentStats = { ...input.stats };
    this.onUpdateStatsCallback = input.onUpdateStats;
    this.lastInteractionTime = Date.now();
    this.startStatDecay();
  }

  private static playAnimation(frames: PIXI.Texture[], animationSpeed: number = 0.1, loop: boolean = true): void {
    if (!this.currentPet) return;
    if (!frames.length) {
      console.warn('Attempted to play animation with no frames. Defaulting to WHITE texture.');
      // @ts-expect-error assigning Texture[] to AnimatedSprite.textures union type
      this.currentPet.textures = [PIXI.Texture.WHITE];
    } else {
      // @ts-expect-error assigning Texture[] to AnimatedSprite.textures union type
      this.currentPet.textures = frames;
    }
    this.currentPet.animationSpeed = animationSpeed;
    this.currentPet.loop = loop;
    this.currentPet.play();
  }

  private static playIdleAnimation(): void {
    this.playAnimation(PetActivityManager.idleFrames, 0.1, true);
  }

  private static startStatDecay(): void {
    if (this.statDecayTimer) {
      clearInterval(this.statDecayTimer);
    }
    this.statDecayTimer = setInterval(() => {
      if (!this.currentPet || !this.currentStats) return;

      this.currentStats.hunger = Math.max(0, (this.currentStats.hunger || 0) - 1);
      this.currentStats.energy = Math.max(0, (this.currentStats.energy || 0) - 1);
      this.currentStats.happiness = Math.max(0, (this.currentStats.happiness || 0) - 1);

      if (this.onUpdateStatsCallback) {
        this.onUpdateStatsCallback(this.currentStats);
      }
    }, this.STAT_DECAY_INTERVAL);
  }

  public static makePetHappy(pet: AnimatedSprite, onComplete?: (stats: PetStatsUpdate) => void): void {
    this.currentPet = pet;
    this.handleInteraction({ happiness: 10 }, 'happy');
    if (onComplete && this.currentStats) onComplete(this.currentStats);
  }

  public static makePetSad(pet: AnimatedSprite, onComplete?: (stats: PetStatsUpdate) => void): void {
    this.currentPet = pet;
    this.handleInteraction({ happiness: -10 }, 'sad');
    if (onComplete && this.currentStats) onComplete(this.currentStats);
  }

  public static makePetSurprised(pet: AnimatedSprite, onComplete?: (stats: PetStatsUpdate) => void): void {
    this.currentPet = pet;
    this.handleInteraction({ experience: 1 }, 'surprised');
    if (onComplete && this.currentStats) onComplete(this.currentStats);
  }

  public static makePetTalk(pet: AnimatedSprite, onComplete?: (stats: PetStatsUpdate) => void): void {
    this.currentPet = pet;
    this.handleInteraction({}, 'talking');
    if (onComplete && this.currentStats) onComplete(this.currentStats);
  }

  /**
   * Handle pet feeding
   */
  public static feed(onComplete?: (stats: PetStatsUpdate) => void): void {
    this.handleInteraction({ hunger: 10, energy: 5, experience: 5, happiness: 5 }, 'eating');
    if (onComplete && this.currentStats) onComplete(this.currentStats);
  }

  /**
   * Handle pet playing
   */
  public static play(onComplete?: (stats: PetStatsUpdate) => void): void {
    this.handleInteraction({ happiness: 15, energy: -10, experience: 10, hunger: -5 }, 'playing');
    if (onComplete && this.currentStats) onComplete(this.currentStats);
  }

  /**
   * Handle pet resting
   */
  public static rest(onComplete?: (stats: PetStatsUpdate) => void): void {
    this.handleInteraction({ energy: 20, hunger: -2, experience: 2, happiness: 2 }, 'sleeping');
    if (onComplete && this.currentStats) onComplete(this.currentStats);
  }

  private static stopStatDecay(): void {
    if (this.statDecayTimer) {
      clearInterval(this.statDecayTimer);
      this.statDecayTimer = null;
    }
  }

  public static performCleanup(): void {
    this.stopStatDecay();
    this.currentPet = null;
    this.currentStats = {};
    this.onUpdateStatsCallback = null;
  }

  // The Ticker instance for updates would typically be managed by the scene or game loop
  public static update(delta: number, tickerInstance?: PIXI.ticker.Ticker): void { // Corrected to PIXI.ticker.Ticker
    // 'delta' is usually provided by the Ticker
    // This method can be used for time-based logic if needed in the future.
  }

  private static canInteract(): boolean {
    return Date.now() - this.lastInteractionTime > this.INTERACTION_COOLDOWN;
  }

  private static handleInteraction(statChanges: PetStatsUpdate, animationName?: string, sound?: Sound): void {
    if (!this.currentPet || !this.currentStats || !this.canInteract()) return;

    this.lastInteractionTime = Date.now();

    if (animationName) {
      switch (animationName) {
        case 'eating':
          this.playAnimation(PetActivityManager.eatingFrames, 0.1, false);
          break;
        case 'playing':
          this.playAnimation(PetActivityManager.playingFrames, 0.1, false);
          break;
        case 'sleeping':
          this.playAnimation(PetActivityManager.sleepingFrames, 0.1, false);
          break;
        case 'happy':
          this.playAnimation(PetActivityManager.happyFrames, 0.1, false);
          break;
        case 'sad':
          this.playAnimation(PetActivityManager.sadFrames, 0.1, false);
          break;
        case 'surprised':
          this.playAnimation(PetActivityManager.surprisedFrames, 0.1, false);
          break;
        case 'talking':
          this.playAnimation(PetActivityManager.talkingFrames, 0.1, false);
          break;
        default:
          this.playIdleAnimation();
          break;
      }
    } else {
      this.playIdleAnimation();
    }

    // Apply stat changes
    for (const key in statChanges) {
      if (Object.prototype.hasOwnProperty.call(statChanges, key)) {
        const change = statChanges[key];
        if (typeof change === 'number') {
          this.currentStats[key] = Math.max(0, (this.currentStats[key] || 0) + change);
        }
      }
    }

    if (this.onUpdateStatsCallback) {
      this.onUpdateStatsCallback(this.currentStats);
    }
  }
}