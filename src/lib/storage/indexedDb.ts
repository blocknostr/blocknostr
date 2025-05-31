import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface NostrDB extends DBSchema {
  profiles: {
    key: string;
    value: {
      pubkey: string;
      profile: any;
      updated: number;
    };
  };
  events: {
    key: string;
    value: {
      id: string;
      event: any;
      created: number;
    };
  };
}

const dbName = 'NostrCache';
const dbVersion = 2;

let dbInstance: IDBPDatabase<NostrDB> | null = null;

export const initDB = async (): Promise<IDBPDatabase<NostrDB>> => {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<NostrDB>(dbName, dbVersion, {
    upgrade(db, oldVersion, newVersion) {
      // Create profiles store if it doesn't exist
      if (!db.objectStoreNames.contains('profiles')) {
        db.createObjectStore('profiles', { keyPath: 'pubkey' });
      }

      // Create events store if it doesn't exist
      if (!db.objectStoreNames.contains('events')) {
        db.createObjectStore('events', { keyPath: 'id' });
      }
    },
  });

  return dbInstance;
};

/**
 * IndexedDB storage manager for offline cache
 */

// Helper to open database connection
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BlockNosterDB', 1);
    
    request.onerror = () => reject(new Error("Failed to open IndexedDB"));
    
    request.onupgradeneeded = (event) => {
      const db = request.result;
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains('bookmarks')) {
        db.createObjectStore('bookmarks', { keyPath: 'eventId' });
      }
      
      if (!db.objectStoreNames.contains('pendingOperations')) {
        const pendingStore = db.createObjectStore('pendingOperations', {
          keyPath: 'id', 
          autoIncrement: true 
        });
        pendingStore.createIndex('status', 'status', { unique: false });
      }
    };
    
    request.onsuccess = () => resolve(request.result);
  });
}

// Generic get method
export async function getFromStore<T>(storeName: string, key: string): Promise<T | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      
      request.onerror = () => reject(new Error(`Failed to get ${key} from ${storeName}`));
      request.onsuccess = () => resolve(request.result || null);
    });
  } catch (error) {
    console.error(`IndexedDB error getting ${key} from ${storeName}:`, error);
    return null;
  }
}

// Generic put method
export async function putInStore(storeName: string, value: any): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value);
      
      request.onerror = () => reject(new Error(`Failed to store in ${storeName}`));
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error(`IndexedDB error putting in ${storeName}:`, error);
  }
}

// Generic delete method
export async function deleteFromStore(storeName: string, key: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      
      request.onerror = () => reject(new Error(`Failed to delete ${key} from ${storeName}`));
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error(`IndexedDB error deleting ${key} from ${storeName}:`, error);
  }
}

// Get all items from a store
export async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onerror = () => reject(new Error(`Failed to get all from ${storeName}`));
      request.onsuccess = () => resolve(request.result || []);
    });
  } catch (error) {
    console.error(`IndexedDB error getting all from ${storeName}:`, error);
    return [];
  }
}

// Get records by index value
export async function getByIndex<T>(
  storeName: string,
  indexName: string,
  value: any
): Promise<T[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);
      
      request.onerror = () => reject(new Error(`Failed to query ${indexName} in ${storeName}`));
      request.onsuccess = () => resolve(request.result || []);
    });
  } catch (error) {
    console.error(`IndexedDB error querying ${indexName} in ${storeName}:`, error);
    return [];
  }
}

// Clear a store
export async function clearStore(storeName: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onerror = () => reject(new Error(`Failed to clear ${storeName}`));
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error(`IndexedDB error clearing ${storeName}:`, error);
  }
}

