
/**
 * Publish a Nostr event
 * Helper method for other components to publish events
 */
async publishEvent(
  pool: SimplePool,
  publicKey: string | null,
  privateKey: string | null,
  event: any,
  relays: string[]
): Promise<string | null> {
  console.log("CommunityManager.publishEvent called with:", { 
    event, 
    publicKey: publicKey ? publicKey.slice(0, 8) + '...' : null,
    hasPrivateKey: !!privateKey,
    relaysCount: relays.length
  });
  
  if (!publicKey) {
    console.error("Cannot publish event: missing publicKey");
    return null;
  }
  
  if (relays.length === 0) {
    console.warn("No relays provided for publishing, using default relays");
    relays = [
      'wss://relay.damus.io',
      'wss://nos.lol',
      'wss://relay.nostr.band',
      'wss://nostr.bitcoiner.social'
    ];
  }
  
  return this.eventManager.publishEvent(pool, publicKey, privateKey, event, relays);
}
