
  /**
   * Publish an event to specified relays
   */
  async publishEvent(
    pool: SimplePool,
    publicKey: string | null,
    privateKey: string | null | undefined,
    event: Partial<NostrEvent>,
    relays: string[]
  ): Promise<string | null> {
    return new Promise((resolve, reject) => {
      if (!publicKey) {
        reject(new Error("Cannot publish event: No public key provided"));
        return;
      }
      
      // Ensure the event has the required fields
      const signedEvent = {
        kind: event.kind || 1,
        pubkey: publicKey,
        content: event.content || '',
        created_at: Math.floor(Date.now() / 1000),
        tags: event.tags || [],
        id: '', // Will be filled by the extension
        sig: '', // Will be filled by the extension
      };
      
      // Sign the event using the window.nostr extension
      window.nostr?.signEvent(signedEvent)
        .then(signed => {
          if (!signed) {
            reject(new Error("Failed to sign event"));
            return;
          }
          
          // Use publish method to broadcast to relays
          const pub = pool.publish(relays, signed);
          
          // Set timeout to resolve after reasonable time
          const timeout = setTimeout(() => {
            resolve(signedEvent.id || null);
          }, 5000);
          
          // Clean up timeout when done
          pub.then(() => {
            clearTimeout(timeout);
            resolve(signedEvent.id || null);
          }).catch(err => {
            clearTimeout(timeout);
            reject(err);
          });
        })
        .catch(err => {
          console.error("Error signing event:", err);
          reject(err);
        });
    });
  }

  // Fix other subscription methods using proper SimplePool API
  subscribeToEvents(pool: SimplePool, filters: any[], relays: string[]): { sub: string, unsubscribe: () => void } {
    try {
      const sub = pool.subscribe(relays, filters);
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

  // Fix getProfilesByPubkeys 
  async getProfilesByPubkeys(pool: SimplePool, pubkeys: string[], relays: string[]): Promise<Record<string, any>> {
    return new Promise((resolve) => {
      const profiles: Record<string, any> = {};
      
      const sub = pool.subscribe(relays, [{kinds: [EVENT_KINDS.METADATA], authors: pubkeys}], {
        onevent: (event) => {
          try {
            if (event.kind === EVENT_KINDS.METADATA) {
              profiles[event.pubkey] = JSON.parse(event.content);
            }
          } catch (error) {
            console.error('Error parsing profile:', error);
          }
        }
      });
      
      // Set timeout to resolve after 3 seconds
      setTimeout(() => {
        sub.close();
        resolve(profiles);
      }, 3000);
    });
  }

  // Fix getEvents
  async getEvents(pool: SimplePool, ids: string[], relays: string[]): Promise<any[]> {
    return new Promise((resolve) => {
      const events: any[] = [];
      
      const sub = pool.subscribe(relays, [{ids}], {
        onevent: (event) => {
          events.push(event);
        }
      });
      
      // Set timeout to resolve after 3 seconds
      setTimeout(() => {
        sub.close();
        resolve(events);
      }, 3000);
    });
  }

  // Fix getEventById
  async getEventById(pool: SimplePool, id: string, relays: string[]): Promise<any> {
    return new Promise((resolve, reject) => {
      let foundEvent: any = null;
      
      const sub = pool.subscribe(relays, [{ids: [id]}], {
        onevent: (event) => {
          if (event.id === id) {
            foundEvent = event;
            sub.close();
            resolve(event);
          }
        }
      });
      
      // Set timeout to reject after 5 seconds
      setTimeout(() => {
        sub.close();
        if (foundEvent) {
          resolve(foundEvent);
        } else {
          reject(new Error(`Timeout fetching event ${id}`));
        }
      }, 5000);
    });
  }
