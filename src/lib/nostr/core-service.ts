import { SimplePool, getEventHash, getSignature } from 'nostr-tools';
import { NostrEvent, NostrFilter } from './types';
import { DEFAULT_RELAYS } from './constants';
import { eventBus, EVENTS } from '@/lib/services/EventBus';

/**
 * CoreNostrService - Pure Protocol Operations Only
 * 
 * This simplified service handles ONLY:
 * - Raw Nostr protocol operations (subscribe, publish, query)
 * - WebSocket connection management
 * - Event signing and validation
 * - Basic relay operations
 * 
 * Business logic is handled by Redux slices and hooks.
 * Size: <200 lines vs 1203 lines in the original service
 */

// ✅ NEW: Circuit breaker state management
interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'closed' | 'open' | 'half-open';
}

export class CoreNostrService {
  private pool: SimplePool;
  private connectedRelays = new Set<string>();
  private publicKey: string | null = null;
  private privateKey: string | null = null;
  
  // ✅ Circuit breaker and rate limiting
  private circuitBreakers = new Map<string, CircuitBreakerState>();
  private connectionAttempts = new Map<string, number>();
  private lastConnectionTime = new Map<string, number>();
  private isConnecting = false; // Global connection lock
  
  // ✅ Enhanced connection state management
  private connectionPromise: Promise<string[]> | null = null;
  private connectionPromiseResolver: ((value: string[]) => void) | null = null;
  private lastConnectionCheck = 0;
  private readonly CONNECTION_RECHECK_INTERVAL = 10000; // 10 seconds

  // ✅ NEW: Subscription pool management to prevent "too many concurrent REQs"
  private activeSubscriptions = new Map<string, any>(); // Track active subscriptions
  private subscriptionQueue: Array<{
    id: string;
    filters: NostrFilter[];
    onEvent: (event: NostrEvent) => void;
    relays: string[];
    resolve: (subId: string) => void;
    reject: (error: Error) => void;
  }> = [];
  private readonly MAX_CONCURRENT_SUBSCRIPTIONS = 1; // Starting conservative baseline
  private readonly ADAPTIVE_MAX_LIMIT = 3; // ✅ Maximum if relay can handle it
  private subscriptionCounts = new Map<string, number>(); // Track per-relay subscription counts
  private subscriptionDeduplication = new Map<string, string>(); // Deduplicate similar requests

  // ✅ NEW: Subscription batching to combine similar requests
  private subscriptionBatchTimeout: NodeJS.Timeout | null = null;
  private pendingBatchedSubscriptions: Array<{
    id: string;
    filters: NostrFilter[];
    onEvent: (event: NostrEvent) => void;
    relays: string[];
    resolve: (subId: string) => void;
    reject: (error: Error) => void;
    priority: 'high' | 'normal' | 'low';
  }> = [];
  private readonly BATCH_TIMEOUT = 200; // ✅ INCREASED: 200ms batching window
  private batchedSubscriptionHandlers = new Map<string, Array<(event: NostrEvent) => void>>();

  // ✅ NEW: Global rate limiting
  private lastSubscriptionTime = 0;
  private readonly MIN_SUBSCRIPTION_INTERVAL = 100; // ✅ NEW: 100ms minimum between subscriptions
  private subscriptionRateLimitQueue: Array<() => void> = [];
  private isProcessingRateLimit = false;

  // ✅ NEW: Per-relay adaptive limits and performance tracking
  private relayLimits = new Map<string, number>(); // Dynamic limits per relay
  private relayPerformance = new Map<string, {
    successfulSubscriptions: number;
    rejectedSubscriptions: number;
    lastRejectionTime: number;
    currentLimit: number;
    lastLimitIncrease: number;
    consecutiveSuccesses: number;
  }>();
  private readonly PERFORMANCE_WINDOW = 300000; // 5 minutes performance tracking
  private readonly SUCCESS_THRESHOLD = 10; // ✅ INCREASED: 10 successful subscriptions before increasing limit (was 5)
  private readonly REJECTION_PENALTY_TIME = 120000; // ✅ INCREASED: 2 minute penalty after rejection (was 1 minute)

  // ✅ NEW: Enhanced NOTICE message tracking
  private relayNoticeCount = new Map<string, number>();
  private lastNoticeTime = new Map<string, number>();
  private readonly MAX_NOTICES_BEFORE_LIMIT_DECREASE = 2; // Decrease limit after 2 notices
  private readonly NOTICE_RESET_TIME = 180000; // Reset notice count after 3 minutes

  constructor() {
    try {
      this.pool = new SimplePool();
      this.loadKeys();
      
      // Add global error handler for unhandled relay errors
      if (typeof window !== 'undefined') {
        window.addEventListener('unhandledrejection', (event) => {
          const errorMessage = event.reason?.message || event.reason?.toString() || '';
          
          // Handle nostr-tools protocol errors
          if (errorMessage.includes('unexpected size for fixed-size tag')) {
            console.warn('[CoreNostrService] Caught relay protocol error:', errorMessage);
            event.preventDefault(); // Prevent the error from crashing the app
            return;
          }
          
          // ✅ ENHANCED: Handle paid relay restriction errors gracefully
          if (errorMessage.includes('restricted') || 
              errorMessage.includes('not an active paid member') ||
              errorMessage.includes('pay') || 
              errorMessage.includes('membership required') ||
              errorMessage.includes('subscription required')) {
            console.warn('[CoreNostrService] Caught paid relay restriction:', errorMessage);
            event.preventDefault(); // Prevent the error from appearing as uncaught
            return;
          }
          
          // Handle other relay connection errors silently if they're not critical
          if (errorMessage.includes('WebSocket') || 
              errorMessage.includes('connection') ||
              errorMessage.includes('relay')) {
            console.warn('[CoreNostrService] Caught relay connection error:', errorMessage);
            event.preventDefault();
            return;
          }
        });
        
        // ✅ ENHANCED: Listen for relay rejection messages to adjust limits
        window.addEventListener('message', (event) => {
          if (event.data && Array.isArray(event.data) && event.data[0] === 'NOTICE') {
            const message = event.data[1];
            if (message && message.toLowerCase().includes('too many concurrent req')) {
              console.log('[CoreNostrService] 🚫 Detected relay rejection:', message);
              
              // ✅ NEW: Try to identify the relay from the message context
              // This is a best-effort approach since NOTICE doesn't always include relay info
              this.handleGenericRelayRejection(message);
            }
          }
        });

        // ✅ NEW: Enhanced relay message monitoring via SimplePool events
        if (this.pool && typeof this.pool.on === 'function') {
          this.pool.on('notice', (relayUrl: string, message: string) => {
            if (message.toLowerCase().includes('too many concurrent req')) {
              console.log(`[CoreNostrService] 🚫 NOTICE from ${relayUrl}: ${message}`);
              this.handleSpecificRelayRejection(relayUrl, message);
            }
          });
        }

        // ✅ NEW: Monitor console for relay rejection messages
        const originalConsoleLog = console.log;
        console.log = (...args) => {
          const message = args.join(' ');
          if (message.includes('NOTICE from') && message.includes('too many concurrent REQ')) {
            // Extract relay URL from console message like "NOTICE from wss://relay.primal.net/: ERROR: too many concurrent REQs"
            const relayMatch = message.match(/NOTICE from (wss:\/\/[^\/]+[^:]*)/);
            if (relayMatch) {
              const relayUrl = relayMatch[1].replace(/\/$/, ''); // Remove trailing slash
              console.warn(`[CoreNostrService] 🚫 Detected relay rejection via console: ${relayUrl}`);
              this.handleSpecificRelayRejection(relayUrl, message);
            }
          }
          originalConsoleLog.apply(console, args);
        };
      }
      
      // Connect to default relays with improved connection handling
      this.connectToDefaultRelays().catch(error => {
        console.warn('[CoreNostrService] Initial relay connection failed:', error);
      });
      console.log('[CoreNostrService] Initialized with circuit breaker protection');
    } catch (error) {
      console.error('[CoreNostrService] Failed to initialize service:', error);
      // Initialize with a fallback state
      this.publicKey = null;
      this.privateKey = null;
    }
  }

  // ===== KEY MANAGEMENT =====
  
