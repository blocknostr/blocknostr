
import React from 'react';
import { toast } from 'sonner';
import { nostrService } from "@/lib/nostr";
import {
  ContextMenuContent,
  ContextMenuItem,
} from "@/components/ui/context-menu";

interface BookmarkContextMenuProps {
  isBookmarked: boolean;
  relaysConnected: boolean;
  handleBookmark: (e: React.MouseEvent) => Promise<void>;
  setRelaysConnected: (connected: boolean) => void;
}

export function BookmarkContextMenu({
  isBookmarked,
  relaysConnected,
  handleBookmark,
  setRelaysConnected
}: BookmarkContextMenuProps) {
  return (
    <ContextMenuContent onClick={(e) => e.stopPropagation()}>
      <ContextMenuItem onClick={(e) => {
        e.preventDefault();
        handleBookmark(e as unknown as React.MouseEvent);
      }}>
        {isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
      </ContextMenuItem>
      
      {!relaysConnected && (
        <ContextMenuItem onClick={async (e) => {
          e.preventDefault();
          toast.loading("Connecting to relays...");
          try {
            await nostrService.connectToUserRelays();
            toast.success("Connected to relays");
            setRelaysConnected(true);
          } catch (error) {
            toast.error("Failed to connect to relays");
          }
        }}>
          Connect to relays
        </ContextMenuItem>
      )}
    </ContextMenuContent>
  );
}
