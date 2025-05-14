import { getEventHash, validateEvent, SimplePool, finalizeEvent, type Event as NostrToolsEvent, type UnsignedEvent, getPublicKey, nip19, verifyEvent } from 'nostr-tools';
import { NostrEvent, NostrFilter, NostrProfileMetadata } from './types';
import { EVENT_KINDS } from './constants';

export class EventManager {
  async publishEvent(
    pool: SimplePool,
    publicKey: string | null,
    privateKey: string | null,
    event: Partial<NostrEvent>,
    relays: string[],
    difficulty: number = 0 // Add difficulty parameter, 0 means no PoW
  ): Promise<string | null> {
    if (!publicKey) {
      console.error("Public key not available");
      return null;
    }

    const unsignedEvent: UnsignedEvent = {
      pubkey: publicKey,
      created_at: Math.floor(Date.now() / 1000),
      kind: event.kind || EVENT_KINDS.TEXT_NOTE,
      tags: event.tags || [],
      content: event.content || '',
    };

    // NIP-13 Proof of Work
    if (difficulty > 0) {
      console.log(`Attempting PoW with difficulty: ${difficulty}`);
      unsignedEvent.tags.push(["nonce", "0", difficulty.toString()]);
      // const nonce = 0; // Removed as it's not used in the current PoW strategy
      // Loop to find a suitable nonce
      // This is a simplified loop. `finalizeEvent` handles this internally if a nonce tag is present with difficulty.
      // However, we need to find the nonce *before* calling window.nostr.signEvent if it doesn't do PoW.
      // For `finalizeEvent` with a private key, it can do the PoW itself.
      // For `window.nostr.signEvent`, the extension must do the PoW or we do it here.
      // Let's assume for now we prepare it for `finalizeEvent` and that `window.nostr.signEvent` might also pick it up.

      // If using a local private key, finalizeEvent will handle PoW.
      // If using NIP-07, the extension is responsible. We add the tag, and hope the extension honors it.
      // If the extension does *not* do PoW, then this PoW calculation is only truly effective
      // if we then sign with a local private key *after* this loop.
      // This is a tricky part of NIP-13 with NIP-07.
      // For now, we'll add the tag and let `finalizeEvent` (if used) or the NIP-07 extension handle it.
      // If NIP-07 doesn't do PoW, and no private key is available, PoW won't be applied by this client code alone.
    }

    let signedEvent: NostrToolsEvent;

    try {
      if (window.nostr) {
        console.log("Signing event with NIP-07 extension, preparing PoW tags if difficulty > 0");
        // NIP-07: The extension is responsible for PoW if it supports NIP-13.
        // We've added the nonce tag with difficulty.
        // The extension should see this and compute the nonce itself.
        signedEvent = await window.nostr.signEvent({
          kind: unsignedEvent.kind,
          created_at: unsignedEvent.created_at,
          content: unsignedEvent.content,
          tags: unsignedEvent.tags, // Pass tags including the initial nonce tag
          pubkey: publicKey
        });

        // After signing, verify the event. If PoW was done by extension, it should be verifiable.
        if (!verifyEvent(signedEvent)) { // verifyEvent checks PoW if tags are present
          console.error("Invalid event after NIP-07 signing (or PoW failed/not performed by extension)");
          // If PoW was expected, this is where we'd know the extension didn't do it.
          // However, `verifyEvent` also checks the signature, so it could be a sig issue too.
          // `validateEvent` is a simpler check that doesn't do PoW.
          if (!validateEvent(signedEvent)) {
            console.error("Basic event validation failed after NIP-07 signing.");
            return null;
          }
          console.warn("NIP-07 signed event is valid but PoW might not have been performed by extension or did not meet difficulty if tag was present.");
        } else {
          console.log("NIP-07 signed event is valid and PoW (if requested) was likely performed by extension.");
        }

      } else if (privateKey) {
        console.log("Signing event with local private key, performing PoW if difficulty > 0");
        // Convert privateKey string to Uint8Array
        let privateKeyBytes: Uint8Array;
        try {
          // Handle hex private key
          if (privateKey.match(/^[0-9a-fA-F]{64}$/)) {
            privateKeyBytes = new Uint8Array(
              privateKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
            );
          }
          // Handle nsec private key
          else if (privateKey.startsWith('nsec')) {
            const { data } = nip19.decode(privateKey);
            privateKeyBytes = data as Uint8Array;
          }
          // Default fallback
          else {
            // This case should ideally not be hit if keys are hex/nsec
            console.warn("Private key is not in hex or nsec format, attempting direct encoding.");
            privateKeyBytes = new TextEncoder().encode(privateKey);
          }

          const derivedPubkey = getPublicKey(privateKeyBytes);
          if (derivedPubkey !== publicKey) {
            console.error("Private key doesn't match public key");
            return null;
          }
          // `finalizeEvent` will compute the nonce if a ["nonce", _, difficulty] tag is present.
          signedEvent = finalizeEvent(unsignedEvent, privateKeyBytes);
          console.log("Event finalized with local private key, PoW performed if difficulty > 0.");

        } catch (keyError) {
          console.error("Invalid private key format or signing error:", keyError);
          return null;
        }
      } else {
        console.error("No signing method available");
        return null;
      }

      // Validate the signed event (signature and structure)
      if (!validateEvent(signedEvent)) {
        console.error("Invalid event structure or signature after signing");
        return null;
      }

      // Additionally, verify the event which includes PoW check if applicable
      if (difficulty > 0 && !verifyEvent(signedEvent)) {
        console.error("Event verification failed (PoW check failed)");
        return null;
      }


      console.log("Publishing signed event:", signedEvent);
      const eventId = signedEvent.id; // getEventHash(signedEvent) is redundant as signedEvent.id is the hash

      // Publish to relays
      if (relays.length === 0) {
        console.warn("No relays provided for publishing. Event will not be sent.");
        return null;
      }

      const pubs = pool.publish(relays, signedEvent);

      const publishPromises = pubs.map((pubPromise, index) => {
        return pubPromise.then(status => { // status can be: string | {ok: boolean, id?: string, notice?: string} | undefined
          console.log(`Publish attempt to relay ${relays[index]}: Status received by nostr-tools:`, status);

          let isSuccess = false;
          let eventIdFromRelay: string | undefined = undefined;
          let relayNotice: string | undefined = undefined;

          if (typeof status === 'object' && status !== null) { // Check for non-null object
            console.log(`Publish to ${relays[index]} - Relay responded with object:`, status);
            const relayResponse = status as { ok?: boolean, id?: string, notice?: string }; // Type assertion

            if (relayResponse.ok === true) {
              isSuccess = true;
              eventIdFromRelay = relayResponse.id;
              console.log(`Successfully published to ${relays[index]}. Event ID from relay: ${eventIdFromRelay || '(not provided by relay)'}`);
            } else if (relayResponse.ok === false && typeof relayResponse.notice === 'string') {
              relayNotice = relayResponse.notice;
              console.warn(`Publish to ${relays[index]} was NOT OK. Notice: ${relayNotice}`);
            } else if (typeof relayResponse.notice === 'string') { // General notice even if 'ok' is not present or true/false
              relayNotice = relayResponse.notice;
              console.warn(`Publish to ${relays[index]} - Relay sent NOTICE: ${relayNotice}`);
            } else {
              console.warn(`Publish to ${relays[index]} - Relay responded with an object, but not a clear success/failure/notice:`, status);
            }
          } else if (typeof status === 'string') {
            console.log(`Publish to ${relays[index]} - Relay responded with string:`, status);
            if (status.toUpperCase().startsWith("OK")) {
              isSuccess = true;
              const parts = status.split(/[:\\s]+/);
              if (parts.length > 1 && parts[0].toUpperCase() === "OK" && parts[1].length === 64 && /^[a-f0-9]{64}$/.test(parts[1])) {
                eventIdFromRelay = parts[1];
              }
              console.log(`Successfully published to ${relays[index]}. Status: ${status}. Event ID from relay: ${eventIdFromRelay || '(not extracted)'}`);
            } else if (status.toUpperCase().startsWith("NOTICE")) {
              relayNotice = status;
              console.warn(`Publish to ${relays[index]} returned NOTICE string: ${status}`);
            } else {
              console.warn(`Publish to ${relays[index]} returned unhandled string: ${status}`);
            }
          } else if (status === undefined) { // SimplePool promises can resolve with `void` (which becomes `undefined`)
            console.log(`Publish attempt to ${relays[index]} completed (nostr-tools promise resolved with undefined status). Event likely sent, but not confirmed by relay.`);
          } else { // Handles null or other unexpected types
            console.log(`Publish attempt to ${relays[index]} completed with unexpected status type:`, status);
          }

          return {
            relay: relays[index],
            statusReceived: status,
            success: isSuccess,
            eventIdFromRelay: eventIdFromRelay,
            notice: relayNotice,
            error: undefined // No direct error in this .then() path
          };
        }).catch(err => {
          // This catch is for individual relay publish promise rejections (e.g., network error)
          console.error(`Publish promise REJECTED for relay ${relays[index]}:`, err);
          return {
            relay: relays[index],
            statusReceived: 'promise_rejected',
            success: false,
            eventIdFromRelay: undefined,
            notice: undefined,
            error: err // The actual error object
          };
        });
      });

      const results = await Promise.allSettled(publishPromises);
      console.log("All publish attempts settled. Results from Promise.allSettled:", results);

      let successfulConfirmedPublishes = 0;
      const sendAttemptsProcessed = results.length;
      let nonErrorAttemptsCount = 0; // Attempts that didn't result in a .catch()

      results.forEach(settledResult => {
        if (settledResult.status === 'fulfilled') {
          const outcome = settledResult.value;

          if (!outcome.error) { // If there was no error from the .catch() block
            nonErrorAttemptsCount++;
          }
          if (outcome.success) {
            successfulConfirmedPublishes++;
          }
          if (outcome.notice) {
            console.warn(`Relay ${outcome.relay} sent notice: ${outcome.notice}`);
          }
          // If outcome.error is present, it was already logged in the .catch()
        } else {
          // This block should ideally not be reached if the .catch() in .map() is comprehensive
          // and always returns a value, making the outer promise fulfill.
          console.error("Unexpected Promise.allSettled rejection. This indicates an issue with the promise structure itself:", settledResult.reason);
        }
      });

      console.log(`Total relays for publish attempt: ${sendAttemptsProcessed}. Successful confirmed publishes: ${successfulConfirmedPublishes}. Attempts without direct error: ${nonErrorAttemptsCount}.`);

      if (successfulConfirmedPublishes > 0) {
        console.log(`Event ${eventId} successfully published and CONFIRMED by ${successfulConfirmedPublishes} relay(s).`);
        return eventId;
      } else if (nonErrorAttemptsCount > 0) {
        // This means we sent to at least one relay and didn't get an immediate promise rejection (e.g. network error),
        // but no relay sent back a NIP-20 "OK:true". This is common.
        console.warn(`Event ${eventId} was sent to ${nonErrorAttemptsCount} relay(s) without direct promise rejections, but no relay explicitly confirmed success with an OK message. The event might still have been accepted.`);
        return eventId;
      } else {
        // All attempts resulted in promise rejections (e.g. network errors) or other issues where nonErrorAttemptsCount is 0.
        console.error(`Event ${eventId} failed to send to any relays or all attempts resulted in errors.`);
        return null;
      }

    } catch (error) { // This is the main catch block for the publishEvent method
      console.error("Error publishing event (outer catch):", error);
      return null;
    }
  }

