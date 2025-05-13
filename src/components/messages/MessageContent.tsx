
import React, { useState, useEffect } from 'react';
import { NostrEvent } from '@/lib/nostr/types';
import { nostrService } from '@/lib/nostr';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

interface MessageContentProps {
  event: NostrEvent;
}

const MessageContent: React.FC<MessageContentProps> = ({ event }) => {
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const decryptMessage = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Check if service has the adapter with decryption method
        if (!nostrService.decryptDirectMessage) {
          throw new Error("Decryption service not available");
        }
        
        // Decrypt the message using our NIP-44 implementation
        // which falls back to NIP-04 if needed
        const content = await nostrService.decryptDirectMessage(event);
        
        if (content) {
          setDecryptedContent(content);
        } else {
          throw new Error("Failed to decrypt message");
        }
      } catch (err) {
        console.error("Error decrypting message:", err);
        setError("Could not decrypt this message");
      } finally {
        setIsLoading(false);
      }
    };

    if (event) {
      decryptMessage();
    }
  }, [event]);

  if (isLoading) {
    return (
      <Card className="p-3">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-3 border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
        <div className="flex items-center text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4 mr-2" />
          <span className="text-sm">{error}</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-3">
      <p className="whitespace-pre-wrap break-words text-sm">{decryptedContent}</p>
    </Card>
  );
};

export default MessageContent;
