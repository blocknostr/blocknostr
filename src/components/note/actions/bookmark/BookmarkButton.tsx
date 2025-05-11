
import React from 'react';
import { Bookmark } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useBookmarkState } from './useBookmarkState';
import BookmarkContextMenu from './BookmarkContextMenu';
import {
  ContextMenu,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface BookmarkButtonProps {
  eventId: string;
  isBookmarked: boolean;
  setIsBookmarked: (value: boolean) => void;
}

const BookmarkButton: React.FC<BookmarkButtonProps> = ({
  eventId,
  isBookmarked: initialIsBookmarked,
  setIsBookmarked: externalSetIsBookmarked
}) => {
  const {
    isBookmarked,
    isBookmarkPending,
    relaysConnected,
    setRelaysConnected,
    handleBookmark
  } = useBookmarkState(eventId, initialIsBookmarked);

  // Sync our internal state with external state
  React.useEffect(() => {
    externalSetIsBookmarked(isBookmarked);
  }, [isBookmarked, externalSetIsBookmarked]);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className={`rounded-full hover:text-yellow-500 hover:bg-yellow-500/10 ${isBookmarked ? 'text-yellow-500' : ''}`}
          title="Bookmark"
          onClick={handleBookmark}
          disabled={isBookmarkPending}
        >
          <Bookmark className="h-[18px] w-[18px]" />
        </Button>
      </ContextMenuTrigger>
      
      <BookmarkContextMenu 
        isBookmarked={isBookmarked}
        relaysConnected={relaysConnected}
        handleBookmark={handleBookmark}
        setRelaysConnected={setRelaysConnected}
      />
    </ContextMenu>
  );
};

export default BookmarkButton;