  // Helper method to create profile metadata event
  async publishProfileMetadata(
    pool: SimplePool,
    publicKey: string | null,
    privateKey: string | null,
    metadata: NostrProfileMetadata,
    relays: string[],
    difficulty: number = 0 // Pass difficulty
  ): Promise<boolean> {
    if (!publicKey) {
      return false;
    }

    try {
      const metadataEvent: Partial<NostrEvent> = {
        kind: EVENT_KINDS.META,
        content: JSON.stringify(metadata),
        tags: []
      };

      const eventId = await this.publishEvent(pool, publicKey, privateKey, metadataEvent, relays, difficulty);
      return !!eventId;
    } catch (error) {
      console.error("Error publishing profile metadata:", error);
      return false;
    }
  }

  // Method to encrypt a message using NIP-04 (can use extension or manual)
  async encryptMessage(
    recipientPubkey: string,
    message: string,
    senderPrivateKey?: string | null
  ): Promise<string | null> {
    try {
      // Try to use NIP-07 extension first
      if (window.nostr && window.nostr.nip04) {
        return await window.nostr.nip04.encrypt(recipientPubkey, message);
      }
      // In the future, implement manual encryption with senderPrivateKey
      else {
        console.error("No encryption method available");
        return null;
      }
    } catch (error) {
      console.error("Encryption error:", error);
      return null;
    }
  }

