
import Phaser from 'phaser';
import { toast } from 'sonner';
import { PetStorageService } from '../services/PetStorageService';
import { PetState } from '../types/PetTypes';
import { setupPetAnimations } from '../utils/AnimationUtils';
import { UIUtils } from '../utils/UIUtils';
import { CustomizationManager } from '../managers/CustomizationManager';
import { PetActivityManager } from '../managers/PetActivityManager';
import { EvolutionManager } from '../managers/EvolutionManager';

/**
 * Main game scene for NostrPet
 * This is a simplified implementation that works with the current project setup
 * Complete functionality will be added incrementally
 */
export default class GameScene extends Phaser.Scene {
  private pet!: Phaser.GameObjects.Sprite;
  private petEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private hunger = 50;
  private happiness = 50;
  private energy = 50;
  private level = 1;
  private experience = 0;
  private evolutionStage = 1;
  private petName = 'NostrPet';
  private petId: string = '';
  private customization: PetState['customization'] = { color: 'default', accessory: 'none', aura: 'none' };
  private inventory: PetState['inventory'] = [];
  private lastTick = 0;
  private lastReward = 0;
  private lastEvent = 0;
  private hungerText!: Phaser.GameObjects.Text;
  private happinessText!: Phaser.GameObjects.Text;
  private energyText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private walletBalanceText!: Phaser.GameObjects.Text;
  private petNameText!: Phaser.GameObjects.Text;
  private feedButton!: Phaser.GameObjects.Text;
  private playButton!: Phaser.GameObjects.Text;
  private restButton!: Phaser.GameObjects.Text;
  private customizeButton!: Phaser.GameObjects.Text;
  private walletAddress = '';
  private nostrPubkey = '';
  
  // Placeholder for actual blockchain balance
  private walletBalance = 0;
  private alphBalance = 0;
  
  // Sound placeholders
  private eatSound!: Phaser.Sound.BaseSound;
  private laughSound!: Phaser.Sound.BaseSound;
  private restSound!: Phaser.Sound.BaseSound;
  private evolveSound!: Phaser.Sound.BaseSound;

  constructor() {
    super({ key: 'GameScene' });
  }

  init() {
    // Get wallet address and Nostr pubkey from registry
    this.walletAddress = this.game.registry.get('walletAddress') || '';
    this.nostrPubkey = this.game.registry.get('nostrPubkey') || '';
    
    // Random pet ID for new pets
    this.petId = `pet_${Math.random().toString(36).substring(2, 8)}`;
  }

