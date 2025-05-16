
import Phaser from 'phaser';

/**
 * Creates animations for pet sprites
 */
export const setupPetAnimations = (anims: Phaser.Animations.AnimationManager): void => {
  // Create animations for each evolution stage
  for (let stage = 1; stage <= 3; stage++) {
    anims.create({
      key: `idle_stage${stage}`,
      frames: anims.generateFrameNumbers(`pet_stage${stage}`, { start: 0, end: 3 }),
      frameRate: 4,
      repeat: -1
    });
    
    anims.create({
      key: `eat_stage${stage}`,
      frames: anims.generateFrameNumbers(`pet_stage${stage}`, { start: 4, end: 7 }),
      frameRate: 8,
      repeat: 0
    });
    
    anims.create({
      key: `play_stage${stage}`,
      frames: anims.generateFrameNumbers(`pet_stage${stage}`, { start: 8, end: 11 }),
      frameRate: 8,
      repeat: 0
    });
    
    anims.create({
      key: `rest_stage${stage}`,
      frames: anims.generateFrameNumbers(`pet_stage${stage}`, { start: 12, end: 15 }),
      frameRate: 6,
      repeat: 0
    });
  }
};
