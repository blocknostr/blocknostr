import { Application } from 'pixi.js';
import * as PIXI from 'pixi.js';
import { AnimatedSprite } from '@pixi/sprite-animated';
import { Emitter, EmitterConfigV3 } from '@pixi/particle-emitter';
import { Assets } from '@pixi/assets';
import type { IMediaInstance, Sound as PixiSound } from '@pixi/sound';
import { PetActivityManager, PetStatsInput, PetStatsUpdate } from '../managers/PetActivityManager';
import { EvolutionManager, EvolutionStats, EvolutionUpdate } from '../managers/EvolutionManager';
import { CustomizationManager } from '../managers/CustomizationManager';
import { UIUtils } from '../utils/UIUtils';
import { NostrService } from '@/lib/nostr/service';

interface PetState {
  id: string;
  name: string;
  hunger: number;
  happiness: number;
  energy: number;
  level: number;
  experience: number;
  evolutionStage: number;
  customization: { color: string; accessory: string; aura: string };
  inventory: { itemId: string; quantity: number }[];
  lastReward: number;
  lastEvent: number;
}

// Main game scene for NostrPet using PixiJS
export default class GameScene {
  private app: Application;
  private pet: AnimatedSprite;
  private petEmitter: Emitter;
  private statsText: PIXI.Text;
  private petName: string = 'NostrPet';
  private hunger: number = 100;
  private energy: number = 100;
  private happiness: number = 100;
  private experience: number = 0;
  private level: number = 1;
  private evolutionStage: number = 1;
  private walletAddress: string;
  private nostrPubkey: string;
  private lastTick: number = 0;
  private lastReward: number = 0;
  private customization: { color: string; accessory: string; aura: string } = { color: '', accessory: '', aura: '' };
  private nostrService: NostrService;

  private eatSoundInstance!: IMediaInstance | null;
  private laughSound!: PixiSound | null;
  private restSound!: PixiSound | null;
  private evolveSound!: PixiSound | null;
  private happySound!: PixiSound | null;
  private sadSound!: PixiSound | null;
  private surprisedSound!: PixiSound | null;
  private talkingSound!: PixiSound | null;

  static async create(parent: HTMLElement, walletAddress: string, nostrPubkey: string) {
    const instance = new GameScene(walletAddress, nostrPubkey);
    await instance.init(parent);
    return instance;
  }

  private constructor(walletAddress: string, nostrPubkey: string) {
    this.walletAddress = walletAddress;
    this.nostrPubkey = nostrPubkey;
    this.nostrService = new NostrService();
  }

  private async init(parent: HTMLElement) {
    console.log('GameScene: Constructor started.');
    console.log('GameScene: Parent element:', parent);
    if (parent) {
      console.log('GameScene: Parent dimensions (clientWidth x clientHeight):', parent.clientWidth, 'x', parent.clientHeight);
    } else {
      console.error('GameScene: Parent element is null!');
      throw new Error('GameScene constructor requires a valid parent HTMLElement.');
    }

    // Create PIXI application using container client dimensions (PixiJS v8+)
    const width = parent.clientWidth;
    const height = parent.clientHeight;
    // PixiJS v7: use new Application and .view (not .renderer.view)
    this.app = new Application({
      width,
      height,
      backgroundColor: 0x1099bb,
      resolution: window.devicePixelRatio || 1,
      antialias: true,
    });
    const canvas = (this.app.view as HTMLCanvasElement);
    if (!canvas) {
      throw new Error('PIXI.Application.view is undefined. Application may not have initialized correctly.');
    }
    parent.appendChild(canvas);

    // Set scale mode for crisp rendering
    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
    console.log('GameScene: Initialization successful. Calling preload...');
    this.preload();
  }