  preload() {
    // Load spritesheets and assets
    this.load.spritesheet('pet_stage1', '/assets/games/nosterpet/pet_stage1.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('pet_stage2', '/assets/games/nosterpet/pet_stage2.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('pet_stage3', '/assets/games/nosterpet/pet_stage3.png', { frameWidth: 64, frameHeight: 64 });
    
    // Default assets if custom ones aren't available
    this.load.image('accessory_hat', '/assets/games/nosterpet/hat.png');
    this.load.image('accessory_scarf', '/assets/games/nosterpet/scarf.png');
    this.load.image('accessory_glasses', '/assets/games/nosterpet/glasses.png');
    this.load.image('aura_glow', '/assets/games/nosterpet/aura_glow.png');
    this.load.image('particle_star', '/assets/games/nosterpet/particle_star.png');
    
    // Load sounds
    this.load.audio('eat', '/assets/games/nosterpet/eat.wav');
    this.load.audio('laugh', '/assets/games/nosterpet/laugh.wav');
    this.load.audio('rest', '/assets/games/nosterpet/rest.wav');
    this.load.audio('evolve', '/assets/games/nosterpet/evolve.wav');
    
    // Fallback to placeholder assets if needed
    this.load.on('fileerror', (key: string) => {
      console.warn(`Failed to load asset: ${key}, using placeholder`);
    });
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a1c2c');
    
    // Initialize pet sprite
    this.pet = this.add.sprite(400, 300, `pet_stage${this.evolutionStage}`).setScale(2);
    
    // Setup particle effects - FIX: Use proper particle configuration
    const particles = this.add.particles('particle_star');
    this.petEmitter = particles.createEmitter({
      x: 400,
      y: 300,
      speed: { min: 20, max: 50 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.2, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 1000,
      blendMode: Phaser.BlendModes.ADD,
      on: false
    });
    
    // Setup animations
    setupPetAnimations(this.anims);
    this.pet.play(`idle_stage${this.evolutionStage}`);
    
    // Setup UI elements
    this.setupUI();
    
    // Load initial state
    this.loadState();
    
    // Setup sounds
    this.eatSound = this.sound.add('eat');
    this.laughSound = this.sound.add('laugh');
    this.restSound = this.sound.add('rest');
    this.evolveSound = this.sound.add('evolve');
    
    // Update UI with initial values
    this.updateUI();
    
    // Sample blockchain display values (mock data for now)
    this.alphBalance = 25.5;
    this.walletBalance = 5000; // sats
    
    // Notice when pet is ready
    UIUtils.showMessage(this, `${this.petName} is ready to play!`);
    
    // Start game loop
    this.lastTick = this.time.now;
  }

  update(time: number) {
    // Update stats every 10 seconds
    if (time - this.lastTick > 10000) {
      this.hunger = Phaser.Math.Clamp(this.hunger + 3 / (1 + this.level * 0.1), 0, 100);
      this.happiness = Phaser.Math.Clamp(this.happiness - 2 / (1 + this.level * 0.1), 0, 100);
      this.energy = Phaser.Math.Clamp(this.energy - 3 / (1 + this.level * 0.1), 0, 100);
      
      this.updateUI();
      this.saveState();
      this.lastTick = time;
    }

    // Check for rewards every hour (simplified to 3 minutes for testing)
    if (time - this.lastReward > 180000) {
      if (this.level > 1 && this.happiness >= 70) {
        this.walletBalance += 20;
        UIUtils.showMessage(this, '+20 sats earned!');
        this.updateUI();
      }
      this.lastReward = time;
    }
  }

  private setupUI() {
    // Create pet name display
    this.petNameText = this.add.text(20, 20, `Pet: ${this.petName}`, { 
      fontSize: '24px', 
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    });

    // Stats text
    this.hungerText = this.add.text(20, 50, '', { fontSize: '20px', color: '#ffffff' });
    this.happinessText = this.add.text(20, 80, '', { fontSize: '20px', color: '#ffffff' });
    this.energyText = this.add.text(20, 110, '', { fontSize: '20px', color: '#ffffff' });
    this.levelText = this.add.text(20, 140, '', { fontSize: '20px', color: '#ffffff' });
    this.walletBalanceText = this.add.text(20, 170, '', { fontSize: '20px', color: '#ffcc00' });

    // Action buttons
    this.feedButton = this.add.text(660, 20, 'Feed', { fontSize: '24px', color: '#0f0' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.feed());
      
    this.playButton = this.add.text(660, 60, 'Play', { fontSize: '24px', color: '#0ff' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.play());
      
    this.restButton = this.add.text(660, 100, 'Rest', { fontSize: '24px', color: '#f0f' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.rest());
      
    this.customizeButton = this.add.text(660, 140, 'Customize', { fontSize: '24px', color: '#ff0' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.customize());
  }

  private updateUI() {
    // Update UI elements with current values
    this.petNameText.setText(`Pet: ${this.petName} (Stage ${this.evolutionStage})`);
    this.hungerText.setText(`Hunger: ${Math.round(this.hunger)}%`);
    this.happinessText.setText(`Happiness: ${Math.round(this.happiness)}%`);
    this.energyText.setText(`Energy: ${Math.round(this.energy)}%`);
    this.levelText.setText(`Level: ${this.level} (XP: ${this.experience}/${this.level * 100})`);
    this.walletBalanceText.setText(`Balance: ${this.walletBalance} sats | ${this.alphBalance} ALPH`);
  }

  private feed() {
    PetActivityManager.feed(
      this,
      this.pet,
      this.petName,
      this.evolutionStage,
      this.eatSound,
      {
        hunger: this.hunger,
        energy: this.energy,
        experience: this.experience
      },
      () => this.checkEvolution(),
      () => this.updateUI(),
      () => this.saveState()
    );
    
    // Update local variables after the operation
    this.hunger = Phaser.Math.Clamp(this.hunger - 30, 0, 100);
    this.energy = Phaser.Math.Clamp(this.energy - 10, 0, 100);
    this.experience += 15;
  }

  private play() {
    PetActivityManager.play(
      this,
      this.pet,
      this.petName,
      this.evolutionStage,
      this.laughSound,
      {
        happiness: this.happiness,
        energy: this.energy,
        experience: this.experience
      },
      () => this.checkEvolution(),
      () => this.updateUI(),
      () => this.saveState()
    );
    
    // Update local variables after the operation
    this.happiness = Phaser.Math.Clamp(this.happiness + 30, 0, 100);
    this.energy = Phaser.Math.Clamp(this.energy - 15, 0, 100);
    this.experience += 20;
  }

  private rest() {
    PetActivityManager.rest(
      this,
      this.pet,
      this.petName,
      this.evolutionStage,
      this.restSound,
      {
        energy: this.energy,
        hunger: this.hunger,
        experience: this.experience
      },
      () => this.checkEvolution(),
      () => this.updateUI(),
      () => this.saveState()
    );
    
    // Update local variables after the operation
    this.energy = Phaser.Math.Clamp(this.energy + 40, 0, 100);
    this.hunger = Phaser.Math.Clamp(this.hunger + 5, 0, 100);
    this.experience += 10;
  }

  private customize() {
    const colors = ['default', 'red', 'blue', 'green', 'purple'];
    const accessories = ['none', 'hat', 'scarf', 'glasses'];
    const auras = ['none', 'glow', 'sparkle'];
    
    this.customization.color = colors[(colors.indexOf(this.customization.color) + 1) % colors.length];
    this.customization.accessory = accessories[(accessories.indexOf(this.customization.accessory) + 1) % accessories.length];
    this.customization.aura = auras[(auras.indexOf(this.customization.aura) + 1) % auras.length];
    
    this.applyCustomization();
    this.updateUI();
    this.saveState();
    UIUtils.showMessage(this, `${this.petName} has a new look!`);
  }

  private applyCustomization() {
    CustomizationManager.applyCustomization(
      this.pet,
      this.customization,
      this.petEmitter
    );
  }

  private checkEvolution() {
    EvolutionManager.checkEvolution(
      this, 
      this.pet,
      this.petName,
      {
        level: this.level,
        experience: this.experience,
        evolutionStage: this.evolutionStage
      },
      this.evolveSound,
      this.petEmitter
    );
    
    // Update local state after evolution check
    const xpNeeded = this.level * 100;
    if (this.experience >= xpNeeded) {
      this.level += 1;
      this.experience -= xpNeeded;
      
      // Update evolution stage if needed
      if (this.level >= 10 && this.evolutionStage === 1) {
        this.evolutionStage = 2;
      } else if (this.level >= 20 && this.evolutionStage === 2) {
        this.evolutionStage = 3;
      }
    }
  }

  private async loadState() {
    try {
      // Try to load state from localStorage using the service
      const savedState = PetStorageService.loadState(this.walletAddress);
      
      if (savedState) {
        this.petId = savedState.id;
        this.petName = savedState.name;
        this.hunger = savedState.hunger;
        this.happiness = savedState.happiness;
        this.energy = savedState.energy;
        this.level = savedState.level;
        this.experience = savedState.experience;
        this.evolutionStage = savedState.evolutionStage || 1;
        this.customization = savedState.customization || { color: 'default', accessory: 'none', aura: 'none' };
        this.inventory = savedState.inventory || [];
        this.lastReward = savedState.lastReward || 0;
        this.lastEvent = savedState.lastEvent || 0;
      } else {
        // Generate a name based on wallet address
        this.petName = `NostrPet_${this.walletAddress.substring(0, 6)}`;
      }
      
      // Apply customization
      this.applyCustomization();
      
    } catch (error) {
      console.error("Failed to load pet state:", error);
      // Fallback to default values if loading fails
    }
  }

  private saveState() {
    try {
      // Save state to localStorage using the service
      const state: PetState = {
        id: this.petId,
        name: this.petName,
        hunger: this.hunger,
        happiness: this.happiness,
        energy: this.energy,
        level: this.level,
        experience: this.experience,
        evolutionStage: this.evolutionStage,
        customization: this.customization,
        inventory: this.inventory,
        lastReward: this.lastReward,
        lastEvent: this.lastEvent
      };
      
      PetStorageService.saveState(this.walletAddress, state);
      
      // In a future update: Save to blockchain or backend API
    } catch (error) {
      console.error("Failed to save pet state:", error);
    }
  }
}
