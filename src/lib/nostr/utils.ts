
/**
 * Validates if a string is a valid relay URL
 * @param url - URL to validate
 * @returns boolean indicating if the URL is valid
 */
export function isValidRelayUrl(url: string): boolean {
  try {
    // Must be in wss:// format
    if (!url.startsWith('wss://')) {
      return false;
    }
    
    // Basic URL validation
    new URL(url);
    
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Tests if a relay is responsive
 * @param relayUrl - URL of the relay to test
 * @returns Promise that resolves to the response time in ms, or rejects if connection fails
 */
export async function testRelayConnection(relayUrl: string): Promise<number> {
  return new Promise((resolve, reject) => {
    try {
      const startTime = performance.now();
      const socket = new WebSocket(relayUrl);
      
      // Set timeout for connection
      const timeout = setTimeout(() => {
        socket.close();
        reject(new Error('Connection timeout'));
      }, 5000);
      
      socket.onopen = () => {
        clearTimeout(timeout);
        const endTime = performance.now();
        const latency = Math.round(endTime - startTime);
        
        // Send a ping to test responsiveness
        try {
          socket.send(JSON.stringify(["REQ", "ping", { "limit": 1 }]));
        } catch (err) {
          // Ignore error, we're just testing connection
        }
        
        setTimeout(() => {
          socket.close();
          resolve(latency);
        }, 500);
      };
      
      socket.onerror = (error) => {
        clearTimeout(timeout);
        socket.close();
        reject(error);
      };
      
    } catch (error) {
      reject(error);
    }
  });
}
