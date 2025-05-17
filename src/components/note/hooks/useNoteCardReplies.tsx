import { useState, useEffect } from 'react';
import { nostrService } from "@/lib/nostr";
import { useNoteEvents } from './useNoteEvents';

interface UseNoteCardRepliesProps {
  noteId: string;
}

export const useNoteCardReplies = ({ noteId }: UseNoteCardRepliesProps) => {
  const [replyCount, setReplyCount] = useState<number>(0);
  const { events: replies, subscribe } = useNoteEvents();

  useEffect(() => {
    const filters = [
      {
        kinds: [1],
        '#e': [noteId],
      },
    ];

    const updateReplyCount = () => {
      setReplyCount(replies.length);
    };

    const unsubscribe = subscribe(filters, (event) => {
      setReplyCount((prevCount) => prevCount + 1);
    });

    updateReplyCount();

    return () => {
      unsubscribe();
    };
  }, [noteId, replies, subscribe]);

  return { replyCount, replies };
};
