
import Phaser from 'phaser';

/**
 * UI utility functions for the game
 */
export class UIUtils {
  /**
   * Display a temporary message in the game
   */
  static showMessage(scene: Phaser.Scene, text: string, color: number = 0xffffff): void {
    const message = scene.add.text(400, 500, text, {
      fontSize: '24px',
      color: `#${color.toString(16).padStart(6, '0')}`,
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    scene.tweens.add({
      targets: message,
      alpha: 0,
      y: 480,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => message.destroy()
    });
  }
}
