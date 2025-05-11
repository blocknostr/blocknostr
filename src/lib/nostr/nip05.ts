
export async function verifyNip05(identifier: string): Promise<string | null> {
  if (!identifier || !identifier.includes('@')) {
    return null;
  }

  try {
    const [name, domain] = identifier.split('@');
    const url = `https://${domain}/.well-known/nostr.json?name=${name}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.names?.[name] || null;
  } catch (error) {
    console.error("Error verifying NIP-05:", error);
    return null;
  }
}

export async function fetchNip05Data(identifier: string): Promise<{
  relays?: Record<string, { read: boolean; write: boolean }>;
  [key: string]: any;
} | null> {
  if (!identifier || !identifier.includes('@')) {
    return null;
  }

  try {
    const [name, domain] = identifier.split('@');
    const url = `https://${domain}/.well-known/nostr.json?name=${name}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    // Get relays for the user
    const pubkey = data.names?.[name];
    if (!pubkey) {
      return null;
    }
    
    // Return the user's relay information if available
    const relays = data.relays?.[pubkey] || {};
    return { relays };
  } catch (error) {
    console.error("Error fetching NIP-05 data:", error);
    return null;
  }
}
