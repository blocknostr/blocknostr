
/**
 * Base class for event emitters in the browser
 */
export class BrowserEventEmitter {
  private events: Map<string, Array<(...args: any[]) => void>>;
  
  constructor() {
    this.events = new Map();
  }
  
  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    
    this.events.get(event)?.push(callback);
  }
  
  off(event: string, callback: (...args: any[]) => void): void {
    const callbacks = this.events.get(event);
    
    if (callbacks) {
      this.events.set(
        event,
        callbacks.filter(cb => cb !== callback)
      );
    }
  }
  
  emit(event: string, ...args: any[]): void {
    const callbacks = this.events.get(event);
    
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }
  
  removeAllListeners(): void {
    this.events.clear();
  }
}
