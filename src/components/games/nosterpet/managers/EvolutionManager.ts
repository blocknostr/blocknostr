
import Phaser from 'phaser';
import { UIUtils } from '../utils/UIUtils';
import { toast } from 'sonner';

/**
 * Manages pet evolution and leveling
 */
export class EvolutionManager {
  /**
   * Check if pet should level up or evolve
   */
  static checkEvolution(
    scene: Phaser.Scene,
    pet: Phaser.GameObjects.Sprite,
    petName: string,
    stats: {
      level: number,
      experience: number,
      evolutionStage: number
    },
    evolveSound: Phaser.Sound.BaseSound,
    emitter: Phaser.GameObjects.Particles.ParticleEmitter
  ): void {
    const xpNeeded = stats.level * 100;
    
    if (stats.experience >= xpNeeded) {
      stats.level += 1;
      stats.experience -= xpNeeded;
      
      // Check for stage evolution
      if (stats.level >= 10 && stats.evolutionStage === 1) {
        this.evolveStage(scene, pet, petName, 2, stats, evolveSound, emitter);
      } else if (stats.level >= 20 && stats.evolutionStage === 2) {
        this.evolveStage(scene, pet, petName, 3, stats, evolveSound, emitter);
      } else {
        UIUtils.showMessage(scene, `${petName} leveled up to ${stats.level}!`);
      }
    }
  }

  /**
   * Handle pet evolution to a new stage
   */
  private static evolveStage(
    scene: Phaser.Scene,
    pet: Phaser.GameObjects.Sprite,
    petName: string,
    stage: number,
    stats: { evolutionStage: number },
    evolveSound: Phaser.Sound.BaseSound,
    emitter: Phaser.GameObjects.Particles.ParticleEmitter
  ): void {
    stats.evolutionStage = stage;
    evolveSound.play();
    
    // Start particle burst
    emitter.setPosition(pet.x, pet.y);
    emitter.explode(30);
    
    // Change texture and restart idle animation
    pet.setTexture(`pet_stage${stage}`);
    pet.play(`idle_stage${stage}`);
    
    UIUtils.showMessage(scene, `${petName} evolved to Stage ${stage}!`, 0xffff00);
    
    // Notify outside the game
    toast.success(`${petName} evolved to Stage ${stage}!`, {
      description: "Your pet has grown and gained new abilities!"
    });
  }
}
