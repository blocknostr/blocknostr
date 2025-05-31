# My Communities Module

This folder contains all components and functionality related to the My Communities page, providing a centralized location for community discovery, management, and interaction features.

## Structure

```
my-communities/
├── MyCommunitiesPage.tsx          # Main page component
├── components/                    # Reusable components
│   ├── CommunitiesGrid.tsx       # Grid layout for communities
│   ├── CommunitiesLoading.tsx    # Loading states
│   └── CreateCommunityDialog.tsx # Community creation dialog
├── index.ts                      # Barrel exports
└── README.md                     # This file
```

## Components

### MyCommunitiesPage
- **Purpose**: Main page component for `/communities` and `/my-communities` routes
- **Features**: 
  - Tab-based navigation (Discover/My Communities)
  - Search functionality
  - Community creation
  - Redux integration for data management
- **Dependencies**: Uses Redux hooks for DAO data management

### CommunitiesGrid
- **Purpose**: Displays communities in a responsive grid layout
- **Features**:
  - Pagination support
  - Loading states
  - Empty states with actions
  - Responsive design (1/2/3 columns)
- **Props**: Supports various display variants and customization

### CommunitiesLoading
- **Purpose**: Provides loading states for different scenarios
- **Variants**:
  - `page`: Full page loading with animation
  - `grid`: Skeleton grid for community cards
  - `inline`: Inline loading indicator

### CreateCommunityDialog
- **Purpose**: Wrapper around CreateDAODialog with community-focused terminology
- **Features**: 
  - Simplified interface for community creation
  - Integrates with existing DAO infrastructure
  - Community-specific routing

## Usage

```tsx
import { MyCommunitiesPage, CommunitiesGrid } from '@/components/my-communities';

// Use in routing
<Route path="communities" element={<MyCommunitiesPage />} />

// Use grid component standalone
<CommunitiesGrid 
  communities={communities}
  currentUserPubkey={userPubkey}
  onJoinCommunity={handleJoin}
/>
```

## Integration

- **Redux**: Uses `useDAOCommunities`, `useMyDAOs`, and `useCreateDAO` hooks
- **Routing**: Supports both `/communities` and `/my-communities` routes
- **DAO System**: Built on top of the existing DAO infrastructure
- **UI Components**: Uses shadcn/ui components for consistent styling

## Key Features

1. **Unified Experience**: Single page handles both community discovery and user's communities
2. **Search & Filter**: Real-time search across community names, descriptions, and tags
3. **Responsive Design**: Works seamlessly across desktop and mobile devices
4. **Loading States**: Comprehensive loading and empty states for better UX
5. **Community Creation**: Integrated community creation with form validation
6. **Redux Integration**: Efficient state management with caching and error handling 