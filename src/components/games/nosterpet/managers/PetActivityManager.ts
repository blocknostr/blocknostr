
import Phaser from 'phaser';
import { UIUtils } from '../utils/UIUtils';

/**
 * Manages pet activities like feeding, playing, resting
 */
export class PetActivityManager {
  /**
   * Handle pet feeding
   */
  static feed(
    scene: Phaser.Scene,
    pet: Phaser.GameObjects.Sprite,
    petName: string,
    evolutionStage: number,
    sound: Phaser.Sound.BaseSound,
    stats: { hunger: number, energy: number, experience: number },
    checkEvolution: () => void,
    updateUI: () => void,
    saveState: () => void
  ): void {
    if (stats.hunger > 0 && stats.energy >= 10) {
      stats.hunger = Phaser.Math.Clamp(stats.hunger - 30, 0, 100);
      stats.energy = Phaser.Math.Clamp(stats.energy - 10, 0, 100);
      stats.experience += 15;
      
      // Play animation and sound
      sound.play();
      pet.play(`eat_stage${evolutionStage}`);
      pet.once('animationcomplete', () => {
        pet.play(`idle_stage${evolutionStage}`);
      });
      
      checkEvolution();
      updateUI();
      saveState();
      UIUtils.showMessage(scene, `${petName} enjoys the food!`);
    } else {
      UIUtils.showMessage(scene, "Not enough energy to eat or not hungry");
    }
  }

  /**
   * Handle pet play activity
   */
  static play(
    scene: Phaser.Scene,
    pet: Phaser.GameObjects.Sprite,
    petName: string,
    evolutionStage: number,
    sound: Phaser.Sound.BaseSound,
    stats: { happiness: number, energy: number, experience: number },
    checkEvolution: () => void,
    updateUI: () => void,
    saveState: () => void
  ): void {
    if (stats.happiness < 100 && stats.energy >= 15) {
      stats.happiness = Phaser.Math.Clamp(stats.happiness + 30, 0, 100);
      stats.energy = Phaser.Math.Clamp(stats.energy - 15, 0, 100);
      stats.experience += 20;
      
      // Play animation and sound
      sound.play();
      pet.play(`play_stage${evolutionStage}`);
      pet.once('animationcomplete', () => {
        pet.play(`idle_stage${evolutionStage}`);
      });
      
      checkEvolution();
      updateUI();
      saveState();
      UIUtils.showMessage(scene, `${petName} is having fun!`);
    } else {
      UIUtils.showMessage(scene, "Not enough energy to play or already happy");
    }
  }

  /**
   * Handle pet rest activity
   */
  static rest(
    scene: Phaser.Scene,
    pet: Phaser.GameObjects.Sprite,
    petName: string,
    evolutionStage: number,
    sound: Phaser.Sound.BaseSound,
    stats: { energy: number, hunger: number, experience: number },
    checkEvolution: () => void,
    updateUI: () => void,
    saveState: () => void
  ): void {
    if (stats.energy < 100) {
      stats.energy = Phaser.Math.Clamp(stats.energy + 40, 0, 100);
      stats.hunger = Phaser.Math.Clamp(stats.hunger + 5, 0, 100);
      stats.experience += 10;
      
      // Play animation and sound
      sound.play();
      pet.play(`rest_stage${evolutionStage}`);
      pet.once('animationcomplete', () => {
        pet.play(`idle_stage${evolutionStage}`);
      });
      
      checkEvolution();
      updateUI();
      saveState();
      UIUtils.showMessage(scene, `${petName} is resting peacefully`);
    } else {
      UIUtils.showMessage(scene, "Already fully energized");
    }
  }
}
