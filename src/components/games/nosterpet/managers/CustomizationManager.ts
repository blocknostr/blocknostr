import { Texture } from 'pixi.js';
import { AnimatedSprite } from '@pixi/sprite-animated';
import { Emitter as ParticleEmitter, EmitterConfigV3 } from '@pixi/particle-emitter';
import { PetCustomization } from '../types/PetTypes';

/**
 * Manages pet appearance customization
 */
export class CustomizationManager {
  /**
   * Apply customization to the pet sprite
   */
  static applyCustomization(
    pet: AnimatedSprite, // Ensure this type is resolved correctly
    customization: PetCustomization,
    emitter: ParticleEmitter // Ensure this type is resolved correctly
  ): void {
    // Apply color tint
    pet.tint = 0xffffff; // Reset tint
    if (customization.color === 'red') pet.tint = 0xff0000;
    else if (customization.color === 'blue') pet.tint = 0x0000ff;
    else if (customization.color === 'green') pet.tint = 0x00ff00;
    else if (customization.color === 'purple') pet.tint = 0x800080;

    // Apply particle effects
    emitter.emit = false;
    emitter.cleanup();

    if (customization.aura !== 'none') {
      emitter.updateOwnerPos(pet.x, pet.y);

      let newConfig: EmitterConfigV3 | undefined = undefined;
      // Ensure Texture.from is available and works as expected
      const particleTexture = Texture.from('/assets/games/nosterpet/particle_star.png');

      if (customization.aura === 'glow') {
        newConfig = {
          lifetime: { min: 0.5, max: 1 },
          frequency: 0.05,
          emitterLifetime: -1,
          maxParticles: 500,
          addAtBack: false,
          pos: { x: 0, y: 0 },
          behaviors: [
            { type: 'alpha', config: { alpha: { list: [{ value: 0.8, time: 0 }, { value: 0.1, time: 1 }] } } },
            { type: 'scale', config: { scale: { list: [{ value: 0.3, time: 0 }, { value: 0.1, time: 1 }] } } },
            { type: 'moveSpeed', config: { speed: { list: [{ value: 10, time: 0 }, { value: 5, time: 1 }] } } },
            { type: 'rotationStatic', config: { min: 0, max: 360 } },
            { type: 'textureSingle', config: { texture: particleTexture } }
          ],
        };
      } else if (customization.aura === 'sparkle') {
        newConfig = {
          lifetime: { min: 0.2, max: 0.6 },
          frequency: 0.02,
          emitterLifetime: -1,
          maxParticles: 500,
          addAtBack: false,
          pos: { x: 0, y: 0 },
          behaviors: [
            { type: 'alpha', config: { alpha: { list: [{ value: 1, time: 0 }, { value: 0, time: 1 }] } } },
            { type: 'scale', config: { scale: { list: [{ value: 0.2, time: 0 }, { value: 0.01, time: 1 }] } } },
            { type: 'moveSpeed', config: { speed: { list: [{ value: 60, time: 0 }, { value: 30, time: 1 }] } } },
            { type: 'rotationStatic', config: { min: 0, max: 360 } },
            { type: 'color', config: { color: { list: [{ value: "ffff00", time: 0 }, { value: "ffffff", time: 0.5 }, { value: "ffff00", time: 1 }] } } },
            { type: 'textureSingle', config: { texture: particleTexture } }
          ],
        };
      }

      if (newConfig) {
        emitter.init(newConfig);
        emitter.emit = true;
      } else {
        emitter.emit = false;
      }
    } else {
      emitter.emit = false;
    }
  }
}
