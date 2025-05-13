
import { SimplePool } from 'nostr-tools';
import { ZapInfo } from '../types';
import { NostrEvent } from '../../types';

/**
 * Send a zap to a user (NIP-57)
 */
export async function sendZap(
  pool: SimplePool,
  recipientPubkey: string,
  amount: number, // in sats
  content: string = "",
  relayUrls: string[],
  lnurl?: string,
  eventId?: string
): Promise<string | null> {
  try {
    // First, get recipient's Lightning payment information
    const lnurlOrAddress = lnurl || await getLightningAddress(pool, recipientPubkey, relayUrls);
    
    if (!lnurlOrAddress) {
      console.error("No Lightning address found for recipient");
      return null;
    }
    
    // Create zap request and get invoice
    const invoice = await createZapRequest(lnurlOrAddress, amount, content, recipientPubkey, eventId);
    
    if (!invoice) {
      console.error("Failed to create Lightning invoice");
      return null;
    }
    
    // In a real implementation, we would open the invoice in a Lightning wallet
    // For now, we'll just return the invoice for demonstration
    return invoice;
  } catch (error) {
    console.error("Error sending zap:", error);
    return null;
  }
}

/**
 * Get Lightning address from user metadata (NIP-57)
 */
export async function getLightningAddress(
  pool: SimplePool,
  pubkey: string,
  relayUrls: string[]
): Promise<string | null> {
  try {
    return new Promise((resolve) => {
      let lnurl: string | null = null;
      
      // Subscribe to profile metadata to get lightning info
      const sub = pool.subscribe(relayUrls, {
        kinds: [0],
        authors: [pubkey],
        limit: 1
      }, {
        onevent: (event) => {
          try {
            const metadata = JSON.parse(event.content);
            
            // Try to get lud16 (Lightning Address) or lud06 (LNURL)
            if (metadata.lud16) {
              lnurl = metadata.lud16;
            } else if (metadata.lud06) {
              lnurl = metadata.lud06;
            }
          } catch (error) {
            console.error("Error parsing metadata:", error);
          }
        }
      });
      
      // Wait for a short time then resolve with the result
      setTimeout(() => {
        sub.close();
        resolve(lnurl);
      }, 3000);
    });
  } catch (error) {
    console.error("Error getting Lightning address:", error);
    return null;
  }
}

/**
 * Create a Zap request using LNURL (NIP-57)
 */
export async function createZapRequest(
  lnurlOrAddress: string,
  amount: number,
  content: string,
  recipientPubkey: string,
  eventId?: string
): Promise<string | null> {
  try {
    // Handle Lightning addresses (user@domain.com)
    let lnurl = lnurlOrAddress;
    if (lnurlOrAddress.includes('@')) {
      lnurl = `https://${lnurlOrAddress.split('@')[1]}/.well-known/lnurlp/${lnurlOrAddress.split('@')[0]}`;
    }
    
    // In a real implementation, you would:
    // 1. Fetch the LNURL endpoint
    // 2. Create a zap request event
    // 3. Get the invoice from the LNURL service
    // 4. Return the invoice to be paid
    
    // For demonstration purposes, return a mock invoice
    return `lnbc${amount}n1...mock_invoice_for_${recipientPubkey.substring(0, 8)}`;
  } catch (error) {
    console.error("Error creating zap request:", error);
    return null;
  }
}