  async preload() {
    try {
      // Load pet SVG assets before anything else
      await PetActivityManager.loadAssets();
      const assetUrls = [
        { alias: 'particle_star_img', src: '/assets/games/nosterpet/particle_star.png' },
        { alias: 'eat_sound', src: '/assets/games/nosterpet/eat.wav' },
        { alias: 'laugh_sound', src: '/assets/games/nosterpet/laugh.wav' },
        { alias: 'rest_sound', src: '/assets/games/nosterpet/rest.wav' },
        { alias: 'evolve_sound', src: '/assets/games/nosterpet/evolve.wav' },
        { alias: 'happy_sound', src: '/assets/games/nosterpet/happy.wav' },
        { alias: 'sad_sound', src: '/assets/games/nosterpet/sad.wav' },
        { alias: 'surprised_sound', src: '/assets/games/nosterpet/surprised.wav' },
        { alias: 'talking_sound', src: '/assets/games/nosterpet/talking.wav' },
      ];
      await Assets.load(assetUrls);

      const eatSoundAsset = Assets.get('eat_sound') as PixiSound;
      if (eatSoundAsset) {
        const playPromise = eatSoundAsset.play({ loop: false, volume: 1 });
        if (playPromise instanceof Promise) {
          this.eatSoundInstance = await playPromise;
        } else {
          this.eatSoundInstance = playPromise;
        }
      }
      this.laughSound = Assets.get('laugh_sound') as PixiSound;
      this.restSound = Assets.get('rest_sound') as PixiSound;
      this.evolveSound = Assets.get('evolve_sound') as PixiSound;
      this.happySound = Assets.get('happy_sound') as PixiSound;
      this.sadSound = Assets.get('sad_sound') as PixiSound;
      this.surprisedSound = Assets.get('surprised_sound') as PixiSound;
      this.talkingSound = Assets.get('talking_sound') as PixiSound;

      this.loadPet();
      this.app.ticker.add(this.gameLoop.bind(this));
    } catch (error) {
      console.error("Error during asset preloading or pet loading:", error);
      const graphics = new PIXI.Graphics();
      graphics.beginFill(0xff0000);
      graphics.drawRect(0, 0, 64, 64);
      graphics.endFill();
      // Generate fallback texture directly from graphics
      const errorTexture = graphics.generateCanvasTexture();
      Assets.cache.set('particle_star_img', errorTexture);
      graphics.destroy();
      this.loadPet();
      this.app.ticker.add(this.gameLoop.bind(this));
    }
  }

  private loadPet() {
    const frames = PetActivityManager.idleFrames.length
      ? PetActivityManager.idleFrames
      : [PIXI.Texture.WHITE];
    // @ts-expect-error: bypass AnimatedSprite constructor typing
    this.pet = new AnimatedSprite(frames);
    this.pet.anchor.set(0.5);
    this.pet.x = this.app.screen.width / 2;
    this.pet.y = this.app.screen.height / 2;
    this.pet.animationSpeed = 0.1;
    this.pet.play();
    // @ts-expect-error: AnimatedSprite extends DisplayObject
    this.app.stage.addChild(this.pet);

    // Initialize PetActivityManager with the pet and stat callbacks
    PetActivityManager.initializePet({
      hunger: this.hunger,
      energy: this.energy,
      experience: this.experience,
      level: this.level,
      pet: this.pet,
      stats: {
        hunger: this.hunger,
        energy: this.energy,
        experience: this.experience,
        level: this.level,
        happiness: this.happiness,
      },
      onUpdateStats: (stats) => {
        if (stats.hunger !== undefined) this.hunger = stats.hunger;
        if (stats.energy !== undefined) this.energy = stats.energy;
        if (stats.experience !== undefined) this.experience = stats.experience;
        if (stats.level !== undefined) this.level = stats.level;
        if (stats.happiness !== undefined) this.happiness = stats.happiness;
        this.updateUI();
      },
    });

    const particleTextureAsset = Assets.get<PIXI.Texture>('particle_star_img');
    const particleTexture = particleTextureAsset || PIXI.Texture.WHITE;

    const emitterConfig: EmitterConfigV3 = {
      lifetime: {
        min: 0.5,
        max: 1.5
      },
      frequency: 0.1,
      spawnChance: 1,
      particlesPerWave: 1,
      emitterLifetime: -1,
      maxParticles: 100,
      pos: {
        x: 0,
        y: 0
      },
      behaviors: [
        {
          type: 'alpha',
          config: {
            alpha: {
              list: [
                { value: 0.8, time: 0 },
                { value: 0.1, time: 1 }
              ]
            }
          }
        },
        {
          type: 'moveSpeed',
          config: {
            speed: {
              list: [
                { value: 100, time: 0 },
                { value: 50, time: 1 }
              ],
              isStepped: false
            }
          }
        },
        {
          type: 'scale',
          config: {
            scale: {
              list: [
                { value: 0.5, time: 0 },
                { value: 0.2, time: 1 }
              ]
            },
            minMult: 1
          }
        },
        {
          type: 'rotationStatic',
          config: {
            min: 0,
            max: 360
          }
        },
        {
          type: 'spawnShape',
          config: {
            type: 'circle',
            data: {
              x: 0,
              y: 0,
              radius: 10
            }
          }
        },
        {
          type: 'textureSingle',
          config: { texture: particleTexture }
        }
      ]
    };

    // @ts-expect-error: Emitter typing mismatch
    this.petEmitter = new Emitter(this.app.stage, emitterConfig);
    this.petEmitter.emit = false;

    this.setupUI();
    this.loadState();
  }

