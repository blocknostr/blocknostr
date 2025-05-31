# Recent Bug Fixes

## 🔧 Issues Fixed

### 1. **Profile Edit Publishing Bug** ✅ LATEST
**Problem**: Profile edit functionality wasn't calling/publishing NOSTR events. Users could edit their profile but changes weren't being broadcast to the NOSTR network. Additionally, the event structure wasn't NIP-01 compliant, causing "can't serialize event with wrong or missing properties" errors.

**Root Cause**: 
- ProfilePageRedux's `handleUpdate` function was just a placeholder with `console.log()` and toast messages
- The `nostrService.updateProfile()` method was completely missing from the nostr service
- RTK mutation was calling a non-existent method, failing silently
- **NIP-01 Violation**: Event structure included `pubkey` field before signing, but browser extensions expect to handle this automatically
- **Field Naming Issue**: Using camelCase field names (`displayName`) instead of NIP-01 required snake_case (`display_name`)
- **Type Validation Missing**: No validation of event property types before signing
- Cache invalidation wasn't aggressive enough to show updated profile data immediately

**Fix**:
- **RTK Integration**: Updated ProfilePageRedux to use `useUpdateProfileMutation` from profileApi
- **Missing Method**: Added complete `updateProfile` method to nostrService that:
  - ✅ **NIP-01 Compliant**: Creates unsigned events without `pubkey` field (browser extension adds this)
  - ✅ **Proper Field Mapping**: Converts camelCase to snake_case field names (`displayName` → `display_name`)
  - ✅ **Strict Type Validation**: Validates all event properties have correct types before signing
  - ✅ **Data Sanitization**: Removes undefined/null values and trims strings
  - Creates proper kind 0 (profile metadata) NOSTR events
  - Signs events using browser extension (window.nostr) with proper validation
  - Publishes to connected relays with proper error handling
  - Handles permission issues with user-friendly messages
- **Real Publishing**: ProfilePageRedux now actually publishes profile updates to NOSTR network
- **Aggressive Cache Refresh**: Added comprehensive cache invalidation and forced refetch after updates
- **Fresh Data Fetching**: Profile API now queries last 24 hours of metadata events to ensure latest data
- **Better Error Handling**: Specific error messages for serialization, signing, and publishing failures
- **Enhanced Debugging**: Added detailed logging for troubleshooting profile update issues

**Files Modified**: 
- `src/pages/ProfilePageRedux.tsx` - Real RTK mutation integration and better cache invalidation
- `src/lib/nostr/index.ts` - Added missing NIP-01 compliant updateProfile method with field mapping
- `src/api/rtk/profileApi.ts` - Enhanced metadata fetching for fresh profile data

### 2. **Follow Button State Bug** ✅ LATEST
**Problem**: Follow button showing "Follow" instead of "Following" for users that are already being followed.

**Root Cause**: 
- Tag mismatch between `profileApi` (using 'Contacts') and `nostrApi` (invalidating 'ContactList')
- Data structure mismatch in contact list mapping  
- Cache not being invalidated after follow/unfollow operations

**Fix**:
- **Cache Tag Alignment**: Changed `profileApi` tags from 'Contacts' to 'ContactList' to match `nostrApi`
- **Data Structure Fix**: Fixed mapping logic since `contacts` is array of strings, not objects
- **Cache Refresh**: Added refetch logic after successful follow/unfollow operations
- **Debug Logging**: Added console logging to track follow state changes

**Files Modified**: 
- `src/api/rtk/profileApi.ts` - Fixed cache tags alignment
- `src/components/profile/ProfileHeader.tsx` - Fixed data mapping & added refresh logic

### 3. **Avatar Size & NOSTR Name Display Fixes** ✅ LATEST
**Problem**: Multiple UI consistency issues:
- Avatars too small (8x8px) affecting visibility and user experience
- Note cards showing only "(post)" instead of proper user names
- Name display not following NOSTR NIPs standards for name hierarchy

**Root Cause**: 
- Avatar sizes inconsistent between components
- ProfileDisplayName component not implementing proper NOSTR name hierarchy
- Missing NIP-05 verification display and proper fallback chain

**Fix**:
- **Avatar Size Enhancement**: 
  - Increased from 8x8px to 12x12px in NewNoteCard for better visibility
  - Updated ProfileActivity to use 10x10px avatars consistently
  - Better hover effects and visual hierarchy
- **NOSTR NIPs Compliance**: Complete rewrite of ProfileDisplayName component:
  - **Priority 1**: NIP-05 verified name (with verification checkmark)
  - **Priority 2**: display_name field  
  - **Priority 3**: name/username field
  - **Priority 4**: Fallback to truncated pubkey
- **Visual Improvements**:
  - Added blue verification checkmarks for NIP-05 verified users
  - Better name positioning and typography hierarchy
  - Proper truncation and responsive layout

**Files Modified**: 
- `src/components/note/NewNoteCard.tsx` - Larger avatars & better name layout
- `src/components/profile/ProfileActivity.tsx` - Consistent avatar sizing
- `src/components/profile/ProfileDisplayName.tsx` - Complete NOSTR NIPs rewrite

### 4. **Name Display & Time Formatting Fixes** ✅ LATEST
**Problem**: Critical UX issues with note cards:
- Names showing as "User 339db62c" instead of actual user names
- Timestamps showing absolute dates instead of relative time ("2h ago")
- WorldChat refreshing and jumping between message counts

**Root Cause**: 
- ProfileDisplayName component had `autoFetch={false}` preventing profile data loading
- useNoteCard hook using absolute date formatting instead of relative time
- WorldChat polling every 30 seconds causing jarring refresh behavior
- Unstable message sorting causing content jumping

**Fix**:
- **Name Display Resolution**:
  - Enabled `autoFetch={true}` in NewNoteCard ProfileDisplayName component
  - Enhanced metadata parsing with robust error handling
  - Fixed fallback chain to properly use display_name > name > pubkey
- **Relative Time Implementation**:
  - Complete rewrite of timestamp formatting in useNoteCard
  - Now shows: "now", "2m ago", "3h ago", "5d ago"
  - Falls back to "Jan 15" for posts older than 7 days
- **WorldChat Optimization**:
  - Reduced polling interval from 30s to 5s for responsive chat experience
  - Added stable sorting with secondary sort by event ID to prevent jumping
  - Disabled refetchOnFocus to prevent unnecessary refreshes
  - Implemented memoized sorting to prevent re-renders

**Files Modified**: 
- `src/components/note/NewNoteCard.tsx` - Enabled profile fetching
- `src/components/note/hooks/useNoteCard.tsx` - Fixed relative time formatting
- `src/components/profile/ProfileDisplayName.tsx`