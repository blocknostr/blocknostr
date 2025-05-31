import { createSlice, createAsyncThunk, createEntityAdapter, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';

// NIP-51: Lists
// https://github.com/nostr-protocol/nips/blob/master/51.md

// User list interfaces following NIP-51
export interface UserList {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  image?: string;
  // List metadata
  owner: string; // pubkey of list owner
  listType: 'curated' | 'mute' | 'pin' | 'bookmark' | 'block' | 'custom';
  kind: number; // Nostr event kind
  isPrivate: boolean;
  encrypted: boolean;
  // Content
  items: UserListItem[];
  totalItems: number;
  // Temporal data
  createdAt: number;
  updatedAt: number;
  lastSynced: number;
  // Sharing and collaboration
  collaborators: string[]; // pubkeys with edit access
  viewers: string[]; // pubkeys with view access
  shareUrl?: string;
  isShared: boolean;
  // Categorization
  tags: string[];
  category?: string;
  // Engagement
  subscribers: number;
  likes: number;
  shares: number;
  // Status
  status: 'active' | 'archived' | 'deleted' | 'syncing';
  syncErrors: string[];
}

export interface UserListItem {
  id: string;
  type: 'pubkey' | 'event' | 'note' | 'hashtag' | 'url' | 'custom';
  value: string; // The actual content (pubkey, event ID, etc.)
  displayName?: string;
  description?: string;
  metadata?: Record<string, any>;
  // Organization
  position: number;
  section?: string; // Optional section within the list
  // Temporal data
  addedAt: number;
  addedBy: string; // pubkey who added this item
  // Item-specific data
  itemData?: {
    avatar?: string;
    verified?: boolean;
    lastActivity?: number;
    followerCount?: number;
    // For events/notes
    content?: string;
    author?: string;
    createdAt?: number;
    // For hashtags
    usage?: number;
    trending?: boolean;
  };
}

export interface ListTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  listType: UserList['listType'];
  suggestedItems: Array<{
    type: UserListItem['type'];
    value: string;
    displayName?: string;
    description?: string;
  }>;
  tags: string[];
  createdBy: string;
  usageCount: number;
  isOfficial: boolean;
}

export interface ListSubscription {
  listId: string;
  subscriberPubkey: string;
  subscriptionType: 'updates' | 'additions' | 'all';
  notificationsEnabled: boolean;
  autoSync: boolean;
  lastSyncedAt: number;
  subscribedAt: number;
}

export interface UserListsState {
  // List entities
  lists: Record<string, UserList>;
  listIds: string[];
  // User's lists by type
  myLists: {
    curated: string[];
    mute: string[];
    pin: string[];
    bookmark: string[];
    block: string[];
    custom: string[];
  };
  // Subscribed lists
  subscribedLists: Record<string, ListSubscription>;
  // Templates
  listTemplates: Record<string, ListTemplate>;
  // Loading states
  loading: boolean;
  creatingList: boolean;
  updatingList: Record<string, boolean>; // listId -> loading state
  deletingList: Record<string, boolean>;
  syncingLists: boolean;
  error: string | null;
  // Current active list
  activeListId: string | null;
  // Search and filtering
  searchTerm: string;
  filteredListIds: string[];
  selectedCategory: string | null;
  selectedListType: UserList['listType'] | null;
  // Bulk operations
  selectedItems: string[]; // item IDs for bulk operations
  bulkOperationInProgress: boolean;
  // Import/Export
  importInProgress: boolean;
  exportInProgress: boolean;
  // Sharing
  shareDialogOpen: boolean;
  shareableLink: string | null;
  // Analytics
  listAnalytics: {
    totalLists: number;
    listsByType: Record<UserList['listType'], number>;
    totalItems: number;
    mostPopularLists: Array<{
      listId: string;
      title: string;
      subscribers: number;
      likes: number;
    }>;
    recentActivity: Array<{
      type: 'created' | 'updated' | 'shared' | 'subscribed';
      listId: string;
      timestamp: number;
      actor: string;
    }>;
  };
  analyticsLoading: boolean;
  analyticsLastUpdated: number;
}