  private setupUI() {
    this.statsText = new PIXI.Text('', { fill: '#ffffff', fontSize: 18 });
    this.statsText.x = 10;
    this.statsText.y = 10;
    this.app.stage.addChild(this.statsText);
    this.updateUI();
  }

  private updateUI() {
    if (this.statsText) {
      this.statsText.text = `Name: ${this.petName}\nHunger: ${this.hunger}\nEnergy: ${this.energy}\nHappiness: ${this.happiness}\nLevel: ${this.level} (XP: ${this.experience})\nWallet: ${this.walletAddress ? 'Connected' : 'N/A'}`;
    }
  }

  private gameLoop(delta: number): void {
    const currentTime = this.app.ticker.lastTime;
    const deltaTime = delta / 60;
    this.lastTick = currentTime;

    PetActivityManager.update(deltaTime);

    if (this.petEmitter && this.petEmitter.emit) {
      this.petEmitter.update(deltaTime);
    }

    if (currentTime - this.lastReward > 180000) {
      if (this.level > 1 && this.happiness >= 70) {
        UIUtils.showMessage(this.app.stage, '+20 sats earned!', 0xffffff, this.app.ticker);
        this.updateUI();
      }
      this.lastReward = currentTime;
    }
  }

  feedPet() {
    const eatSound = Assets.get('eat_sound') as PixiSound;
    const inst = eatSound.play({ loop: false, volume: 1 });
    this.eatSoundInstance = inst as IMediaInstance;

    PetActivityManager.feed((updatedStats: PetStatsUpdate) => {
      if (updatedStats.hunger !== undefined) this.hunger = updatedStats.hunger;
      if (updatedStats.energy !== undefined) this.energy = updatedStats.energy;
      if (updatedStats.experience !== undefined) this.experience = updatedStats.experience;
      if (updatedStats.happiness !== undefined) this.happiness = updatedStats.happiness;
      this.checkEvolution();
      this.updateUI();
      this.saveState();
      UIUtils.showMessage(this.app.stage, `${this.petName} says: Yummy!`, 0x00ff00, this.app.ticker);
    });
  }

  playWithPet() {
    this.laughSound?.play({ loop: false, volume: 0.8 });
    PetActivityManager.play((updatedStats: PetStatsUpdate) => {
      if (updatedStats.happiness !== undefined) this.happiness = updatedStats.happiness;
      if (updatedStats.energy !== undefined) this.energy = updatedStats.energy;
      if (updatedStats.experience !== undefined) this.experience = updatedStats.experience;
      if (updatedStats.hunger !== undefined) this.hunger = updatedStats.hunger;
      this.checkEvolution();
      this.updateUI();
      this.saveState();
      UIUtils.showMessage(this.app.stage, `${this.petName} is having fun!`, 0xffff00, this.app.ticker);
    });
  }

  letPetRest() {
    this.restSound?.play({ loop: false, volume: 0.7 });
    PetActivityManager.rest((updatedStats: PetStatsUpdate) => {
      if (updatedStats.energy !== undefined) this.energy = updatedStats.energy;
      if (updatedStats.happiness !== undefined) this.happiness = updatedStats.happiness;
      if (updatedStats.experience !== undefined) this.experience = updatedStats.experience;
      this.checkEvolution();
      this.updateUI();
      this.saveState();
      UIUtils.showMessage(this.app.stage, `${this.petName} is resting.`, 0xadd8e6, this.app.ticker);
    });
  }

  triggerHappyAnimation() {
    this.happySound?.play({ loop: false, volume: 0.8 });
    PetActivityManager.makePetHappy(this.pet, (updatedStats: PetStatsUpdate) => {
    });
    UIUtils.showMessage(this.app.stage, `${this.petName} is very happy!`, 0x00ff00, this.app.ticker);
  }

  triggerSadAnimation() {
    this.sadSound?.play({ loop: false, volume: 0.8 });
    PetActivityManager.makePetSad(this.pet, (updatedStats: PetStatsUpdate) => {
    });
    UIUtils.showMessage(this.app.stage, `${this.petName} is feeling sad...`, 0xffa500, this.app.ticker);
  }

  triggerSurprisedAnimation() {
    this.surprisedSound?.play({ loop: false, volume: 0.8 });
    PetActivityManager.makePetSurprised(this.pet, (updatedStats: PetStatsUpdate) => {
    });
    UIUtils.showMessage(this.app.stage, `${this.petName} is surprised!`, 0x00ffff, this.app.ticker);
  }