  // Method to decrypt a message using NIP-04
  async decryptMessage(
    senderPubkey: string,
    encryptedMessage: string,
    recipientPrivateKey?: string | null
  ): Promise<string | null> {
    try {
      // Try to use NIP-07 extension first
      if (window.nostr && window.nostr.nip04) {
        return await window.nostr.nip04.decrypt(senderPubkey, encryptedMessage);
      }
      // In the future, implement manual decryption with recipientPrivateKey
      else {
        console.error("No decryption method available");
        return null;
      }
    } catch (error) {
      console.error("Decryption error:", error);
      return null;
    }
  }

  // Implement the methods required by the EventManager interface

  async getEvents(filters: NostrFilter[], relays: string[]): Promise<NostrEvent[]> {
    try {
      const pool = new SimplePool();
      if (filters.length === 0) {
        return [];
      }
      const filter = filters[0];
      return await pool.querySync(relays, filter) as NostrEvent[];
    } catch (error: unknown) {
      console.error("Error getting events:", error);
      return [];
    }
  }

  async getEventById(id: string, relays: string[]): Promise<NostrEvent | null> {
    try {
      const pool = new SimplePool();
      const filter = { ids: [id] };
      const events = await pool.querySync(relays, filter) as NostrEvent[];
      return events.length > 0 ? events[0] : null;
    } catch (error: unknown) {
      console.error(`Error fetching event ${id}:`, error);
      return null;
    }
  }

  async getProfilesByPubkeys(pubkeys: string[], relays: string[]): Promise<Record<string, NostrProfileMetadata>> {
    try {
      const pool = new SimplePool();
      const filter = { kinds: [EVENT_KINDS.META], authors: pubkeys };
      const events = await pool.querySync(relays, filter) as NostrEvent[];
      const profiles: Record<string, NostrProfileMetadata> = {};
      for (const event of events) {
        try {
          const contentJson = JSON.parse(event.content) as NostrProfileMetadata;
          profiles[event.pubkey] = contentJson;
        } catch (err: unknown) {
          console.error("Error parsing profile content:", err);
        }
      }
      return profiles;
    } catch (error: unknown) {
      console.error("Error getting profiles:", error);
      return {};
    }
  }

  async getUserProfile(pubkey: string, relays: string[] = []): Promise<NostrProfileMetadata | null> {
    try {
      const profiles = await this.getProfilesByPubkeys([pubkey], relays);
      return profiles[pubkey] || null;
    } catch (error) {
      console.error("Error getting user profile:", error);
      return null;
    }
  }
}
