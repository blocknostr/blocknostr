
import Phaser from 'phaser';
import { PetCustomization } from '../types/PetTypes';

/**
 * Manages pet appearance customization
 */
export class CustomizationManager {
  /**
   * Apply customization to the pet sprite
   */
  static applyCustomization(
    pet: Phaser.GameObjects.Sprite,
    customization: PetCustomization,
    emitter: Phaser.GameObjects.Particles.ParticleEmitter
  ): void {
    // Apply color tint
    pet.clearTint();
    if (customization.color === 'red') pet.setTint(0xff0000);
    else if (customization.color === 'blue') pet.setTint(0x0000ff);
    else if (customization.color === 'green') pet.setTint(0x00ff00);
    else if (customization.color === 'purple') pet.setTint(0x800080);
    
    // Apply particle effects
    emitter.stop();
    if (customization.aura !== 'none') {
      emitter.setPosition(pet.x, pet.y);
      
      if (customization.aura === 'glow') {
        emitter.setFrequency(200);
        // Fix: Use numeric values for setScale
        emitter.setScale(0.1, 0.0);
      } else if (customization.aura === 'sparkle') {
        emitter.setFrequency(500);
        // Fix: Use numeric values for setScale
        emitter.setScale(0.2, 0.0);
      }
      
      emitter.start();
    }
  }
}
