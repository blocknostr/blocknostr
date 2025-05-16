import Phaser from 'phaser';
import axios from 'axios';
import { toast } from 'sonner';

interface PetState {
  id: string;
  name: string;
  hunger: number;
  happiness: number;
  energy: number;
  level: number;
  experience: number;
  evolutionStage: number;
  customizationர: { color: string; accessory: string; aura: string };
  inventory: { itemId: string; quantity: number }[];
  lastReward: number;
  lastEvent: number;
}

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
    
    // Setup particle effects
    const particles = this.add.particles('particle_star');
    this.petEmitter = particles.createEmitter({
      x: 400,
      y: 300,
      speed: { min: 20, max: 50 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.2, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 1000,
      blendMode: Phaser.BlendModes.ADD, // Fixed: Use BlendModes enum instead of string 'ADD'
      on: false
    });
    
    // Setup animations
    this.setupAnimations();
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
    this.showMessage(`${this.petName} is ready to play!`);
    
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
        this.showMessage('+20 sats earned!');
        this.updateUI();
      }
      this.lastReward = time;
    }
  }

  private setupAnimations() {
    // Create animations for each evolution stage
    for (let stage = 1; stage <= 3; stage++) {
      this.anims.create({
        key: `idle_stage${stage}`,
        frames: this.anims.generateFrameNumbers(`pet_stage${stage}`, { start: 0, end: 3 }),
        frameRate: 4,
        repeat: -1
      });
      
      this.anims.create({
        key: `eat_stage${stage}`,
        frames: this.anims.generateFrameNumbers(`pet_stage${stage}`, { start: 4, end: 7 }),
        frameRate: 8,
        repeat: 0
      });
      
      this.anims.create({
        key: `play_stage${stage}`,
        frames: this.anims.generateFrameNumbers(`pet_stage${stage}`, { start: 8, end: 11 }),
        frameRate: 8,
        repeat: 0
      });
      
      this.anims.create({
        key: `rest_stage${stage}`,
        frames: this.anims.generateFrameNumbers(`pet_stage${stage}`, { start: 12, end: 15 }),
        frameRate: 6,
        repeat: 0
      });
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
    if (this.hunger > 0 && this.energy >= 10) {
      this.hunger = Phaser.Math.Clamp(this.hunger - 30, 0, 100);
      this.energy = Phaser.Math.Clamp(this.energy - 10, 0, 100);
      this.experience += 15;
      
      // Play animation and sound
      this.eatSound.play();
      this.pet.play(`eat_stage${this.evolutionStage}`);
      this.pet.once('animationcomplete', () => {
        this.pet.play(`idle_stage${this.evolutionStage}`);
      });
      
      this.checkEvolution();
      this.updateUI();
      this.saveState();
      this.showMessage(`${this.petName} enjoys the food!`);
    } else {
      this.showMessage("Not enough energy to eat or not hungry");
    }
  }

  private play() {
    if (this.happiness < 100 && this.energy >= 15) {
      this.happiness = Phaser.Math.Clamp(this.happiness + 30, 0, 100);
      this.energy = Phaser.Math.Clamp(this.energy - 15, 0, 100);
      this.experience += 20;
      
      // Play animation and sound
      this.laughSound.play();
      this.pet.play(`play_stage${this.evolutionStage}`);
      this.pet.once('animationcomplete', () => {
        this.pet.play(`idle_stage${this.evolutionStage}`);
      });
      
      this.checkEvolution();
      this.updateUI();
      this.saveState();
      this.showMessage(`${this.petName} is having fun!`);
    } else {
      this.showMessage("Not enough energy to play or already happy");
    }
  }

  private rest() {
    if (this.energy < 100) {
      this.energy = Phaser.Math.Clamp(this.energy + 40, 0, 100);
      this.hunger = Phaser.Math.Clamp(this.hunger + 5, 0, 100);
      this.experience += 10;
      
      // Play animation and sound
      this.restSound.play();
      this.pet.play(`rest_stage${this.evolutionStage}`);
      this.pet.once('animationcomplete', () => {
        this.pet.play(`idle_stage${this.evolutionStage}`);
      });
      
      this.checkEvolution();
      this.updateUI();
      this.saveState();
      this.showMessage(`${this.petName} is resting peacefully`);
    } else {
      this.showMessage("Already fully energized");
    }
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
    this.showMessage(`${this.petName} has a new look!`);
  }

  private applyCustomization() {
    // Apply color tint
    this.pet.clearTint();
    if (this.customization.color === 'red') this.pet.setTint(0xff0000);
    else if (this.customization.color === 'blue') this.pet.setTint(0x0000ff);
    else if (this.customization.color === 'green') this.pet.setTint(0x00ff00);
    else if (this.customization.color === 'purple') this.pet.setTint(0x800080);
    
    // Apply particle effects
    this.petEmitter.stop();
    if (this.customization.aura !== 'none') {
      this.pet Wmitter.setPosition(this.pet.x, this.pet.y);
      
      if (this.customization.aura === 'glow') {
        this.petEmitter.setFrequency(200);
        this.petEmitter.setScale({ start: 0.1, end: 0 }); // Fixed: Use setScale with range object
      } else if (this.customization.aura === 'sparkle') {
        this.petEmitter.setFrequency(500);
        this.petEmitter.setScale({ start: 0.2, end: 0 }); // Fixed: Use setScale with range object
      }
      
      this.petEmitter.start();
    }
  }

  private checkEvolution() {
    const xpNeeded = this.level * 100;
    
    if (this.experience >= xpNeeded) {
      this.level += 1;
      this.experience -= xpNeeded;
      
      // Check for stage evolution
      if (this.level >= 10 && this.evolutionStage === 1) {
        this.evolveStage(2);
      } else if (this.level >= 20 && this.evolutionStage === 2) {
        this.evolveStage(3);
      } else {
        this.showMessage(`${this.petName} leveled up to ${this.level}!`);
      }
    }
  }

  private evolveStage(stage: number) {
    this.evolutionStage = stage;
    this.evolveSound.play();
    
    // Start particle burst
    this.petEmitter.setPosition(this.pet.x, this.pet.y);
    this.petEmitter.explode(30);
    
    // Change texture and restart idle animation
    this.pet.setTexture(`pet_stage${stage}`);
    this.pet.play(`idle_stage${stage}`);
    
    this.showMessage(`${this.petName} evolved to Stage ${stage}!`, 0xffff00);
    
    // Notify outside the game
    toast.success(`${this.petName} evolved to Stage ${stage}!`, {
      description: "Your pet has grown and gained new abilities!"
    });
  }

  private showMessage(text: string, color: number = 0xffffff) {
    const message = this.add.text(400, 500, text, {
      fontSize: '24px',
      color: `#${color.toString(16).padStart(6, '0')}`,
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: message,
      alpha: 0,
      y: 480,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => message.destroy()
    });
  }

  private async loadState() {
    try {
      // Try to load state from backend or localStorage
      const savedState = localStorage.getItem(`nosterpet_${this.walletAddress}`);
      
      if (savedState) {
        const state = JSON.parse(savedState) as PetState;
        this.petId = state.id;
        this.petName = state.name;
        this.hunger = state.hunger;
        this.happiness = state.happiness;
        this.energy = state.energy;
        this.level = state.level;
        this.experience = state.experience;
        this.evolutionStage = state.evolutionStage || 1;
        this.customization = state.customization || { color: 'default', accessory: 'none', aura: 'none' };
        this.inventory = state.inventory || [];
        this.lastReward = state.lastReward || 0;
        this.lastEvent = state.lastEvent || 0;
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
      // Save state to localStorage
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
      
      localStorage.setItem(`nosterpet_${this.walletAddress}`, JSON.stringify(state));
      
      // In a future update: Save to blockchain or backend API
    } catch (error) {
      console.error("Failed to save pet state:", error);
    }
  }
}