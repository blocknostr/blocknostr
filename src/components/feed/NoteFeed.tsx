
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface NoteFeedProps {
  pubkey: string;
}

// This is a placeholder component for the NoteFeed
const NoteFeed: React.FC<NoteFeedProps> = ({ pubkey }) => {
  return (
    <div className="space-y-4">
      {/* Placeholder content for demo */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-primary/20 rounded-full"></div>
          <div>
            <div className="font-medium">Sample Note</div>
            <div className="text-xs text-muted-foreground">Just now</div>
          </div>
        </div>
        <p className="text-sm">This is a placeholder note. In a real implementation, this would show actual notes from the user with pubkey: {pubkey.substring(0, 8)}...</p>
      </div>
      
      <div className="border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-primary/20 rounded-full"></div>
          <div>
            <div className="font-medium">Another Note</div>
            <div className="text-xs text-muted-foreground">2 hours ago</div>
          </div>
        </div>
        <p className="text-sm">This is another placeholder note for demonstration purposes.</p>
      </div>
      
      <div className="text-center py-4 text-sm text-muted-foreground">
        Note feed for pubkey: {pubkey.substring(0, 8)}...
      </div>
    </div>
  );
};

export default NoteFeed;
