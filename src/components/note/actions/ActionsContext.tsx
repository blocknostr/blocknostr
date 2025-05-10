
import { createContext, useContext } from 'react';

// Define the type for our context
export interface ActionsContextType {
  eventId: string;
  pubkey: string;
  isLoggedIn: boolean;
  isAuthor?: boolean;
  reposterPubkey?: string | null;
  showRepostHeader?: boolean;
}

// Create the context with a default empty object
export const ActionsContext = createContext<ActionsContextType>({
  eventId: '',
  pubkey: '',
  isLoggedIn: false
});

// Custom hook to consume the context
export const useActionsContext = () => useContext(ActionsContext);