// Entity adapter for normalized list storage
const listsAdapter = createEntityAdapter<UserList>({
  selectId: (list) => list.id,
  sortComparer: (a, b) => {
    // Sort by last updated, then by creation time
    if (a.updatedAt !== b.updatedAt) {
      return b.updatedAt - a.updatedAt;
    }
    return b.createdAt - a.createdAt;
  },
});

// Initial state
const initialState: UserListsState = listsAdapter.getInitialState({
  myLists: {
    curated: [],
    mute: [],
    pin: [],
    bookmark: [],
    block: [],
    custom: [],
  },
  subscribedLists: {},
  listTemplates: {},
  loading: false,
  creatingList: false,
  updatingList: {},
  deletingList: {},
  syncingLists: false,
  error: null,
  activeListId: null,
  searchTerm: '',
  filteredListIds: [],
  selectedCategory: null,
  selectedListType: null,
  selectedItems: [],
  bulkOperationInProgress: false,
  importInProgress: false,
  exportInProgress: false,
  shareDialogOpen: false,
  shareableLink: null,
  listAnalytics: {
    totalLists: 0,
    listsByType: {
      curated: 0,
      mute: 0,
      pin: 0,
      bookmark: 0,
      block: 0,
      custom: 0,
    },
    totalItems: 0,
    mostPopularLists: [],
    recentActivity: [],
  },
  analyticsLoading: false,
  analyticsLastUpdated: 0,
});

