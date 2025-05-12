
// Re-export all components from the service
export * from './constants';
export * from './types';
export * from './service';
export * from './utils/keys';
export * from './utils/event-deduplication';

// Import the service once and export it as a constant to avoid circular dependencies
import { nostrService } from './service';
export { nostrService };

// Also export content cache and formatter
import { contentCache } from './cache/content-cache';
import { contentFormatter } from './utils/content-formatter';
export { contentCache, contentFormatter };
