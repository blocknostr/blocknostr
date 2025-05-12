
// Add publishRelayList method to the NostrService class
/**
 * Publish a list of relays according to NIP-65
 * @param relays Array of relay objects with url, read, and write properties
 * @returns Boolean indicating success
 */
public async publishRelayList(relays: { url: string, read: boolean, write: boolean }[]): Promise<boolean> {
  if (!this.publicKey) {
    console.error("Cannot publish relay list: not logged in");
    return false;
  }
  
  try {
    // Create tags for each relay as per NIP-65
    const tags = relays.map(relay => {
      const readWrite = [];
      if (relay.read) readWrite.push('read');
      if (relay.write) readWrite.push('write');
      return ['r', relay.url, ...readWrite];
    });
    
    // Create and publish the event
    const event: Partial<NostrEvent> = {
      kind: 10002, // NIP-65: Relay List Metadata
      tags,
      content: '' // Usually empty
    };
    
    const eventId = await this.publishEvent(event);
    return !!eventId;
  } catch (error) {
    console.error("Error publishing relay list:", error);
    return false;
  }
}
