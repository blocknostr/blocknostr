
import { nostrService } from './service';
import { NostrAdapter } from './adapters/nostr-adapter';

// Create an adapted instance and export it to replace the original
export const adaptedNostrService = new NostrAdapter(nostrService);
