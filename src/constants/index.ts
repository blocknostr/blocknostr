// Configuration Constants - Replace hardcoded values across the app

export const DEMO_PROFILES = [
  {
    name: "Jack",
    npub: "npub1sg6plzptd64u62a878hep2kev88swjh3tw00gjsfl8f237lmu63q0uf63m",
    picture: "https://avatars.githubusercontent.com/u/1247608?v=4",
    isDemoProfile: true
  },
  {
    name: "Fiatjaf", 
    npub: "npub180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyjh6w6",
    picture: "https://avatars.githubusercontent.com/u/1653275?v=4",
    isDemoProfile: true
  },
  {
    name: "Nostr Project",
    npub: "npub1nstrcu63lzpjkz94djajuz2evrgu6qezckvmhrfhqdk5urlu9u5sn2v5sz",
    picture: "",
    isDemoProfile: true
  }
];

// Token Configuration - Environment-specific token mappings
export const TOKEN_MAPPINGS = {
  // Example ALPH token ID - should be configurable per environment
  DEMO_TOKEN_ID: "27aa562d592758d73b33ef11ac5b574aea843a3e315a8d1bdef714c3d6a52cd5"
};

// Alephium Network Configuration
export const ALEPHIUM_CONFIG = {
  // Use environment variables or config files instead of hardcoding
  NODE_URL: import.meta.env.VITE_ALEPHIUM_NODE_URL || 'https://node.mainnet.alephium.org',
  EXPLORER_URL: import.meta.env.VITE_ALEPHIUM_EXPLORER_URL || 'https://backend.mainnet.alephium.org',
  NETWORK: import.meta.env.VITE_ALEPHIUM_NETWORK || 'mainnet'
};

// Development flags
export const DEV_CONFIG = {
  SHOW_DEMO_PROFILES: import.meta.env.VITE_SHOW_DEMO_PROFILES === 'true' || import.meta.env.NODE_ENV === 'development',
  ENABLE_DEBUG_FEATURES: import.meta.env.NODE_ENV === 'development'
}; 