
import { NostrService } from './service';
import { ProfileAdapter } from './adapters/profile-adapter';
import { RelayAdapter } from './adapters/relay-adapter';
import { EventAdapter } from './adapters/event-adapter';
import { ContentAdapter } from './adapters/content-adapter';
import { SocialAdapter } from './adapters/social-adapter';
import { BookmarkAdapter } from './adapters/bookmark-adapter';
import { SocialInteractionAdapter } from './adapters/social-interaction-adapter';

/**
 * Adapter for Nostr service that provides simplified API
 * with type safety and consistent error handling
 */
export class NostrAdapter {
  private service: NostrService;
  private _profileAdapter: ProfileAdapter;
  private _relayAdapter: RelayAdapter;
  private _eventAdapter: EventAdapter;
  private _contentAdapter: ContentAdapter;
  private _socialAdapter: SocialAdapter;
  private _bookmarkAdapter: BookmarkAdapter;
  private _socialInteractionAdapter: SocialInteractionAdapter;
  
  constructor(service: NostrService) {
    this.service = service;
    this._profileAdapter = new ProfileAdapter(service);
    this._relayAdapter = new RelayAdapter(service);
    this._eventAdapter = new EventAdapter(service);
    this._contentAdapter = new ContentAdapter(service);
    this._socialAdapter = new SocialAdapter(service);
    this._bookmarkAdapter = new BookmarkAdapter(service);
    this._socialInteractionAdapter = new SocialInteractionAdapter(service);
  }
  
  /**
   * Profile operations (getProfile, updateProfile, etc.)
   */
  get profile() {
    return this._profileAdapter;
  }
  
  /**
   * Relay operations (connect, disconnect, etc.)
   */
  get relay() {
    return this._relayAdapter;
  }
  
  /**
   * Event operations (publish, subscribe, etc.)
   */
  get event() {
    return this._eventAdapter;
  }
  
  /**
   * Content operations (feed, search, etc.)
   */
  get content() {
    return this._contentAdapter;
  }
  
  /**
   * Social operations (follow, unfollow, etc.)
   */
  get social() {
    return this._socialAdapter;
  }
  
  /**
   * Bookmark operations (add, remove, etc.)
   */
  get bookmark() {
    return this._bookmarkAdapter;
  }
  
  /**
   * Social interaction operations (interests, muting, blocking)
   */
  get socialInteraction() {
    return this._socialInteractionAdapter;
  }
}

// Create an instance with the service
import { nostrService } from './service';
export const adaptedNostrService = new NostrAdapter(nostrService);