// Async thunks for NIP-51 operations
export const createUserList = createAsyncThunk(
  'userLists/createList',
  async (params: {
    title: string;
    description?: string;
    listType: UserList['listType'];
    isPrivate?: boolean;
    encrypted?: boolean;
    tags?: string[];
    category?: string;
    items?: UserListItem[];
    userPubkey: string;
    relays: string[];
  }, { rejectWithValue }) => {
    try {
      const {
        title,
        description,
        listType,
        isPrivate = false,
        encrypted = false,
        tags = [],
        category,
        items = [],
        userPubkey,
        relays,
      } = params;

      // Determine event kind based on list type (NIP-51)
      let kind: number;
      switch (listType) {
        case 'mute':
          kind = 10000; // Mute list
          break;
        case 'pin':
          kind = 10001; // Pin list
          break;
        case 'bookmark':
          kind = 10003; // Bookmark list
          break;
        case 'curated':
          kind = 30001; // Curated list (parameterized replaceable)
          break;
        case 'block':
          kind = 10007; // Block list (hypothetical)
          break;
        default:
          kind = 30001; // Default to curated list
      }

      // Create NIP-51 compliant list event
      const dTag = `list_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const eventTags: string[][] = [
        ['d', dTag], // Identifier for parameterized replaceable events
        ['title', title],
        ...tags.map(tag => ['t', tag]),
      ];

      if (description) {
        eventTags.push(['description', description]);
      }

      if (category) {
        eventTags.push(['category', category]);
      }

      // Add items to event tags
      items.forEach(item => {
        switch (item.type) {
          case 'pubkey':
            eventTags.push(['p', item.value, item.displayName || '']);
            break;
          case 'event':
          case 'note':
            eventTags.push(['e', item.value, item.displayName || '']);
            break;
          case 'hashtag':
            eventTags.push(['t', item.value]);
            break;
          case 'url':
            eventTags.push(['r', item.value, item.displayName || '']);
            break;
        }
      });

      const listEvent = {
        kind,
        created_at: Math.floor(Date.now() / 1000),
        content: description || '',
        tags: eventTags,
        pubkey: userPubkey,
      };

      // Sign and publish the event
      const signedEvent = await signNostrEvent(listEvent);
      await publishToRelays(signedEvent, relays);

      const userList: UserList = {
        id: dTag,
        eventId: signedEvent.id,
        title,
        description,
        owner: userPubkey,
        listType,
        kind,
        isPrivate,
        encrypted,
        items: items.map((item, index) => ({
          ...item,
          id: `${dTag}_item_${index}`,
          position: index,
          addedAt: Date.now(),
          addedBy: userPubkey,
        })),
        totalItems: items.length,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastSynced: Date.now(),
        collaborators: [],
        viewers: [],
        isShared: !isPrivate,
        tags,
        category,
        subscribers: 0,
        likes: 0,
        shares: 0,
        status: 'active',
        syncErrors: [],
      };

      return userList;
    } catch (error) {
      console.error('Error creating user list:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create list');
    }
  }
);

export const fetchUserLists = createAsyncThunk(
  'userLists/fetchLists',
  async (params: { pubkey: string; relays?: string[] }, { rejectWithValue }) => {
    try {
      const { pubkey, relays = [] } = params;

      // Fetch different types of lists (NIP-51 kinds)
      const listKinds = [10000, 10001, 10003, 30001];
      const allLists: UserList[] = [];

      for (const kind of listKinds) {
        const events = await fetchNostrEvents({
          kinds: [kind],
          authors: [pubkey],
          limit: 100,
        }, relays);

        for (const event of events) {
          const list = parseListEvent(event);
          if (list) {
            allLists.push(list);
          }
        }
      }

      return { lists: allLists, pubkey };
    } catch (error) {
      console.error('Error fetching user lists:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch lists');
    }
  }
);

export const addItemToList = createAsyncThunk(
  'userLists/addItem',
  async (params: {
    listId: string;
    item: Omit<UserListItem, 'id' | 'position' | 'addedAt' | 'addedBy'>;
    userPubkey: string;
    relays: string[];
  }, { getState, rejectWithValue }) => {
    try {
      const { listId, item, userPubkey, relays } = params;
      const state = getState() as RootState;
      const list = state.userLists.entities[listId];

      if (!list) {
        throw new Error('List not found');
      }

      // Create updated list with new item
      const newItem: UserListItem = {
        ...item,
        id: `${listId}_item_${Date.now()}`,
        position: list.items.length,
        addedAt: Date.now(),
        addedBy: userPubkey,
      };

      const updatedItems = [...list.items, newItem];

      // Update the list event
      const updatedList = await updateListEvent(list, { items: updatedItems }, userPubkey, relays);

      return { listId, item: newItem, updatedList };
    } catch (error) {
      console.error('Error adding item to list:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to add item');
    }
  }
);

export const removeItemFromList = createAsyncThunk(
  'userLists/removeItem',
  async (params: {
    listId: string;
    itemId: string;
    userPubkey: string;
    relays: string[];
  }, { getState, rejectWithValue }) => {
    try {
      const { listId, itemId, userPubkey, relays } = params;
      const state = getState() as RootState;
      const list = state.userLists.entities[listId];

      if (!list) {
        throw new Error('List not found');
      }

      // Remove item and reorder positions
      const updatedItems = list.items
        .filter(item => item.id !== itemId)
        .map((item, index) => ({ ...item, position: index }));

      // Update the list event
      const updatedList = await updateListEvent(list, { items: updatedItems }, userPubkey, relays);

      return { listId, itemId, updatedList };
    } catch (error) {
      console.error('Error removing item from list:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to remove item');
    }
  }
);

export const updateListMetadata = createAsyncThunk(
  'userLists/updateMetadata',
  async (params: {
    listId: string;
    updates: {
      title?: string;
      description?: string;
      tags?: string[];
      category?: string;
      isPrivate?: boolean;
    };
    userPubkey: string;
    relays: string[];
  }, { getState, rejectWithValue }) => {
    try {
      const { listId, updates, userPubkey, relays } = params;
      const state = getState() as RootState;
      const list = state.userLists.entities[listId];

      if (!list) {
        throw new Error('List not found');
      }

      // Update the list event
      const updatedList = await updateListEvent(list, updates, userPubkey, relays);

      return { listId, updates, updatedList };
    } catch (error) {
      console.error('Error updating list metadata:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update list');
    }
  }
);

export const deleteUserList = createAsyncThunk(
  'userLists/deleteList',
  async (params: {
    listId: string;
    userPubkey: string;
    relays: string[];
  }, { getState, rejectWithValue }) => {
    try {
      const { listId, userPubkey, relays } = params;
      const state = getState() as RootState;
      const list = state.userLists.entities[listId];

      if (!list) {
        throw new Error('List not found');
      }

      // Create deletion event (kind:5)
      const deletionEvent = {
        kind: 5,
        created_at: Math.floor(Date.now() / 1000),
        content: 'List deleted',
        tags: [
          ['e', list.eventId],
          ['k', list.kind.toString()],
        ],
        pubkey: userPubkey,
      };

      // Sign and publish
      const signedEvent = await signNostrEvent(deletionEvent);
      await publishToRelays(signedEvent, relays);

      return { listId, deletionEventId: signedEvent.id };
    } catch (error) {
      console.error('Error deleting list:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete list');
    }
  }
);

// Helper functions
function parseListEvent(event: any): UserList | null {
  try {
    const dTag = event.tags.find((tag: string[]) => tag[0] === 'd');
    const titleTag = event.tags.find((tag: string[]) => tag[0] === 'title');
    const descTag = event.tags.find((tag: string[]) => tag[0] === 'description');
    const categoryTag = event.tags.find((tag: string[]) => tag[0] === 'category');
    
    if (!dTag || !titleTag) return null;

    // Determine list type from kind
    let listType: UserList['listType'];
    switch (event.kind) {
      case 10000:
        listType = 'mute';
        break;
      case 10001:
        listType = 'pin';
        break;
      case 10003:
        listType = 'bookmark';
        break;
      case 30001:
        listType = 'curated';
        break;
      default:
        listType = 'custom';
    }

    // Parse items from tags
    const items: UserListItem[] = [];
    let itemIndex = 0;

    event.tags.forEach((tag: string[]) => {
      let item: UserListItem | null = null;

      if (tag[0] === 'p') {
        item = {
          id: `${dTag[1]}_item_${itemIndex++}`,
          type: 'pubkey',
          value: tag[1],
          displayName: tag[2] || undefined,
          position: itemIndex - 1,
          addedAt: event.created_at * 1000,
          addedBy: event.pubkey,
        };
      } else if (tag[0] === 'e') {
        item = {
          id: `${dTag[1]}_item_${itemIndex++}`,
          type: 'event',
          value: tag[1],
          displayName: tag[2] || undefined,
          position: itemIndex - 1,
          addedAt: event.created_at * 1000,
          addedBy: event.pubkey,
        };
      } else if (tag[0] === 't' && tag.length > 1) {
        item = {
          id: `${dTag[1]}_item_${itemIndex++}`,
          type: 'hashtag',
          value: tag[1],
          position: itemIndex - 1,
          addedAt: event.created_at * 1000,
          addedBy: event.pubkey,
        };
      } else if (tag[0] === 'r') {
        item = {
          id: `${dTag[1]}_item_${itemIndex++}`,
          type: 'url',
          value: tag[1],
          displayName: tag[2] || undefined,
          position: itemIndex - 1,
          addedAt: event.created_at * 1000,
          addedBy: event.pubkey,
        };
      }

      if (item) {
        items.push(item);
      }
    });

    // Extract tags
    const tags = event.tags
      .filter((tag: string[]) => tag[0] === 't' && tag.length === 2)
      .map((tag: string[]) => tag[1]);

    const userList: UserList = {
      id: dTag[1],
      eventId: event.id,
      title: titleTag[1],
      description: descTag ? descTag[1] : undefined,
      owner: event.pubkey,
      listType,
      kind: event.kind,
      isPrivate: false, // Would need additional metadata
      encrypted: false,
      items,
      totalItems: items.length,
      createdAt: event.created_at * 1000,
      updatedAt: event.created_at * 1000,
      lastSynced: Date.now(),
      collaborators: [],
      viewers: [],
      isShared: true,
      tags,
      category: categoryTag ? categoryTag[1] : undefined,
      subscribers: 0,
      likes: 0,
      shares: 0,
      status: 'active',
      syncErrors: [],
    };

    return userList;
  } catch (error) {
    console.error('Error parsing list event:', error);
    return null;
  }
}

async function updateListEvent(
  list: UserList,
  updates: Partial<Pick<UserList, 'title' | 'description' | 'tags' | 'category' | 'isPrivate' | 'items'>>,
  userPubkey: string,
  relays: string[]
): Promise<UserList> {
  // Create updated event tags
  const eventTags: string[][] = [
    ['d', list.id],
    ['title', updates.title || list.title],
  ];

  const description = updates.description !== undefined ? updates.description : list.description;
  if (description) {
    eventTags.push(['description', description]);
  }

  const category = updates.category !== undefined ? updates.category : list.category;
  if (category) {
    eventTags.push(['category', category]);
  }

  const tags = updates.tags !== undefined ? updates.tags : list.tags;
  tags.forEach(tag => eventTags.push(['t', tag]));

  // Add items to event tags
  const items = updates.items !== undefined ? updates.items : list.items;
  items.forEach(item => {
    switch (item.type) {
      case 'pubkey':
        eventTags.push(['p', item.value, item.displayName || '']);
        break;
      case 'event':
      case 'note':
        eventTags.push(['e', item.value, item.displayName || '']);
        break;
      case 'hashtag':
        eventTags.push(['t', item.value]);
        break;
      case 'url':
        eventTags.push(['r', item.value, item.displayName || '']);
        break;
    }
  });

  const updatedEvent = {
    kind: list.kind,
    created_at: Math.floor(Date.now() / 1000),
    content: description || '',
    tags: eventTags,
    pubkey: userPubkey,
  };

  // Sign and publish
  const signedEvent = await signNostrEvent(updatedEvent);
  await publishToRelays(signedEvent, relays);

  // Return updated list
  return {
    ...list,
    ...updates,
    eventId: signedEvent.id,
    updatedAt: Date.now(),
    lastSynced: Date.now(),
    totalItems: items.length,
  };
}

async function signNostrEvent(event: any): Promise<any> {
  // Sign event with user's private key
  return { ...event, id: generateEventId(), sig: 'signature' };
}

async function publishToRelays(event: any, relays: string[]): Promise<void> {
  // Publish event to specified relays
}

async function fetchNostrEvents(filter: any, relays: string[]): Promise<any[]> {
  // Fetch events from relays
  return [];
}

function generateEventId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// User Lists Slice
const userListsSlice = createSlice({
  name: 'userLists',
  initialState,
  reducers: {
    // List management
    addList: (state, action: PayloadAction<UserList>) => {
      const list = action.payload;
      listsAdapter.addOne(state, list);
      
      // Add to user's lists by type
      if (state.myLists[list.listType]) {
        state.myLists[list.listType].push(list.id);
      }
    },

    updateList: (state, action: PayloadAction<{ id: string; changes: Partial<UserList> }>) => {
      const { id, changes } = action.payload;
      listsAdapter.updateOne(state, {
        id,
        changes: { ...changes, updatedAt: Date.now() },
      });
    },

    removeList: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const list = state.entities[id];
      
      listsAdapter.removeOne(state, id);
      
      // Remove from user's lists
      if (list && state.myLists[list.listType]) {
        state.myLists[list.listType] = state.myLists[list.listType].filter(listId => listId !== id);
      }

      // Clear active list if it was deleted
      if (state.activeListId === id) {
        state.activeListId = null;
      }
    },

    // List item management
    addItemToListLocal: (state, action: PayloadAction<{ listId: string; item: UserListItem }>) => {
      const { listId, item } = action.payload;
      const list = state.entities[listId];
      
      if (list) {
        listsAdapter.updateOne(state, {
          id: listId,
          changes: {
            items: [...list.items, item],
            totalItems: list.items.length + 1,
            updatedAt: Date.now(),
          },
        });
      }
    },

    removeItemFromListLocal: (state, action: PayloadAction<{ listId: string; itemId: string }>) => {
      const { listId, itemId } = action.payload;
      const list = state.entities[listId];
      
      if (list) {
        const updatedItems = list.items
          .filter(item => item.id !== itemId)
          .map((item, index) => ({ ...item, position: index }));
          
        listsAdapter.updateOne(state, {
          id: listId,
          changes: {
            items: updatedItems,
            totalItems: updatedItems.length,
            updatedAt: Date.now(),
          },
        });
      }
    },

    reorderListItems: (state, action: PayloadAction<{ listId: string; fromIndex: number; toIndex: number }>) => {
      const { listId, fromIndex, toIndex } = action.payload;
      const list = state.entities[listId];
      
      if (list && fromIndex !== toIndex) {
        const items = [...list.items];
        const [movedItem] = items.splice(fromIndex, 1);
        items.splice(toIndex, 0, movedItem);
        
        // Update positions
        const updatedItems = items.map((item, index) => ({ ...item, position: index }));
        
        listsAdapter.updateOne(state, {
          id: listId,
          changes: {
            items: updatedItems,
            updatedAt: Date.now(),
          },
        });
      }
    },

    updateListItem: (state, action: PayloadAction<{
      listId: string;
      itemId: string;
      changes: Partial<UserListItem>;
    }>) => {
      const { listId, itemId, changes } = action.payload;
      const list = state.entities[listId];
      
      if (list) {
        const updatedItems = list.items.map(item =>
          item.id === itemId ? { ...item, ...changes } : item
        );
        
        listsAdapter.updateOne(state, {
          id: listId,
          changes: {
            items: updatedItems,
            updatedAt: Date.now(),
          },
        });
      }
    },

    // Active list management
    setActiveList: (state, action: PayloadAction<string | null>) => {
      state.activeListId = action.payload;
    },

    // Search and filtering
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
      
      // Filter lists based on search term
      if (action.payload) {
        const searchLower = action.payload.toLowerCase();
        state.filteredListIds = state.ids.filter(id => {
          const list = state.entities[id];
          return list && (
            list.title.toLowerCase().includes(searchLower) ||
            list.description?.toLowerCase().includes(searchLower) ||
            list.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
            list.category?.toLowerCase().includes(searchLower)
          );
        }) as string[];
      } else {
        state.filteredListIds = [];
      }
    },

    setSelectedCategory: (state, action: PayloadAction<string | null>) => {
      state.selectedCategory = action.payload;
    },

    setSelectedListType: (state, action: PayloadAction<UserList['listType'] | null>) => {
      state.selectedListType = action.payload;
    },

    // Bulk operations
    toggleItemSelection: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      if (state.selectedItems.includes(itemId)) {
        state.selectedItems = state.selectedItems.filter(id => id !== itemId);
      } else {
        state.selectedItems.push(itemId);
      }
    },

    selectAllItems: (state, action: PayloadAction<string[]>) => {
      state.selectedItems = action.payload;
    },

    clearItemSelection: (state) => {
      state.selectedItems = [];
    },

    setBulkOperationInProgress: (state, action: PayloadAction<boolean>) => {
      state.bulkOperationInProgress = action.payload;
    },

    // Sharing
    setShareDialogOpen: (state, action: PayloadAction<boolean>) => {
      state.shareDialogOpen = action.payload;
    },

    setShareableLink: (state, action: PayloadAction<string | null>) => {
      state.shareableLink = action.payload;
    },

    // List templates
    addListTemplate: (state, action: PayloadAction<ListTemplate>) => {
      const template = action.payload;
      state.listTemplates[template.id] = template;
    },

    updateListTemplate: (state, action: PayloadAction<{ id: string; changes: Partial<ListTemplate> }>) => {
      const { id, changes } = action.payload;
      const existing = state.listTemplates[id];
      if (existing) {
        state.listTemplates[id] = { ...existing, ...changes };
      }
    },

    removeListTemplate: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      delete state.listTemplates[id];
    },

    // Subscriptions
    addListSubscription: (state, action: PayloadAction<ListSubscription>) => {
      const subscription = action.payload;
      state.subscribedLists[subscription.listId] = subscription;
    },

    updateListSubscription: (state, action: PayloadAction<{
      listId: string;
      changes: Partial<ListSubscription>;
    }>) => {
      const { listId, changes } = action.payload;
      const existing = state.subscribedLists[listId];
      if (existing) {
        state.subscribedLists[listId] = { ...existing, ...changes };
      }
    },

    removeListSubscription: (state, action: PayloadAction<string>) => {
      const listId = action.payload;
      delete state.subscribedLists[listId];
    },

    // Import/Export states
    setImportInProgress: (state, action: PayloadAction<boolean>) => {
      state.importInProgress = action.payload;
    },

    setExportInProgress: (state, action: PayloadAction<boolean>) => {
      state.exportInProgress = action.payload;
    },

    // Analytics
    updateListAnalytics: (state, action: PayloadAction<UserListsState['listAnalytics']>) => {
      state.listAnalytics = action.payload;
      state.analyticsLastUpdated = Date.now();
    },

    addRecentActivity: (state, action: PayloadAction<{
      type: 'created' | 'updated' | 'shared' | 'subscribed';
      listId: string;
      actor: string;
    }>) => {
      const activity = {
        ...action.payload,
        timestamp: Date.now(),
      };
      
      state.listAnalytics.recentActivity.unshift(activity);
      
      // Keep only last 50 activities
      if (state.listAnalytics.recentActivity.length > 50) {
        state.listAnalytics.recentActivity = state.listAnalytics.recentActivity.slice(0, 50);
      }
    },

    // Error handling
    clearError: (state) => {
      state.error = null;
    },

    // Loading states
    setUpdatingList: (state, action: PayloadAction<{ listId: string; loading: boolean }>) => {
      const { listId, loading } = action.payload;
      state.updatingList[listId] = loading;
    },

    setDeletingList: (state, action: PayloadAction<{ listId: string; loading: boolean }>) => {
      const { listId, loading } = action.payload;
      state.deletingList[listId] = loading;
    },

    // Bulk operations
    addMultipleLists: (state, action: PayloadAction<UserList[]>) => {
      listsAdapter.addMany(state, action.payload);
      
      // Update user's lists by type
      action.payload.forEach(list => {
        if (state.myLists[list.listType] && !state.myLists[list.listType].includes(list.id)) {
          state.myLists[list.listType].push(list.id);
        }
      });
    },
  },
  extraReducers: (builder) => {
    builder
      // Create list
      .addCase(createUserList.pending, (state) => {
        state.creatingList = true;
        state.error = null;
      })
      .addCase(createUserList.fulfilled, (state, action) => {
        state.creatingList = false;
        const list = action.payload;
        
        listsAdapter.addOne(state, list);
        state.myLists[list.listType].push(list.id);
        state.activeListId = list.id;
        
        // Add to recent activity
        state.listAnalytics.recentActivity.unshift({
          type: 'created',
          listId: list.id,
          timestamp: Date.now(),
          actor: list.owner,
        });
      })
      .addCase(createUserList.rejected, (state, action) => {
        state.creatingList = false;
        state.error = action.payload as string;
      })
      
      // Fetch lists
      .addCase(fetchUserLists.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserLists.fulfilled, (state, action) => {
        state.loading = false;
        const { lists } = action.payload;
        
        listsAdapter.setAll(state, lists);
        
        // Organize lists by type
        state.myLists = {
          curated: [],
          mute: [],
          pin: [],
          bookmark: [],
          block: [],
          custom: [],
        };
        
        lists.forEach(list => {
          state.myLists[list.listType].push(list.id);
        });
      })
      .addCase(fetchUserLists.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Add item to list
      .addCase(addItemToList.pending, (state, action) => {
        const listId = action.meta.arg.listId;
        state.updatingList[listId] = true;
      })
      .addCase(addItemToList.fulfilled, (state, action) => {
        const { listId, item, updatedList } = action.payload;
        state.updatingList[listId] = false;
        
        listsAdapter.updateOne(state, {
          id: listId,
          changes: updatedList,
        });
      })
      .addCase(addItemToList.rejected, (state, action) => {
        const listId = action.meta.arg.listId;
        state.updatingList[listId] = false;
        state.error = action.payload as string;
      })
      
      // Remove item from list
      .addCase(removeItemFromList.fulfilled, (state, action) => {
        const { listId, updatedList } = action.payload;
        
        listsAdapter.updateOne(state, {
          id: listId,
          changes: updatedList,
        });
      })
      
      // Update list metadata
      .addCase(updateListMetadata.pending, (state, action) => {
        const listId = action.meta.arg.listId;
        state.updatingList[listId] = true;
      })
      .addCase(updateListMetadata.fulfilled, (state, action) => {
        const { listId, updatedList } = action.payload;
        state.updatingList[listId] = false;
        
        listsAdapter.updateOne(state, {
          id: listId,
          changes: updatedList,
        });
        
        // Add to recent activity
        state.listAnalytics.recentActivity.unshift({
          type: 'updated',
          listId,
          timestamp: Date.now(),
          actor: updatedList.owner,
        });
      })
      .addCase(updateListMetadata.rejected, (state, action) => {
        const listId = action.meta.arg.listId;
        state.updatingList[listId] = false;
        state.error = action.payload as string;
      })
      
      // Delete list
      .addCase(deleteUserList.pending, (state, action) => {
        const listId = action.meta.arg.listId;
        state.deletingList[listId] = true;
      })
      .addCase(deleteUserList.fulfilled, (state, action) => {
        const { listId } = action.payload;
        const list = state.entities[listId];
        
        state.deletingList[listId] = false;
        
        if (list) {
          // Remove from user's lists
          state.myLists[list.listType] = state.myLists[list.listType].filter(id => id !== listId);
          
          // Mark as deleted instead of removing immediately
          listsAdapter.updateOne(state, {
            id: listId,
            changes: { status: 'deleted', updatedAt: Date.now() },
          });
        }
        
        // Clear active list if it was deleted
        if (state.activeListId === listId) {
          state.activeListId = null;
        }
      })
      .addCase(deleteUserList.rejected, (state, action) => {
        const listId = action.meta.arg.listId;
        state.deletingList[listId] = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const {
  addList,
  updateList,
  removeList,
  addItemToListLocal,
  removeItemFromListLocal,
  reorderListItems,
  updateListItem,
  setActiveList,
  setSearchTerm,
  setSelectedCategory,
  setSelectedListType,
  toggleItemSelection,
  selectAllItems,
  clearItemSelection,
  setBulkOperationInProgress,
  setShareDialogOpen,
  setShareableLink,
  addListTemplate,
  updateListTemplate,
  removeListTemplate,
  addListSubscription,
  updateListSubscription,
  removeListSubscription,
  setImportInProgress,
  setExportInProgress,
  updateListAnalytics,
  addRecentActivity,
  clearError,
  setUpdatingList,
  setDeletingList,
  addMultipleLists,
} = userListsSlice.actions;

// Export selectors
export const {
  selectAll: selectAllLists,
  selectById: selectListById,
  selectIds: selectListIds,
  selectEntities: selectListEntities,
  selectTotal: selectTotalLists,
} = listsAdapter.getSelectors((state: RootState) => state.userLists);

// Custom selectors
export const selectListsByType = (state: RootState, listType: UserList['listType']) =>
  state.userLists.myLists[listType].map(id => state.userLists.entities[id]).filter(Boolean);

export const selectActiveList = (state: RootState) =>
  state.userLists.activeListId ? state.userLists.entities[state.userLists.activeListId] : null;

export const selectFilteredLists = (state: RootState) => {
  const { filteredListIds, selectedCategory, selectedListType } = state.userLists;
  
  let lists = filteredListIds.length > 0
    ? filteredListIds.map(id => state.userLists.entities[id]).filter(Boolean)
    : selectAllLists(state);

  if (selectedCategory) {
    lists = lists.filter(list => list.category === selectedCategory);
  }

  if (selectedListType) {
    lists = lists.filter(list => list.listType === selectedListType);
  }

  return lists;
};

export const selectListTemplates = (state: RootState) => Object.values(state.userLists.listTemplates);

export const selectListSubscriptions = (state: RootState) => Object.values(state.userLists.subscribedLists);

export const selectUserListsLoadingState = (state: RootState) => ({
  loading: state.userLists.loading,
  creatingList: state.userLists.creatingList,
  updatingList: state.userLists.updatingList,
  deletingList: state.userLists.deletingList,
  syncingLists: state.userLists.syncingLists,
  importInProgress: state.userLists.importInProgress,
  exportInProgress: state.userLists.exportInProgress,
  bulkOperationInProgress: state.userLists.bulkOperationInProgress,
  error: state.userLists.error,
});

export const selectListAnalytics = (state: RootState) => state.userLists.listAnalytics;

export default userListsSlice.reducer; 

