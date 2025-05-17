import { useState, useEffect, useCallback } from 'react';
import { useNostr } from 'nostr-react';

interface UseNoteReactionsProps {
  eventId: string;
}

export const useNoteReactions = ({ eventId }: UseNoteReactionsProps) => {
  const [likes, setLikes] = useState<string[]>([]);
  const [reposts, setReposts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { subscribe } = useNostr();

  const fetchReactions = useCallback(() => {
    setLoading(true);
    const filters = [
      {
        kinds: [1, 6, 7],
        "#e": [eventId],
      },
    ];

    subscribe(filters, (event) => {
      if (event.kind === 1) {
        setLikes((prevLikes) => {
          if (!prevLikes.includes(event.pubkey)) {
            return [...prevLikes, event.pubkey];
          }
          return prevLikes;
        });
      } else if (event.kind === 6) {
        setReposts((prevReposts) => {
          if (!prevReposts.includes(event.pubkey)) {
            return [...prevReposts, event.pubkey];
          }
          return prevReposts;
        });
      } else if (event.kind === 7) {
        // Handle other reactions if needed
      }
    });

    setLoading(false);
  }, [eventId, subscribe]);

  useEffect(() => {
    fetchReactions();
  }, [fetchReactions]);

  return { likes, reposts, loading };
};
