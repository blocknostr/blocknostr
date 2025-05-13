
# Nostr Adapter Pattern

## Overview

The BlockNostr application uses an adapter pattern to organize functionality into domain-specific modules, making the codebase more maintainable and easier to extend.

## Architecture

The architecture is organized around these key components:

1. **Base Adapter**: Provides core functionality shared across all adapters.
2. **Domain-Specific Adapters**: Separate adapters for different functional areas:
   - `SocialAdapter`: Handles social interactions (following, messaging, etc.)
   - `RelayAdapter`: Manages relay connections and communication
   - `DataAdapter`: Handles data retrieval and caching
   - `CommunityAdapter`: Manages community functions
   - `BookmarkAdapter`: Handles bookmark operations
   
3. **NostrAdapter**: Main adapter that composes all domain-specific adapters and exposes them as properties.

## Usage

### Structured Approach (Recommended)

Use domain properties to access adapter functionality:

```typescript
// Access social functionality
const isFollowing = nostrService.social.isFollowing(pubkey);

// Access relay functionality
const relayStatus = nostrService.relay.getRelayStatus();

// Access data functionality
const profile = await nostrService.data.getUserProfile(pubkey);

// Access bookmark functionality
const bookmarks = await nostrService.bookmark.getBookmarks();

// Access community functionality
const result = await nostrService.community.createProposal(...);
```

### Direct Access (Legacy support)

For backward compatibility, common methods are also available directly on the NostrAdapter instance:

```typescript
// Still works but not recommended for new code
const isFollowing = nostrService.isFollowing(pubkey);
const relayStatus = nostrService.getRelayStatus();
```

## Benefits

1. **Separation of Concerns**: Each adapter handles a specific domain
2. **Testability**: Easier to mock and test specific functionality
3. **Maintainability**: Well-organized code structure
4. **Extensibility**: Easy to add new adapters for new functionality
5. **Type Safety**: Proper TypeScript interfaces for each adapter

## Migrating Components

When updating components to use the adapter pattern:

1. Identify which adapter domain the functionality belongs to
2. Update imports and method calls to use the domain property
3. Update tests to match the new structure

Examples:

```typescript
// Before
const profile = await nostrService.getUserProfile(pubkey);

// After
const profile = await nostrService.data.getUserProfile(pubkey);
```

## Future Improvements

1. Implement more specialized adapters for specific features
2. Add comprehensive logging and error handling in adapters
3. Improve performance through selective caching strategies
4. Add metrics collection for different operations
