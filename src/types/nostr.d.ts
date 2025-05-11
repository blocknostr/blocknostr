
declare global {
  interface Window {
    nostr?: {
      getPublicKey: () => Promise<string>;
      signEvent: (event: any) => Promise<any>;
      nip04: {
        encrypt: (pubkey: string, plaintext: string) => Promise<string>;
        decrypt: (pubkey: string, ciphertext: string) => Promise<string>;
      };
      getRelays?: () => Promise<Record<string, { read: boolean; write: boolean }>>;
      signSchnorr?: (message: string) => Promise<string>;
      delegate?: {
        delegate: (constraints: any) => Promise<any>;
        listDelegations: () => Promise<any[]>;
      };
    };
  }
}

export {};