  triggerTalkingAnimation() {
    this.talkingSound?.play({ loop: false, volume: 0.8 });
    PetActivityManager.makePetTalk(this.pet, (updatedStats: PetStatsUpdate) => {
    });
    UIUtils.showMessage(this.app.stage, `${this.petName} is chattering!`, 0xcccccc, this.app.ticker);
  }

  private checkEvolution() {
    const evolutionInput: EvolutionStats = {
      level: this.level,
      experience: this.experience,
      currentStage: this.evolutionStage,
      happiness: this.happiness,
      energy: this.energy,
      petSprite: this.pet,
      onEvolve: (update: EvolutionUpdate) => {
        this.evolutionStage = update.newStage;
        this.level = update.newLevel;
        this.experience = update.newExperience;
        this.updateUI();
        this.saveState();
      }
    };

    EvolutionManager.checkAndProcessEvolution(
      evolutionInput,
      this.app.stage,
      this.petName,
      this.evolveSound,
      this.app.ticker
    );
  }

  private saveState() {
    const state: PetState = {
      id: this.nostrPubkey,
      name: this.petName,
      hunger: this.hunger,
      happiness: this.happiness,
      energy: this.energy,
      level: this.level,
      experience: this.experience,
      evolutionStage: this.evolutionStage,
      customization: this.customization,
      inventory: [],
      lastReward: this.lastReward,
      lastEvent: this.app.ticker.lastTime
    };
    localStorage.setItem(`nostrPetState_${this.nostrPubkey}`, JSON.stringify(state));
  }

  private loadState() {
    const savedState = localStorage.getItem(`nostrPetState_${this.nostrPubkey}`);
    if (savedState) {
      const state: PetState = JSON.parse(savedState);
      this.petName = state.name;
      this.hunger = state.hunger;
      this.happiness = state.happiness;
      this.energy = state.energy;
      this.level = state.level;
      this.experience = state.experience;
      this.evolutionStage = state.evolutionStage;
      this.customization = state.customization;
      this.lastReward = state.lastReward || 0;

      const loadedPetStats: PetStatsInput = {
        pet: this.pet,
        hunger: this.hunger,
        energy: this.energy,
        experience: this.experience,
        level: this.level,
        stats: {
          hunger: this.hunger,
          energy: this.energy,
          experience: this.experience,
          level: this.level,
          happiness: this.happiness
        },
        onUpdateStats: (updatedStats: PetStatsUpdate) => {
          if (updatedStats.hunger !== undefined) this.hunger = updatedStats.hunger;
          if (updatedStats.energy !== undefined) this.energy = updatedStats.energy;
          if (updatedStats.experience !== undefined) this.experience = updatedStats.experience;
          if (updatedStats.level !== undefined) this.level = updatedStats.level;
          if (updatedStats.happiness !== undefined) this.happiness = updatedStats.happiness;
          this.updateUI();
          this.checkEvolution();
          this.saveState();
        }
      };
      PetActivityManager.initializePet(loadedPetStats);


      this.updateUI();
      console.log("GameScene: Pet state loaded successfully.");
    } else {
      console.log("GameScene: No saved state found, starting with default values.");
    }
  }

  destroy() {
    console.log("GameScene: Destroying...");

    this.eatSoundInstance?.stop();
    this.laughSound?.stop();
    this.restSound?.stop();
    this.evolveSound?.stop();
    this.happySound?.stop();
    this.sadSound?.stop();
    this.surprisedSound?.stop();
    this.talkingSound?.stop();

    const assetAliases = [
      'particle_star_img', 'eat_sound', 'laugh_sound', 'rest_sound',
      'evolve_sound', 'happy_sound', 'sad_sound', 'surprised_sound', 'talking_sound'
    ];
    assetAliases.forEach(alias => {
      try {
        if (Assets.cache.has(alias)) {
          Assets.unload(alias);
        }
      } catch (e) {
        console.warn(`GameScene: Error unloading asset '${alias}':`, e);
        if (Assets.cache.has(alias)) {
          Assets.cache.remove(alias);
        }
      }
    });

    if (this.petEmitter) {
      this.petEmitter.destroy();
    }

    if (this.app && this.app.ticker) {
      this.app.ticker.stop();
      this.app.ticker.remove(this.gameLoop, this);
    }

    if (this.app) {
      this.app.destroy(true, { children: true, texture: true, baseTexture: true });
    }
    PetActivityManager.performCleanup();
    console.log("GameScene: Destroyed.");
  }
}