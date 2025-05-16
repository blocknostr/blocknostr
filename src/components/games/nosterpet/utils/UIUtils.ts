import * as PIXI from 'pixi.js';

export class UIUtils {
  static showMessage(
    stage: PIXI.Container, // Changed from PIXI.Container
    text: string,
    color: number,
    tickerInstance: PIXI.ticker.Ticker // Corrected to PIXI.ticker.Ticker
  ): void {
    const textStyle = new PIXI.TextStyle({ // Changed from PIXI.TextStyle
      fontFamily: 'Arial',
      fontSize: 24,
      fill: color,
      align: 'center'
    });

    const message = new PIXI.Text(text, textStyle); // Changed from PIXI.Text
    message.anchor.set(0.5);
    message.x = stage.width / 2;
    message.y = stage.height / 2;
    stage.addChild(message);

    // Remove the message after a delay
    const timeoutId = setTimeout(() => {
      stage.removeChild(message);
      message.destroy();
    }, 3000); // 3 seconds

    // Example of cleanup, adjust as needed for your game's lifecycle
    // if (tickerInstance && tickerInstance.remove) { // Check if tickerInstance is a Ticker and has remove method
    //   // This is a conceptual example; actual cleanup depends on Ticker's API for removing listeners
    // }
  }
}