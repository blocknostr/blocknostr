
import { SimplePool } from 'nostr-tools';

export interface BookmarkCollection {
  id: string;
  name: string;
  color?: string;
  description?: string;
  totalItems: number;
}

export interface BookmarkWithMetadata {
  eventId: string;
  collectionId?: string;
  tags?: string[];
  note?: string;
}

export interface BookmarkManagerDependencies {
  publishEvent: (
    pool: SimplePool,
    publicKey: string | null,
    privateKey: string | null | undefined,
    event: any,
    relays: string[]
  ) => Promise<string | null>;
}
