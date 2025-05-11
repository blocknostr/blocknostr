
// Fix the SimplePool subscription methods
/**
 * Create a subscription to events matching the given filters
 */
export function subscribeToEvents(
  pool: SimplePool,
  filters: any[],
  relays: string[]
): { sub: string, unsubscribe: () => void } {
  try {
    const sub = pool.subscribe(relays, filters, {
      onevent: () => {},
      onclose: () => {}
    });
    
    return {
      sub: 'subscription-' + Math.random().toString(36).substring(2, 10),
      unsubscribe: () => sub.close()
    };
  } catch (error) {
    console.error('Error subscribing to events:', error);
    return {
      sub: '',
      unsubscribe: () => {}
    };
  }
}
