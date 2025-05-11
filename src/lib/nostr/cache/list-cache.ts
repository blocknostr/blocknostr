
import { CacheConfig } from "./types";
import { STORAGE_KEYS } from "./config";

/**
 * Cache service for lists like mute and block lists
 */
export class ListCache {
  private _list: string[] | null = null;
  private storageKey: string;
  
  constructor(storageKey: string) {
    this.storageKey = storageKey;
  }
  
  /**
   * Cache a list of items
   */
  cacheList(items: string[]): void {
    this._list = items;
    // Store in local storage for persistence
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }
  
  /**
   * Get the cached list
   */
  getList(): string[] | null {
    // If we have it in memory, return it
    if (this._list) {
      return this._list;
    }

    // Try to load from local storage
    const storedList = localStorage.getItem(this.storageKey);
    if (storedList) {
      try {
        const parsedList = JSON.parse(storedList);
        this._list = parsedList;
        return parsedList;
      } catch (e) {
        console.error(`Error parsing ${this.storageKey} from storage:`, e);
      }
    }

    return null;
  }
  
  /**
   * Clear the cached list
   */
  clear(): void {
    this._list = null;
    localStorage.removeItem(this.storageKey);
  }
}