  private loadKeys(): void {
    try {
      this.publicKey = localStorage.getItem('nostr-publicKey');
      this.privateKey = localStorage.getItem('nostr-privateKey');
    } catch (error) {
      console.error('[CoreNostrService] Failed to load keys:', error);
    }
  }

  public getPublicKey(): string | null {
    return this.publicKey;
  }

  public async login(): Promise<boolean> {
    try {
      if (window.nostr) {
        this.publicKey = await window.nostr.getPublicKey();
        localStorage.setItem('nostr-publicKey', this.publicKey);
        
        // Emit authentication state change
        eventBus.emit(EVENTS.AUTH_CHANGED, {
          isLoggedIn: true,
          publicKey: this.publicKey
        });
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('[CoreNostrService] Login failed:', error);
      return false;
    }
  }

  public signOut(): void {
    this.publicKey = null;
    this.privateKey = null;
    localStorage.removeItem('nostr-publicKey');
    localStorage.removeItem('nostr-privateKey');
    
    // Emit authentication state change
    eventBus.emit(EVENTS.AUTH_CHANGED, {
      isLoggedIn: false,
      publicKey: null
    });
  }

  // ===== RELAY MANAGEMENT =====

  // ✅ NEW: Circuit breaker logic
  private getCircuitBreakerState(relayUrl: string): CircuitBreakerState {
    if (!this.circuitBreakers.has(relayUrl)) {
      this.circuitBreakers.set(relayUrl, {
        failures: 0,
        lastFailureTime: 0,
        state: 'closed'
      });
    }
    return this.circuitBreakers.get(relayUrl)!;
  }

  private canAttemptConnection(relayUrl: string): boolean {
    const breaker = this.getCircuitBreakerState(relayUrl);
    const now = Date.now();
    
    // Import connection config
    import('./constants').then(({ CONNECTION_CONFIG }) => {
      if (breaker.state === 'open') {
        // Check if circuit breaker timeout has passed
        if (now - breaker.lastFailureTime > CONNECTION_CONFIG.CIRCUIT_BREAKER_TIMEOUT) {
          breaker.state = 'half-open';
          breaker.failures = 0;
          console.log(`[CoreNostrService] Circuit breaker half-open for ${relayUrl}`);
          return true;
        }
        return false;
      }
    });
    
    return breaker.state !== 'open';
  }

  private recordConnectionSuccess(relayUrl: string): void {
    const breaker = this.getCircuitBreakerState(relayUrl);
    breaker.failures = 0;
    breaker.state = 'closed';
    this.connectionAttempts.delete(relayUrl);
  }

  private recordConnectionFailure(relayUrl: string): void {
    const breaker = this.getCircuitBreakerState(relayUrl);
    breaker.failures++;
    breaker.lastFailureTime = Date.now();
    
    import('./constants').then(({ CONNECTION_CONFIG }) => {
      if (breaker.failures >= CONNECTION_CONFIG.CIRCUIT_BREAKER_FAILURES) {
        breaker.state = 'open';
        console.warn(`[CoreNostrService] Circuit breaker OPEN for ${relayUrl} after ${breaker.failures} failures`);
      }
    });
  }

  // ✅ NEW: Exponential backoff calculation
  private calculateBackoffDelay(relayUrl: string): number {
    const attempts = this.connectionAttempts.get(relayUrl) || 0;
    return Math.min(1000 * Math.pow(2, attempts), 30000); // Max 30 seconds
  }

  public async connectToDefaultRelays(): Promise<string[]> {
    const now = Date.now();
    
    // ✅ Return existing connections if they're recent enough
    if (this.connectedRelays.size > 0 && (now - this.lastConnectionCheck) < this.CONNECTION_RECHECK_INTERVAL) {
      console.log(`[CoreNostrService] Using existing ${this.connectedRelays.size} connections (checked ${Math.round((now - this.lastConnectionCheck) / 1000)}s ago)`);
      return this.getConnectedRelays();
    }
    
    // ✅ Return existing promise if connection is in progress
    if (this.connectionPromise) {
      console.log('[CoreNostrService] Connection already in progress, waiting for existing promise...');
      return this.connectionPromise;
    }

    // ✅ Create new connection promise
    this.connectionPromise = this.performConnection();
    this.lastConnectionCheck = now;
    
    try {
      const result = await this.connectionPromise;
      return result;
    } finally {
      // ✅ Clean up promise reference
      this.connectionPromise = null;
      this.connectionPromiseResolver = null;
    }
  }

  // ✅ Separated connection logic for better management
  private async performConnection(): Promise<string[]> {
    this.isConnecting = true;
    
    try {
      const { DEFAULT_RELAYS } = await import('./constants');
      console.log(`[CoreNostrService] Connecting to ${DEFAULT_RELAYS.length} default relays with circuit breaker protection`);
      
      const result = await this.connectToRelays(DEFAULT_RELAYS);
      return result;
    } finally {
      this.isConnecting = false;
    }
  }

  public async connectToRelays(relayUrls: string[]): Promise<string[]> {
    const connected: string[] = [];
    const { CONNECTION_CONFIG } = await import('./constants');
    
    // Filter relays that can be attempted (circuit breaker check)
    const attemptableRelays = relayUrls.filter(url => this.canAttemptConnection(url));
    
    if (attemptableRelays.length === 0) {
      console.warn('[CoreNostrService] No relays available due to circuit breaker protection');
      return connected;
    }
    
    console.log(`[CoreNostrService] Attempting to connect to ${attemptableRelays.length}/${relayUrls.length} relays`);

    // Connection promises with retry logic
    const connectionPromises = attemptableRelays.map(async (url) => {
      const attempts = this.connectionAttempts.get(url) || 0;
      
      if (attempts >= CONNECTION_CONFIG.MAX_RETRIES) {
        console.warn(`[CoreNostrService] Max retries exceeded for ${url}`);
        return null;
      }

      // Update attempt count
      this.connectionAttempts.set(url, attempts + 1);
      
      // Calculate backoff delay
      const backoffDelay = this.calculateBackoffDelay(url);
      const lastAttempt = this.lastConnectionTime.get(url) || 0;
      const timeSinceLastAttempt = Date.now() - lastAttempt;
      
      if (timeSinceLastAttempt < backoffDelay) {
        const waitTime = backoffDelay - timeSinceLastAttempt;
        console.log(`[CoreNostrService] Waiting ${waitTime}ms before retry for ${url}`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      this.lastConnectionTime.set(url, Date.now());

      return this.attemptSingleConnection(url);
    });

    // Wait for all connection attempts
    try {
      const results = await Promise.allSettled(connectionPromises);
      
      results.forEach((result, index) => {
        const url = attemptableRelays[index];
        
        if (result.status === 'fulfilled' && result.value) {
          this.connectedRelays.add(url);
          connected.push(url);
          this.recordConnectionSuccess(url);
          eventBus.emit(EVENTS.RELAY_CONNECTED, { relay: url });
          console.log(`[CoreNostrService] ✅ Connected to ${url}`);
        } else {
          this.recordConnectionFailure(url);
          console.warn(`[CoreNostrService] ❌ Failed to connect to ${url}`);
        }
      });
    } catch (error) {
      console.error('[CoreNostrService] Error in bulk connection:', error);
    }
    
    console.log(`[CoreNostrService] Successfully connected to ${connected.length}/${relayUrls.length} relays`);
    
    // Check if we have minimum required relays
    if (connected.length < CONNECTION_CONFIG.MIN_SUCCESSFUL_RELAYS) {
      console.warn(`[CoreNostrService] Warning: Only ${connected.length} relays connected, minimum recommended is ${CONNECTION_CONFIG.MIN_SUCCESSFUL_RELAYS}`);
    }
    
    return connected;
  }

  // ✅ NEW: Single connection attempt with proper timeout and validation
  private async attemptSingleConnection(url: string): Promise<string | null> {
    const { CONNECTION_CONFIG } = await import('./constants');
    
    return new Promise<string | null>((resolve) => {
      const timeout = setTimeout(() => {
        console.warn(`[CoreNostrService] Connection timeout for ${url}`);
        resolve(null);
      }, CONNECTION_CONFIG.CONNECTION_TIMEOUT);

      try {
        // Create a minimal test subscription
        const testFilter = { 
          kinds: [1], 
          limit: 1, 
          since: Math.floor(Date.now() / 1000) - 300 // Last 5 minutes
        };
        
        let hasResponded = false;
        
        const testSub = this.pool.subscribeManyEose([url], [testFilter], {
          onevent: (event) => {
            if (!hasResponded) {
              hasResponded = true;
              clearTimeout(timeout);
              setTimeout(() => testSub.close(), 100);
              resolve(url);
            }
          },
          oneose: () => {
            if (!hasResponded) {
              hasResponded = true;
              clearTimeout(timeout);
              setTimeout(() => testSub.close(), 100);
              resolve(url);
            }
          },
          onclose: (reason) => {
            if (!hasResponded) {
              clearTimeout(timeout);
              // Only consider it a failure if there's an actual error reason
              if (reason && reason.length > 0) {
                resolve(null);
              } else {
                resolve(url);
              }
            }
          }
        });

        // Backup timeout for cleanup
        setTimeout(() => {
          if (!hasResponded) {
            hasResponded = true;
            clearTimeout(timeout);
            testSub.close();
            resolve(url); // Optimistic - assume good if we got this far
          }
        }, CONNECTION_CONFIG.CONNECTION_TIMEOUT - 500);

      } catch (error) {
        clearTimeout(timeout);
        console.error(`[CoreNostrService] Error testing connection to ${url}:`, error);
        resolve(null);
      }
    });
  }

  public getConnectedRelays(): string[] {
    return Array.from(this.connectedRelays);
  }

  // ===== EVENT OPERATIONS =====

  // ✅ NEW: Subscription pool management methods
  private generateSubscriptionHash(filters: NostrFilter[], relays: string[]): string {
    // Create a hash of the filters and relays to detect duplicate subscriptions
    const filterString = JSON.stringify(filters.sort());
    const relayString = relays.sort().join(',');
    return `${filterString}_${relayString}`;
  }

  private canCreateSubscription(relays: string[]): boolean {
    // Check if we can create a subscription without exceeding dynamic relay limits
    for (const relay of relays) {
      const currentCount = this.subscriptionCounts.get(relay) || 0;
      const relayLimit = this.getRelayLimit(relay);
      
      // ✅ NEW: Skip relays that are temporarily paused (limit 0)
      if (relayLimit === 0) {
        console.log(`[CoreNostrService] 🛑 Relay ${relay.split('/').pop()} is temporarily paused`);
        continue; // Skip this relay but don't block the subscription
      }
      
      if (currentCount >= relayLimit) {
        console.log(`[CoreNostrService] 🚦 Relay ${relay.split('/').pop()} at capacity: ${currentCount}/${relayLimit}`);
        return false;
      }
    }
    
    // ✅ NEW: Ensure we have at least one non-paused relay
    const activeRelays = relays.filter(relay => this.getRelayLimit(relay) > 0);
    if (activeRelays.length === 0) {
      console.warn('[CoreNostrService] 🚫 All relays are paused, cannot create subscription');
      return false;
    }
    
    return true;
  }

  private incrementSubscriptionCount(relays: string[]): void {
    relays.forEach(relay => {
      const current = this.subscriptionCounts.get(relay) || 0;
      this.subscriptionCounts.set(relay, current + 1);
    });
  }

  private decrementSubscriptionCount(relays: string[]): void {
    relays.forEach(relay => {
      const current = this.subscriptionCounts.get(relay) || 0;
      this.subscriptionCounts.set(relay, Math.max(0, current - 1));
    });
  }

  private async processSubscriptionQueue(): Promise<void> {
    // Process queued subscriptions when capacity becomes available
    while (this.subscriptionQueue.length > 0) {
      const queuedRequest = this.subscriptionQueue[0];
      
      if (!this.canCreateSubscription(queuedRequest.relays)) {
        break; // Wait for capacity
      }
      
      // Remove from queue and process
      this.subscriptionQueue.shift();
      
      try {
        const subId = await this.createSubscriptionInternal(
          queuedRequest.relays,
          queuedRequest.filters,
          queuedRequest.onEvent
        );
        queuedRequest.resolve(subId);
      } catch (error) {
        console.error('[CoreNostrService] Error processing queued subscription:', error);
        queuedRequest.reject(error as Error);
      }
    }
  }

  public async publishEvent(event: Partial<NostrEvent>): Promise<string | null> {
    if (!this.publicKey) {
      throw new Error('User not logged in');
    }

    try {
      // Check if this is already a signed event
      if (event.id && event.sig) {
        console.log('[CoreNostrService] Event already signed, publishing directly');
        return this.publishSignedEvent(event as NostrEvent);
      }

      const fullEvent: NostrEvent = {
        kind: event.kind || 1,
        created_at: Math.floor(Date.now() / 1000),
        tags: event.tags || [],
        content: event.content || '',
        pubkey: this.publicKey,
        id: '',
        sig: ''
      };

      // Sign the event
      if (!window.nostr?.signEvent) {
        throw new Error('No signing method available - please install a Nostr extension');
      }

      const signedEvent = await window.nostr.signEvent(fullEvent);
      
      return this.publishSignedEvent(signedEvent);

    } catch (error) {
      console.error('[CoreNostrService] Publish failed:', error);
      
      // Provide more specific error messages
      if (error.message?.includes('User rejected')) {
        throw new Error('Event signing was cancelled by user');
      } else if (error.message?.includes('timeout')) {
        throw new Error('Publish timed out - please check your connection and try again');
      } else if (error.message?.includes('no active subscription')) {
        throw new Error('Relay connection issue - please refresh and try again');
      }
      
      throw error;
    }
  }

  public async publishSignedEvent(signedEvent: NostrEvent): Promise<string | null> {
    try {
      // Get connected relays
      let relays = this.getConnectedRelays();
      if (relays.length === 0) {
        // Try to connect to default relays if none are connected
        await this.connectToDefaultRelays();
        relays = this.getConnectedRelays(); // Get updated relays list
        if (relays.length === 0) {
          throw new Error('No relays available - please check your connection');
        }
      }

      // Publish to relays with proper Promise-based API
      const publishPromises = relays.map(async (relayUrl) => {
        try {
          console.log(`[CoreNostrService] Publishing to ${relayUrl}`);
          
          // pool.publish returns a Promise in nostr-tools v2.12.0
          const publishPromise = this.pool.publish([relayUrl], signedEvent);
          
          // Add timeout to each publish attempt
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('timeout')), 8000);
          });

          await Promise.race([publishPromise, timeoutPromise]);
          
          console.log(`[CoreNostrService] Successfully published to ${relayUrl}`);
          return { relay: relayUrl, success: true };

        } catch (error) {
          const errorMessage = error.message || error.toString();
          
          // ✅ ENHANCED: Handle paid relay restrictions gracefully
          if (errorMessage.includes('restricted') || 
              errorMessage.includes('not an active paid member') ||
              errorMessage.includes('pay') || 
              errorMessage.includes('membership required') ||
              errorMessage.includes('subscription required')) {
            console.warn(`[CoreNostrService] Skipping paid relay ${relayUrl}: ${errorMessage}`);
            return { relay: relayUrl, success: false, error: 'paid_relay_restriction', skipped: true };
          }
          
          console.warn(`[CoreNostrService] Failed to publish to ${relayUrl}:`, errorMessage);
          return { relay: relayUrl, success: false, error: errorMessage };
        }
      });

      // Wait for all publish attempts with a global timeout
      const publishResults = await Promise.race([
        Promise.all(publishPromises),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Global publish timeout')), 15000); // 15 second global timeout
        })
      ]);

      // Analyze results
      const successful = publishResults.filter(r => r.success);
      const failed = publishResults.filter(r => !r.success && !r.skipped);
      const skipped = publishResults.filter(r => r.skipped);

      console.log(`[CoreNostrService] Publish results: ${successful.length}/${relays.length} successful, ${skipped.length} paid relays skipped`);

      if (successful.length === 0) {
        // Check if all failures were due to paid relay restrictions
        if (skipped.length === relays.length) {
          // All relays were paid relays - this is not a critical error
          console.warn('[CoreNostrService] All connected relays require payment, but event was not published');
          // ✅ ENHANCED: Provide helpful guidance to users
          console.info('[CoreNostrService] 💡 Tip: Consider connecting to free relays like relay.damus.io, nos.lol, or relay.nostr.band for publishing');
          throw new Error('All connected relays require paid membership. Your event was not published. Please connect to free relays or upgrade your membership.');
        } else if (skipped.length > 0 && failed.length > 0) {
          // Mixed: some paid relays, some actual failures
          const errorTypes = [...new Set(failed.map(f => f.error))];
          throw new Error(`Failed to publish: ${errorTypes.join(', ')}. ${skipped.length} paid relays were skipped.`);
        } else {
          // All failures were actual errors
          const errorTypes = [...new Set(failed.map(f => f.error))];
          const errorMessage = errorTypes.includes('timeout') 
            ? 'All relays timed out - please check your connection and try again'
            : `Failed to publish to any relay: ${errorTypes.join(', ')}`;
          throw new Error(errorMessage);
        }
      }

      if (failed.length > 0 || skipped.length > 0) {
        const failedRelays = failed.map(f => `${f.relay}(${f.error})`).join(', ');
        const skippedRelays = skipped.map(s => s.relay).join(', ');
        let warningMessage = '';
        
        if (failed.length > 0 && skipped.length > 0) {
          warningMessage = `Some relays failed: ${failedRelays}. Paid relays skipped: ${skippedRelays}`;
        } else if (failed.length > 0) {
          warningMessage = `Some relays failed: ${failedRelays}`;
        } else {
          warningMessage = `Paid relays skipped: ${skippedRelays}`;
          // ✅ ENHANCED: Log helpful information for paid relay skips
          console.info(`[CoreNostrService] ℹ️ ${skipped.length} paid relays were skipped but event was successfully published to ${successful.length} free relays`);
        }
        
        console.warn(`[CoreNostrService] ${warningMessage}`);
      }

      return signedEvent.id;

    } catch (error) {
      console.error('[CoreNostrService] Failed to publish signed event:', error);
      throw error;
    }
  }

  // ✅ ENHANCED: Subscribe with subscription pooling, batching, and priority
  public subscribe(
    filters: NostrFilter[],
    onEvent: (event: NostrEvent) => void,
    relays?: string[],
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): string {
    const targetRelays = relays || this.getConnectedRelays();
    
    if (targetRelays.length === 0) {
      console.warn('[CoreNostrService] No relays available for subscription, attempting to connect to defaults');
      // Try to connect to default relays in the background
      this.connectToDefaultRelays().catch(error => {
        console.error('[CoreNostrService] Failed to connect to default relays for subscription:', error);
      });
      // Use fallback relays for immediate use
      const fallbackRelays = [
        "wss://relay.damus.io",
        "wss://nos.lol", 
        "wss://relay.snort.social",
        "wss://relay.nostr.band",
        "wss://offchain.pub",
        "wss://nostr.wine"
      ];
      return this.createSubscriptionWithBatching(fallbackRelays, filters, onEvent, priority);
    }

    return this.createSubscriptionWithBatching(targetRelays, filters, onEvent, priority);
  }

  // ✅ NEW: Batching-enabled subscription creation
  private createSubscriptionWithBatching(
    relays: string[],
    filters: NostrFilter[],
    onEvent: (event: NostrEvent) => void,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): string {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // ✅ Check for duplicate subscriptions
    const subscriptionHash = this.generateSubscriptionHash(filters, relays);
    const existingSubId = this.subscriptionDeduplication.get(subscriptionHash);
    if (existingSubId && this.activeSubscriptions.has(existingSubId)) {
      console.log(`[CoreNostrService] 📋 Reusing existing subscription ${existingSubId} for duplicate request`);
      return existingSubId;
    }

    // ✅ High priority subscriptions bypass batching
    if (priority === 'high') {
      if (this.canCreateSubscription(relays)) {
        // ✅ Create subscription synchronously for high priority
        this.createSubscriptionInternal(relays, filters, onEvent)
          .then(actualSubId => {
            this.activeSubscriptions.set(actualSubId, { relays, filters, onEvent });
            this.subscriptionDeduplication.set(subscriptionHash, actualSubId);
            this.incrementSubscriptionCount(relays);
            console.log(`[CoreNostrService] ⚡ Created high-priority subscription ${actualSubId} (${this.getSubscriptionStats()})`);
          })
          .catch(error => {
            console.error('[CoreNostrService] Failed to create high-priority subscription:', error);
          });
        
        return subscriptionId;
      } else {
        // Even high priority gets queued if no capacity
        console.log(`[CoreNostrService] ⚡ High-priority subscription queued - no capacity`);
        this.queueSubscriptionSynchronously(subscriptionId, relays, filters, onEvent);
        return subscriptionId;
      }
    }

    // ✅ Normal and low priority subscriptions use batching - but return ID immediately
    this.pendingBatchedSubscriptions.push({
      id: subscriptionId,
      filters,
      onEvent,
      relays,
      resolve: () => {}, // No-op since we return ID immediately
      reject: () => {}, // No-op since we return ID immediately  
      priority
    });
    
    // ✅ Sort by priority (high first, then normal, then low)
    this.pendingBatchedSubscriptions.sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    // ✅ Set up batching timeout if not already set
    if (!this.subscriptionBatchTimeout) {
      this.subscriptionBatchTimeout = setTimeout(() => {
        this.subscriptionBatchTimeout = null;
        this.processBatchedSubscriptions();
      }, this.BATCH_TIMEOUT);
    }
    
    console.log(`[CoreNostrService] 📦 Added ${priority} priority subscription to batch (${this.pendingBatchedSubscriptions.length} pending)`);
    
    // ✅ Return subscription ID immediately for API compatibility
    return subscriptionId;
  }

  // ✅ Helper method for synchronous subscription queueing
  private queueSubscriptionSynchronously(
    subscriptionId: string,
    relays: string[],
    filters: NostrFilter[],
    onEvent: (event: NostrEvent) => void
  ): void {
    this.subscriptionQueue.push({
      id: subscriptionId,
      filters,
      onEvent,
      relays,
      resolve: () => {}, // No-op since we return ID immediately
      reject: () => {} // No-op since we return ID immediately
    });
    
    // Try to process queue after a short delay
    setTimeout(() => this.processSubscriptionQueue(), 100);
  }

  // ✅ Internal subscription creation with rate limiting
  private async createSubscriptionInternal(
    relays: string[],
    filters: NostrFilter[],
    onEvent: (event: NostrEvent) => void
  ): Promise<string> {
    // ✅ Apply rate limiting to subscription creation
    return this.enforceRateLimit(async () => {
      try {
        console.log(`[CoreNostrService] 🚀 Creating rate-limited subscription for ${relays.length} relays`);
        
        const subscription = this.pool.subscribeManyEose(
          relays,
          filters,
          {
            onevent: (event: NostrEvent) => {
              try {
                // Validate event structure before processing
                if (!event || typeof event !== 'object') {
                  console.warn('[CoreNostrService] Received invalid event:', event);
                  return;
                }
                
                // Basic event validation
                if (!event.id || !event.pubkey || !event.created_at || !event.kind) {
                  console.warn('[CoreNostrService] Received incomplete event:', event);
                  return;
                }
                
                // Additional validation for event tags
                if (event.tags && !Array.isArray(event.tags)) {
                  console.warn('[CoreNostrService] Received event with invalid tags:', event);
                  return;
                }
                
                onEvent(event);
              } catch (error) {
                console.error('[CoreNostrService] Error processing event:', error, event);
                // Don't propagate event processing errors
              }
            },
            onclose: (reason) => {
              const subId = subscription.toString();
              console.log(`[CoreNostrService] 🔌 Subscription ${subId} closed:`, reason || 'normal close');
              
              // ✅ Clean up subscription tracking
              this.cleanupSubscription(subId, relays);
              
              // ✅ Process queue when subscription closes
              this.processSubscriptionQueue();
            },
            oneose: () => {
              console.log('[CoreNostrService] 📚 End of stored events received');
            }
          }
        );

        const subId = subscription.toString();
        console.log(`[CoreNostrService] ✅ Rate-limited subscription created: ${subId}`);
        
        // ✅ Record successful subscription for adaptive limits
        this.recordSubscriptionSuccess(relays);
        
        return subId;

      } catch (error) {
        console.error('[CoreNostrService] Failed to create subscription:', error);
        throw error;
      }
    });
  }

  // ✅ Enhanced cleanup with subscription tracking
  private cleanupSubscription(subId: string, relays: string[]): void {
    this.activeSubscriptions.delete(subId);
    this.decrementSubscriptionCount(relays);
    
    // Remove from deduplication map
    for (const [hash, id] of this.subscriptionDeduplication.entries()) {
      if (id === subId) {
        this.subscriptionDeduplication.delete(hash);
        break;
      }
    }
  }

  // ✅ Get subscription statistics for monitoring with adaptive limits
  private getSubscriptionStats(): string {
    const totalActive = this.activeSubscriptions.size;
    const totalQueued = this.subscriptionQueue.length;
    
    // ✅ Use adaptive relay stats instead of basic per-relay stats
    return `${totalActive} active, ${totalQueued} queued | Relays: ${this.getRelayStats()}`;
  }

  // ✅ ENHANCED: Unsubscribe with pool management and robust Promise handling
  public unsubscribe(subId: any): void {
    try {
      // ✅ Comprehensive Promise detection and handling
      if (subId && (
        typeof subId === 'object' && typeof subId.then === 'function' || // Standard Promise
        subId.constructor && subId.constructor.name === 'Promise' ||      // Promise constructor
        subId instanceof Promise ||                                        // instanceof check
        Object.prototype.toString.call(subId) === '[object Promise]'       // toString check
      )) {
        console.log('[CoreNostrService] 🔄 Resolving Promise subscription ID for unsubscribe');
        Promise.resolve(subId).then((resolvedSubId: any) => {
          if (resolvedSubId && typeof resolvedSubId === 'string') {
            this.unsubscribe(resolvedSubId);
          } else {
            console.log('[CoreNostrService] Promise resolved to invalid subscription ID:', resolvedSubId);
          }
        }).catch((error: any) => {
          console.warn('[CoreNostrService] Failed to resolve subscription ID for unsubscribe:', error);
        });
        return;
      }

      // ✅ Ensure we have a valid string ID with robust type checking
      if (!subId || typeof subId !== 'string' || subId.length === 0) {
        console.log(`[CoreNostrService] Skipping unsubscribe for invalid subscription ID:`, subId);
        return;
      }

      // ✅ Safe string operations with additional checks
      const isFailedSub = subId.includes && typeof subId.includes === 'function' && subId.includes('failed_sub_');
      const isCurrentFailedSub = subId === `failed_sub_${Date.now()}`;
      
      if (!isCurrentFailedSub && !isFailedSub) {
        console.log(`[CoreNostrService] 🔌 Unsubscribing: ${subId}`);
        
        // ✅ Get relay info for cleanup before unsubscribing
        const subscriptionInfo = this.activeSubscriptions.get(subId);
        if (subscriptionInfo) {
          this.cleanupSubscription(subId, subscriptionInfo.relays);
        }
        
        // Pool handles unsubscription automatically when subscription is closed
        // Trigger queue processing since we freed up capacity
        this.processSubscriptionQueue();
        
        console.log(`[CoreNostrService] 📊 Post-unsubscribe stats: ${this.getSubscriptionStats()}`);
      } else {
        console.log(`[CoreNostrService] Skipping unsubscribe for invalid/failed subscription: ${subId}`);
      }
    } catch (error) {
      console.warn(`[CoreNostrService] Error during unsubscribe for ${subId}:`, error);
    }
  }

  public async queryEvents(filters: NostrFilter[]): Promise<NostrEvent[]> {
    let relays = this.getConnectedRelays();
    
    if (relays.length === 0) {
      console.log('[CoreNostrService] No connected relays, attempting to connect to defaults');
      await this.connectToDefaultRelays();
      relays = this.getConnectedRelays();
      
      // If still no relays, use defaults directly
      if (relays.length === 0) {
        relays = [
          "wss://relay.damus.io",
          "wss://nos.lol", 
          "wss://relay.snort.social",
          "wss://relay.nostr.band",
          "wss://offchain.pub",
          "wss://nostr.wine"
        ];
        console.log('[CoreNostrService] Using default relays for query');
      }
    }

    const events: NostrEvent[] = [];
    
    return new Promise((resolve) => {
      let hasResolved = false;
      let subscription: any = null;

      const timeout = setTimeout(() => {
        if (!hasResolved) {
          hasResolved = true;
          if (subscription) {
            try {
              subscription.close();
            } catch (error) {
              console.warn('[CoreNostrService] Error closing subscription on timeout:', error);
            }
          }
          console.log(`[CoreNostrService] Query timeout, returning ${events.length} events`);
          resolve(events);
        }
      }, 8000); // Increased timeout

      try {
        subscription = this.pool.subscribeManyEose(
          relays,
          filters,
          {
            onevent: (event: NostrEvent) => {
              if (!hasResolved) {
                try {
                  // Validate event structure before processing
                  if (!event || typeof event !== 'object') {
                    console.warn('[CoreNostrService] Query received invalid event:', event);
                    return;
                  }
                  
                  // Basic event validation
                  if (!event.id || !event.pubkey || !event.created_at || typeof event.kind !== 'number') {
                    console.warn('[CoreNostrService] Query received incomplete event:', event);
                    return;
                  }
                  
                  // Additional validation for event tags
                  if (event.tags && !Array.isArray(event.tags)) {
                    console.warn('[CoreNostrService] Query received event with invalid tags:', event);
                    return;
                  }
                  
                  events.push(event);
                } catch (error) {
                  console.error('[CoreNostrService] Error processing query event:', error, event);
                  // Don't add malformed events to results
                }
              }
            },
            oneose: () => {
              if (!hasResolved) {
                hasResolved = true;
                clearTimeout(timeout);
                console.log(`[CoreNostrService] Query completed, returning ${events.length} events`);
                // Delay closing to avoid race conditions
                setTimeout(() => {
                  if (subscription) {
                    try {
                      subscription.close();
                    } catch (error) {
                      console.warn('[CoreNostrService] Error closing subscription after EOSE:', error);
                    }
                  }
                }, 100);
                resolve(events);
              }
            },
            onclose: (reason) => {
              if (!hasResolved) {
                hasResolved = true;
                clearTimeout(timeout);
                console.log(`[CoreNostrService] Query subscription closed: ${reason || 'normal'}, returning ${events.length} events`);
                resolve(events);
              }
            }
          }
        );
      } catch (error) {
        if (!hasResolved) {
          hasResolved = true;
          clearTimeout(timeout);
          console.error('[CoreNostrService] Failed to create query subscription:', error);
          resolve(events);
        }
      }
    });
  }

  // ===== UTILITY METHODS =====

  public async getEventById(id: string): Promise<NostrEvent | null> {
    const events = await this.queryEvents([{ ids: [id] }]);
    return events[0] || null;
  }

  public async getEvents(ids: string[]): Promise<NostrEvent[]> {
    return this.queryEvents([{ ids }]);
  }

  // ===== PROFILE METHODS =====

  public async getProfile(pubkey: string): Promise<any> {
    try {
      console.log(`[CoreNostrService] Fetching profile for pubkey: ${pubkey.slice(0, 8)}...`);
      
      // Query for profile metadata events (kind 0)
      const events = await this.queryEvents([{
        kinds: [0],
        authors: [pubkey],
        limit: 1
      }]);
      
      if (events.length === 0) {
        console.log(`[CoreNostrService] No profile found for pubkey: ${pubkey.slice(0, 8)}`);
        return null;
      }
      
      // Parse the metadata from the most recent event
      const event = events[0];
      try {
        const metadata = JSON.parse(event.content);
        console.log(`[CoreNostrService] Profile found for ${pubkey.slice(0, 8)}:`, Object.keys(metadata));
        return {
          ...metadata,
          pubkey,
          _meta: {
            event_id: event.id,
            created_at: event.created_at,
            cached_at: Date.now()
          }
        };
      } catch (parseError) {
        console.error(`[CoreNostrService] Failed to parse profile metadata for ${pubkey.slice(0, 8)}:`, parseError);
        return null;
      }
    } catch (error) {
      console.error(`[CoreNostrService] Error fetching profile for ${pubkey.slice(0, 8)}:`, error);
      return null;
    }
  }

  // ===== ARTICLE METHODS =====
  
  public async getArticlesByAuthor(authorPubkey: string): Promise<NostrEvent[]> {
    return this.queryEvents([
      {
        kinds: [30023], // Article kind
        authors: [authorPubkey],
        limit: 20
      }
    ]);
  }

  public async searchArticles(options: { limit?: number; since?: number } = {}): Promise<NostrEvent[]> {
    const { limit = 20, since } = options;
    const filter: any = {
      kinds: [30023], // Article kind
      limit
    };
    
    if (since) {
      filter.since = since;
    }

    return this.queryEvents([filter]);
  }

  // ===== CLEANUP =====

  // ✅ ENHANCED: Cleanup with subscription pool management
  public cleanup(): void {
    // ✅ Clear subscription queue and tracking
    this.subscriptionQueue.length = 0;
    this.activeSubscriptions.clear();
    this.subscriptionCounts.clear();
    this.subscriptionDeduplication.clear();
    
    // ✅ Clear batching structures
    this.pendingBatchedSubscriptions.length = 0;
    this.batchedSubscriptionHandlers.clear();
    
    // ✅ Clear rate limiting structures
    this.subscriptionRateLimitQueue.length = 0;
    this.isProcessingRateLimit = false;
    this.lastSubscriptionTime = 0;
    
    // ✅ Clear adaptive tracking structures
    this.relayLimits.clear();
    this.relayPerformance.clear();
    
    // ✅ NEW: Clear NOTICE tracking structures
    this.relayNoticeCount.clear();
    this.lastNoticeTime.clear();
    
    // ✅ Clear batching timeout
    if (this.subscriptionBatchTimeout) {
      clearTimeout(this.subscriptionBatchTimeout);
      this.subscriptionBatchTimeout = null;
    }
    
    // ✅ Close connection pool
    this.pool.close();
    this.connectedRelays.clear();
    
    // ✅ Reset connection state
    this.connectionPromise = null;
    this.connectionPromiseResolver = null;
    this.isConnecting = false;
    
    console.log('[CoreNostrService] 🧹 Service cleanup completed');
  }

  public async connectToUserRelays(): Promise<string[]> {
    const now = Date.now();
    
    // ✅ Check if we already have sufficient recent connections to prevent spam
    const connectedRelays = this.getConnectedRelays();
    if (connectedRelays.length > 0 && (now - this.lastConnectionCheck) < this.CONNECTION_RECHECK_INTERVAL) {
      console.log(`[CoreNostrService] Already connected to ${connectedRelays.length} relays (${Math.round((now - this.lastConnectionCheck) / 1000)}s ago), skipping connection attempt`);
      return connectedRelays;
    }
    
    // For now, use default relays. In future, fetch user's relay list from kind 10002 events
    return this.connectToDefaultRelays();
  }

  private async connectRelay(relayUrl: string, category: RelayCategory = 'both'): Promise<boolean> {
    if (this.relays.has(relayUrl)) {
      return true; // Already connected
    }

    return new Promise((resolve) => {
      try {
        console.log(`[CoreNostrService] Connecting to relay: ${relayUrl}`);
        
        const ws = new WebSocket(relayUrl);
        const timeoutId = setTimeout(() => {
          console.warn(`[CoreNostrService] Connection timeout for relay: ${relayUrl}`);
          ws.close();
          resolve(false);
        }, CONNECTION_CONFIG.CONNECTION_TIMEOUT);

        ws.onopen = () => {
          clearTimeout(timeoutId);
          console.log(`[CoreNostrService] Connected to relay: ${relayUrl}`);
          
          this.relays.set(relayUrl, {
            ws,
            url: relayUrl,
            connected: true,
            category,
            lastError: null,
            retryCount: 0,
            circuitBreakerOpen: false,
            lastSuccessfulConnect: Date.now()
          });
          
          resolve(true);
        };

        ws.onerror = (error) => {
          clearTimeout(timeoutId);
          console.warn(`[CoreNostrService] Error connecting to relay: ${relayUrl}`, error);
          resolve(false);
        };

        ws.onclose = (event) => {
          clearTimeout(timeoutId);
          console.warn(`[CoreNostrService] Connection closed for relay: ${relayUrl}`, event.code, event.reason);
          
          // ✅ GRACEFUL HANDLING: Don't log paid relay errors as errors
          if (event.reason?.includes('restricted') || event.reason?.includes('paid') || event.reason?.includes('membership')) {
            console.info(`[CoreNostrService] Skipping paid relay: ${relayUrl} (${event.reason})`);
          }
          
          this.relays.delete(relayUrl);
          resolve(false);
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleRelayMessage(relayUrl, message);
          } catch (error) {
            console.warn(`[CoreNostrService] Failed to parse message from ${relayUrl}:`, error);
          }
        };

      } catch (error) {
        console.warn(`[CoreNostrService] Failed to create WebSocket for ${relayUrl}:`, error);
        resolve(false);
      }
    });
  }

  // ✅ NEW: Subscription batching methods
  private batchFilters(filters: NostrFilter[]): string {
    // Create a key for batching similar filters
    const normalized = filters.map(filter => {
      const { kinds, authors, limit, ...rest } = filter;
      return {
        kinds: kinds?.sort(),
        authors: authors?.slice(0, 3), // Limit authors for batching
        limit: Math.min(limit || 20, 50), // Cap limit for batching
        ...Object.keys(rest).sort().reduce((acc, key) => {
          acc[key] = rest[key];
          return acc;
        }, {} as any)
      };
    }).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    
    return JSON.stringify(normalized);
  }

  private canBatchSubscriptions(filters1: NostrFilter[], filters2: NostrFilter[]): boolean {
    // Check if two filter sets can be batched together
    if (filters1.length !== filters2.length) return false;
    
    for (let i = 0; i < filters1.length; i++) {
      const f1 = filters1[i];
      const f2 = filters2[i];
      
      // Must have same kinds
      if (JSON.stringify(f1.kinds?.sort()) !== JSON.stringify(f2.kinds?.sort())) {
        return false;
      }
      
      // Must have similar structure (same filter keys)
      const keys1 = Object.keys(f1).sort();
      const keys2 = Object.keys(f2).sort();
      if (JSON.stringify(keys1) !== JSON.stringify(keys2)) {
        return false;
      }
    }
    
    return true;
  }

  private processBatchedSubscriptions(): void {
    if (this.pendingBatchedSubscriptions.length === 0) return;
    
    console.log(`[CoreNostrService] 📦 Processing ${this.pendingBatchedSubscriptions.length} batched subscriptions`);
    
    // Group by relay sets and filter compatibility
    const batchGroups = new Map<string, typeof this.pendingBatchedSubscriptions>();
    
    for (const subscription of this.pendingBatchedSubscriptions) {
      const relayKey = subscription.relays.sort().join(',');
      const batchKey = this.batchFilters(subscription.filters);
      const groupKey = `${relayKey}:${batchKey}`;
      
      if (!batchGroups.has(groupKey)) {
        batchGroups.set(groupKey, []);
      }
      batchGroups.get(groupKey)!.push(subscription);
    }
    
    // Process each batch group
    for (const [groupKey, subscriptions] of batchGroups.entries()) {
      this.processBatchGroup(groupKey, subscriptions);
    }
    
    // Clear pending subscriptions
    this.pendingBatchedSubscriptions.length = 0;
  }

  private processBatchGroup(groupKey: string, subscriptions: typeof this.pendingBatchedSubscriptions): void {
    if (subscriptions.length === 0) return;
    
    // Use the first subscription as the template
    const template = subscriptions[0];
    const relays = template.relays;
    
    // Combine filters intelligently
    const combinedFilters = this.combineFilters(subscriptions.map(s => s.filters));
    
    // Check if we can create this batched subscription
    if (!this.canCreateSubscription(relays)) {
      // Queue all subscriptions individually
      for (const subscription of subscriptions) {
        this.subscriptionQueue.push(subscription);
      }
      console.log(`[CoreNostrService] ⏳ Batched group queued (${subscriptions.length} subscriptions)`);
      return;
    }
    
    // Create a single subscription for the batch
    this.createBatchedSubscriptionInternal(groupKey, relays, combinedFilters, subscriptions);
  }

  private combineFilters(filterSets: NostrFilter[][]): NostrFilter[] {
    // Combine multiple filter sets into optimized filters
    const kindGroups = new Map<string, NostrFilter>();
    
    for (const filters of filterSets) {
      for (const filter of filters) {
        const kindKey = JSON.stringify(filter.kinds?.sort() || []);
        
        if (!kindGroups.has(kindKey)) {
          kindGroups.set(kindKey, { ...filter });
        } else {
          const existing = kindGroups.get(kindKey)!;
          
          // Combine authors
          if (filter.authors) {
            const existingAuthors = existing.authors || [];
            existing.authors = [...new Set([...existingAuthors, ...filter.authors])];
          }
          
          // Combine ids
          if (filter.ids) {
            const existingIds = existing.ids || [];
            existing.ids = [...new Set([...existingIds, ...filter.ids])];
          }
          
          // Use higher limit
          if (filter.limit) {
            existing.limit = Math.max(existing.limit || 20, filter.limit);
          }
          
          // Combine tag filters
          for (const [key, value] of Object.entries(filter)) {
            if (key.startsWith('#') && Array.isArray(value)) {
              const existingValue = existing[key] || [];
              existing[key] = [...new Set([...existingValue, ...value])];
            }
          }
        }
      }
    }
    
    return Array.from(kindGroups.values());
  }

  private async createBatchedSubscriptionInternal(
    groupKey: string,
    relays: string[],
    filters: NostrFilter[],
    subscriptions: typeof this.pendingBatchedSubscriptions
  ): Promise<void> {
    // ✅ Apply rate limiting to batched subscription creation
    return this.enforceRateLimit(async () => {
      try {
        console.log(`[CoreNostrService] 🚀 Creating rate-limited batched subscription for ${subscriptions.length} requests`);
        
        // Create master subscription
        const subscription = this.pool.subscribeManyEose(
          relays,
          filters,
          {
            onevent: (event: NostrEvent) => {
              try {
                // Validate event
                if (!event || typeof event !== 'object' || !event.id || !event.pubkey) {
                  return;
                }
                
                // Route event to all relevant handlers
                for (const sub of subscriptions) {
                  const eventMatches = this.eventMatchesFilters(event, sub.filters);
                  if (eventMatches) {
                    try {
                      sub.onEvent(event);
                    } catch (error) {
                      console.error('[CoreNostrService] Error in batched subscription handler:', error);
                    }
                  }
                }
              } catch (error) {
                console.error('[CoreNostrService] Error processing batched event:', error);
              }
            },
            onclose: (reason) => {
              const subId = subscription.toString();
              console.log(`[CoreNostrService] 📦 Batched subscription ${subId} closed:`, reason || 'normal close');
              
              // Clean up tracking
              this.cleanupSubscription(subId, relays);
              this.batchedSubscriptionHandlers.delete(groupKey);
              
              // Process queue
              this.processSubscriptionQueue();
            },
            oneose: () => {
              console.log('[CoreNostrService] 📦 Batched subscription EOSE');
            }
          }
        );

        const subId = subscription.toString();
        
        // Track the batched subscription
        this.activeSubscriptions.set(subId, { relays, filters, onEvent: () => {} });
        this.incrementSubscriptionCount(relays);
        
        // ✅ Track individual subscription IDs to the master subscription  
        for (const sub of subscriptions) {
          this.activeSubscriptions.set(sub.id, { relays, filters: sub.filters, onEvent: sub.onEvent, masterSubId: subId });
          const subscriptionHash = this.generateSubscriptionHash(sub.filters, relays);
          this.subscriptionDeduplication.set(subscriptionHash, sub.id);
        }
        
        console.log(`[CoreNostrService] ✅ Created rate-limited batched subscription ${subId} for ${subscriptions.length} requests on ${relays.length} relays (${this.getRelayStats()})`);
        
        // ✅ Record successful subscription for adaptive limits
        this.recordSubscriptionSuccess(relays);
        
      } catch (error) {
        console.error('[CoreNostrService] Failed to create batched subscription:', error);
        
        // ✅ For synchronous API, we can't reject promises, so we just log errors
        console.warn(`[CoreNostrService] ${subscriptions.length} subscriptions failed to batch`);
      }
    });
  }

  private eventMatchesFilters(event: NostrEvent, filters: NostrFilter[]): boolean {
    // Check if an event matches any of the given filters
    return filters.some(filter => {
      // Check kinds
      if (filter.kinds && !filter.kinds.includes(event.kind)) {
        return false;
      }
      
      // Check authors
      if (filter.authors && !filter.authors.includes(event.pubkey)) {
        return false;
      }
      
      // Check ids
      if (filter.ids && !filter.ids.includes(event.id)) {
        return false;
      }
      
      // Check tag filters
      for (const [key, values] of Object.entries(filter)) {
        if (key.startsWith('#') && Array.isArray(values)) {
          const tagType = key.slice(1);
          const eventTags = event.tags.filter(tag => tag[0] === tagType).map(tag => tag[1]);
          if (!values.some(value => eventTags.includes(value))) {
            return false;
          }
        }
      }
      
      return true;
    });
  }

  // ✅ NEW: Global rate limiting methods
  private async enforceRateLimit<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const executeOperation = () => {
        const now = Date.now();
        const timeSinceLastSub = now - this.lastSubscriptionTime;
        
        if (timeSinceLastSub < this.MIN_SUBSCRIPTION_INTERVAL) {
          const delay = this.MIN_SUBSCRIPTION_INTERVAL - timeSinceLastSub;
          console.log(`[CoreNostrService] ⏱️ Rate limiting: waiting ${delay}ms`);
          setTimeout(executeOperation, delay);
          return;
        }
        
        this.lastSubscriptionTime = now;
        
        operation()
          .then(resolve)
          .catch(reject);
      };
      
      // Add to rate limit queue
      this.subscriptionRateLimitQueue.push(executeOperation);
      this.processRateLimitQueue();
    });
  }

  private processRateLimitQueue(): void {
    if (this.isProcessingRateLimit || this.subscriptionRateLimitQueue.length === 0) {
      return;
    }
    
    this.isProcessingRateLimit = true;
    
    const executeNext = () => {
      if (this.subscriptionRateLimitQueue.length === 0) {
        this.isProcessingRateLimit = false;
        return;
      }
      
      const nextOperation = this.subscriptionRateLimitQueue.shift();
      if (nextOperation) {
        nextOperation();
        // Schedule next operation
        setTimeout(executeNext, this.MIN_SUBSCRIPTION_INTERVAL);
      } else {
        this.isProcessingRateLimit = false;
      }
    };
    
    executeNext();
  }

  // ✅ NEW: Adaptive relay limit management
  private getRelayLimit(relayUrl: string): number {
    if (!this.relayLimits.has(relayUrl)) {
      // Start with conservative baseline
      this.relayLimits.set(relayUrl, this.MAX_CONCURRENT_SUBSCRIPTIONS);
      this.initializeRelayPerformance(relayUrl);
    }
    return this.relayLimits.get(relayUrl)!;
  }

  private initializeRelayPerformance(relayUrl: string): void {
    this.relayPerformance.set(relayUrl, {
      successfulSubscriptions: 0,
      rejectedSubscriptions: 0,
      lastRejectionTime: 0,
      currentLimit: this.MAX_CONCURRENT_SUBSCRIPTIONS,
      lastLimitIncrease: 0,
      consecutiveSuccesses: 0
    });
  }

  private recordSubscriptionSuccess(relays: string[]): void {
    const now = Date.now();
    
    for (const relayUrl of relays) {
      const performance = this.relayPerformance.get(relayUrl);
      if (performance) {
        performance.successfulSubscriptions++;
        performance.consecutiveSuccesses++;
        
        // ✅ Try to increase limit if relay is performing well
        this.considerLimitIncrease(relayUrl, performance, now);
      }
    }
  }

  private recordSubscriptionRejection(relayUrl: string, reason: string): void {
    const now = Date.now();
    const performance = this.relayPerformance.get(relayUrl);
    
    if (performance) {
      performance.rejectedSubscriptions++;
      performance.lastRejectionTime = now;
      performance.consecutiveSuccesses = 0; // Reset success streak
      
      // ✅ Decrease limit if relay is rejecting requests
      this.handleRelayRejection(relayUrl, performance, reason);
    }
    
    console.warn(`[CoreNostrService] 🚫 Relay ${relayUrl.split('/').pop()} rejected subscription: ${reason}`);
  }

  private considerLimitIncrease(relayUrl: string, performance: any, now: number): void {
    const currentLimit = this.relayLimits.get(relayUrl) || this.MAX_CONCURRENT_SUBSCRIPTIONS;
    
    // Don't increase if we're already at max or recently had rejections
    if (currentLimit >= this.ADAPTIVE_MAX_LIMIT || 
        (now - performance.lastRejectionTime) < this.REJECTION_PENALTY_TIME) {
      return;
    }
    
    // Don't increase too frequently
    if ((now - performance.lastLimitIncrease) < this.PERFORMANCE_WINDOW / 2) {
      return;
    }
    
    // Increase limit if we have enough consecutive successes
    if (performance.consecutiveSuccesses >= this.SUCCESS_THRESHOLD) {
      const newLimit = Math.min(currentLimit + 1, this.ADAPTIVE_MAX_LIMIT);
      this.relayLimits.set(relayUrl, newLimit);
      performance.currentLimit = newLimit;
      performance.lastLimitIncrease = now;
      performance.consecutiveSuccesses = 0; // Reset counter
      
      console.log(`[CoreNostrService] 📈 Increased limit for ${relayUrl.split('/').pop()}: ${currentLimit} → ${newLimit} (${performance.successfulSubscriptions} successful)`);
    }
  }

  private handleRelayRejection(relayUrl: string, performance: any, reason: string): void {
    const currentLimit = this.relayLimits.get(relayUrl) || this.MAX_CONCURRENT_SUBSCRIPTIONS;
    
    // Decrease limit if we get "too many concurrent REQs" error
    if (reason.toLowerCase().includes('concurrent') || reason.toLowerCase().includes('req')) {
      const newLimit = Math.max(1, currentLimit - 1); // Never go below 1
      this.relayLimits.set(relayUrl, newLimit);
      performance.currentLimit = newLimit;
      
      console.log(`[CoreNostrService] 📉 Decreased limit for ${relayUrl.split('/').pop()}: ${currentLimit} → ${newLimit} due to: ${reason}`);
    }
  }

  private getRelayStats(): string {
    const stats = Array.from(this.relayLimits.entries())
      .map(([relay, limit]) => {
        const count = this.subscriptionCounts.get(relay) || 0;
        const performance = this.relayPerformance.get(relay);
        const success = performance?.consecutiveSuccesses || 0;
        return `${relay.split('/').pop()}:${count}/${limit}(+${success})`;
      })
      .join(', ');
    
    return stats;
  }

  // ✅ NEW: Get detailed relay status for UI components
  public getDetailedRelayStatus(): Array<{
    url: string;
    connected: boolean;
    currentLimit: number;
    activeSubscriptions: number;
    maxLimit: number;
    performance: {
      successfulSubscriptions: number;
      rejectedSubscriptions: number;
      consecutiveSuccesses: number;
      lastRejectionTime: number;
    };
    notices: {
      count: number;
      lastNoticeTime: number;
    };
    status: 'healthy' | 'degraded' | 'paused' | 'recovering';
  }> {
    const connectedRelays = Array.from(this.connectedRelays);
    const trackedRelays = Array.from(this.relayLimits.keys());
    
    // ✅ FIXED: Use already imported DEFAULT_RELAYS instead of require()
    const allRelays = new Set([...DEFAULT_RELAYS, ...connectedRelays, ...trackedRelays]);
    
    return Array.from(allRelays).map(url => {
      const connected = this.connectedRelays.has(url);
      const currentLimit = this.getRelayLimit(url);
      const activeSubscriptions = this.subscriptionCounts.get(url) || 0;
      const performance = this.relayPerformance.get(url) || {
        successfulSubscriptions: 0,
        rejectedSubscriptions: 0,
        consecutiveSuccesses: 0,
        lastRejectionTime: 0
      };
      const noticeCount = this.relayNoticeCount.get(url) || 0;
      const lastNoticeTime = this.lastNoticeTime.get(url) || 0;
      
      // Determine status
      let status: 'healthy' | 'degraded' | 'paused' | 'recovering' = 'healthy';
      const now = Date.now();
      
      if (!connected) {
        // ✅ NEW: Show disconnected relays with appropriate status
        status = 'recovering'; // Use 'recovering' for disconnected state
      } else if (currentLimit === 0) {
        status = 'paused';
      } else if (noticeCount > 0 && (now - lastNoticeTime) < this.NOTICE_RESET_TIME) {
        status = 'degraded';
      } else if (performance.rejectedSubscriptions > 0 && (now - performance.lastRejectionTime) < this.REJECTION_PENALTY_TIME) {
        status = 'recovering';
      }
      
      return {
        url,
        connected,
        currentLimit,
        activeSubscriptions,
        maxLimit: this.ADAPTIVE_MAX_LIMIT,
        performance,
        notices: {
          count: noticeCount,
          lastNoticeTime
        },
        status
      };
    }).sort((a, b) => {
      // ✅ NEW: Sort connected relays first, then by status, then alphabetically
      if (a.connected !== b.connected) return b.connected ? 1 : -1;
      if (a.status !== b.status) {
        const statusOrder = { healthy: 0, degraded: 1, recovering: 2, paused: 3 };
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return a.url.localeCompare(b.url);
    });
  }

  // ✅ NEW: Handle specific relay rejection with URL identification
  private handleSpecificRelayRejection(relayUrl: string, message: string): void {
    const now = Date.now();
    
    // Track notice count for this relay
    const currentNotices = this.relayNoticeCount.get(relayUrl) || 0;
    const lastNotice = this.lastNoticeTime.get(relayUrl) || 0;
    
    // Reset notice count if enough time has passed
    if (now - lastNotice > this.NOTICE_RESET_TIME) {
      this.relayNoticeCount.set(relayUrl, 1);
    } else {
      this.relayNoticeCount.set(relayUrl, currentNotices + 1);
    }
    
    this.lastNoticeTime.set(relayUrl, now);
    
    // Immediately decrease limit for this relay
    const currentLimit = this.getRelayLimit(relayUrl);
    const newLimit = Math.max(1, currentLimit - 1); // Never go below 1
    this.relayLimits.set(relayUrl, newLimit);
    
    // Update performance tracking
    this.recordSubscriptionRejection(relayUrl, message);
    
    console.warn(`[CoreNostrService] 🚫 ${relayUrl.split('/').pop()}: Limit decreased ${currentLimit} → ${newLimit} (notice #${this.relayNoticeCount.get(relayUrl)})`);
    
    // If too many notices, temporarily pause this relay
    if (this.relayNoticeCount.get(relayUrl)! >= this.MAX_NOTICES_BEFORE_LIMIT_DECREASE * 2) {
      console.warn(`[CoreNostrService] 🛑 ${relayUrl.split('/').pop()}: Too many rejections, pausing for 5 minutes`);
      // Set limit to 0 temporarily
      this.relayLimits.set(relayUrl, 0);
      // Reset after 5 minutes
      setTimeout(() => {
        this.relayLimits.set(relayUrl, 1);
        this.relayNoticeCount.set(relayUrl, 0);
        console.log(`[CoreNostrService] 🔄 ${relayUrl.split('/').pop()}: Resuming with limit 1`);
      }, 300000); // 5 minutes
    }
  }

  // ✅ NEW: Handle generic relay rejection (when we can't identify specific relay)
  private handleGenericRelayRejection(message: string): void {
    console.warn('[CoreNostrService] 🚫 Generic relay rejection detected, reducing all relay limits by 1');
    
    // Reduce all active relay limits by 1
    for (const [relayUrl, currentLimit] of this.relayLimits.entries()) {
      if (currentLimit > 1) {
        const newLimit = currentLimit - 1;
        this.relayLimits.set(relayUrl, newLimit);
        console.log(`[CoreNostrService] 📉 ${relayUrl.split('/').pop()}: ${currentLimit} → ${newLimit} (generic rejection)`);
      }
    }
  }
}

// Export singleton instance
export const coreNostrService = new CoreNostrService(); 
