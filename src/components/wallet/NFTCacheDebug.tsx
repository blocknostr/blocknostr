import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNFTCache } from '@/hooks/useNFTCache';
import { Database, Trash2, RefreshCw, Clock, HardDrive, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const NFTCacheDebug: React.FC = () => {
  const { stats, isLoading, refreshStats, clearAllCache } = useNFTCache();
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  const handleRefreshStats = async () => {
    await refreshStats();
    setLastRefresh(new Date());
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all NFT cache data? This will remove all cached NFTs and metadata.')) {
      await clearAllCache();
      setLastRefresh(new Date());
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          NFT Cache Debug
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Cache Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-1">
              <HardDrive className="h-3 w-3 text-blue-500" />
              <span className="text-xs font-medium">Addresses</span>
            </div>
            <div className="text-lg font-bold">{stats.totalAddresses}</div>
          </div>

          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-1">
              <Database className="h-3 w-3 text-green-500" />
              <span className="text-xs font-medium">NFTs</span>
            </div>
            <div className="text-lg font-bold">{stats.totalNFTs}</div>
          </div>

          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-1">
              <RefreshCw className="h-3 w-3 text-purple-500" />
              <span className="text-xs font-medium">Metadata</span>
            </div>
            <div className="text-lg font-bold">{stats.totalMetadata}</div>
          </div>

          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-1">
              <HardDrive className="h-3 w-3 text-orange-500" />
              <span className="text-xs font-medium">Size</span>
            </div>
            <div className="text-lg font-bold">{stats.cacheSize}</div>
          </div>
        </div>

        {/* Cache Age */}
        {stats.oldestCache && (
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-3 w-3 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">Oldest Cache</span>
            </div>
            <div className="text-sm">
              {formatDistanceToNow(stats.oldestCache, { addSuffix: true })}
            </div>
          </div>
        )}

        {/* Cache Quality */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Cache Health:</span>
          <Badge variant={stats.totalAddresses > 0 ? "default" : "secondary"}>
            {stats.totalAddresses > 0 ? 'Active' : 'Empty'}
          </Badge>
          {stats.totalNFTs > 50 && (
            <Badge variant="outline" className="text-xs">
              Large Cache
            </Badge>
          )}
        </div>

        {/* Last Refresh */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Last refresh:</span>
          <span>{formatDistanceToNow(lastRefresh, { addSuffix: true })}</span>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshStats}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            <span className="ml-1">Refresh</span>
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={handleClearAll}
            disabled={isLoading || stats.totalAddresses === 0}
            className="flex-1"
          >
            <Trash2 className="h-3 w-3" />
            <span className="ml-1">Clear All</span>
          </Button>
        </div>

        {/* Cache Benefits */}
        {stats.totalNFTs > 0 && (
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="text-xs font-medium text-green-700 mb-1">
              Cache Benefits
            </div>
            <div className="text-xs text-green-600 space-y-1">
              <div>• Instant loading of {stats.totalNFTs} NFTs</div>
              <div>• Reduced API calls</div>
              <div>• Offline availability</div>
              <div>• Persistent across sessions</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NFTCacheDebug; 
