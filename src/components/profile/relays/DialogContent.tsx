
import { Relay } from "@/lib/nostr";
import { AddRelayForm } from "./AddRelayForm";
import { RelayList } from "./RelayList";
import { ImportRelaysButton } from "./ImportRelaysButton";
import { SaveRelaysButton } from "./SaveRelaysButton";

interface RelayDialogContentProps {
  isCurrentUser: boolean;
  userNpub?: string;
  relays: Relay[];
  onRelayAdded: () => void;
  onRemoveRelay: (relayUrl: string) => void;
  onPublishRelayList: (relays: Relay[]) => Promise<boolean>;
}

export const RelayDialogContent = ({
  isCurrentUser,
  userNpub,
  relays,
  onRelayAdded,
  onRemoveRelay,
  onPublishRelayList
}: RelayDialogContentProps) => {
  return (
    <div className="space-y-4 py-2">
      {isCurrentUser ? (
        <AddRelayForm onRelayAdded={onRelayAdded} />
      ) : userNpub ? (
        <ImportRelaysButton 
          userNpub={userNpub} 
          onImportComplete={onRelayAdded} 
        />
      ) : null}
      
      {isCurrentUser && (
        <div className="text-xs text-muted-foreground">
          Relay URLs should start with wss:// and be trusted by both you and your contacts
        </div>
      )}
      
      <div className="space-y-2 max-h-[40vh] overflow-y-auto">
        <RelayList 
          relays={relays} 
          isCurrentUser={isCurrentUser}
          onRemoveRelay={isCurrentUser ? onRemoveRelay : undefined}
        />
      </div>
      
      {isCurrentUser && (
        <SaveRelaysButton 
          relays={relays}
          onSave={onPublishRelayList}
        />
      )}
    </div>
  );
};
