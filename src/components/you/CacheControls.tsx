
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cacheClearingService } from '@/lib/utils/cacheClearingService';
import { toast } from 'sonner';
import { Trash2, RefreshCw } from 'lucide-react';

/**
 * Component that provides UI controls for manually clearing application caches
 * Useful for debugging and testing cache behavior
 */
export function CacheControls() {
  const handleClearAllCaches = () => {
    if (cacheClearingService.clearAllCaches()) {
      toast.success("All caches cleared successfully");
    }
  };
  
  const handleClearRuntimeCaches = () => {
    if (cacheClearingService.clearRuntimeCaches()) {
      toast.success("Runtime caches cleared successfully");
    }
  };
  
  return (
    <Card className="border shadow mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Cache Controls</CardTitle>
        <CardDescription>
          Manage application caches and data persistence
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Clearing caches can help resolve data staleness issues after code changes or branch switches.
        </p>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearRuntimeCaches}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Clear Runtime Caches
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleClearAllCaches}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All Caches
        </Button>
      </CardFooter>
    </Card>
  );
}

export default CacheControls;
