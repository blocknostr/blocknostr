import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Clock, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CacheStatusProps {
  isFromCache: boolean;
  isStale?: boolean;
  cacheAge?: number | null; // Keep for backward compatibility
  isFetching: boolean;
  onRefresh?: () => void;
  className?: string;
  variant?: 'default' | 'minimal' | 'detailed';
}

/**
 * Cache Status Indicator
 * Shows users when they're viewing cached data and provides refresh options
 */
export function CacheStatus({
  isFromCache,
  isStale = false,
  cacheAge,
  isFetching,
  onRefresh,
  className,
  variant = 'default'
}: CacheStatusProps) {
  const formatCacheAge = (age: number): string => {
    const seconds = Math.floor(age / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  };

  const getCacheStatusColor = (stale: boolean): string => {
    if (stale) return 'bg-orange-500/10 text-orange-700 border-orange-200';
    return 'bg-green-500/10 text-green-700 border-green-200';
  };

  const getCacheStatusByAge = (age: number): string => {
    const minutes = age / (1000 * 60);
    if (minutes < 5) return 'bg-green-500/10 text-green-700 border-green-200';
    if (minutes < 30) return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
    return 'bg-orange-500/10 text-orange-700 border-orange-200';
  };

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {isFromCache && (
          <Badge variant="outline" className={
            cacheAge ? getCacheStatusByAge(cacheAge) : getCacheStatusColor(isStale)
          }>
            {isStale && <AlertTriangle className="h-3 w-3 mr-1" />}
            <Clock className="h-3 w-3 mr-1" />
            {cacheAge ? formatCacheAge(cacheAge) : (isStale ? 'Stale' : 'Cached')}
          </Badge>
        )}
        {isFetching && (
          <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={cn('flex items-center justify-between p-3 bg-muted/50 rounded-lg border', className)}>
        <div className="flex items-center gap-3">
          {isFromCache ? (
            <WifiOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Wifi className="h-4 w-4 text-green-600" />
          )}
          
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {isFromCache ? 'Cached Data' : 'Live Data'}
            </span>
            {isFromCache && (
              <span className="text-xs text-muted-foreground">
                {cacheAge ? `Updated ${formatCacheAge(cacheAge)}` : 
                 isStale ? 'Data may be outdated' : 'Recently cached'}
              </span>
            )}
            {isStale && (
              <span className="text-xs text-orange-600">
                Consider refreshing for latest data
              </span>
            )}
          </div>
          
          {isFetching && (
            <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-200">
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              Updating...
            </Badge>
          )}
        </div>
        
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isFetching}
            className="h-8 px-2"
          >
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          </Button>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {isFromCache && (
        <Badge variant="outline" className={
          cacheAge ? getCacheStatusByAge(cacheAge) : getCacheStatusColor(isStale)
        }>
          {isStale && <AlertTriangle className="h-3 w-3 mr-1" />}
          <Clock className="h-3 w-3 mr-1" />
          {cacheAge ? `Cached ${formatCacheAge(cacheAge)}` : 
           isStale ? 'Stale Cache' : 'Cached'}
        </Badge>
      )}
      
      {isFetching && (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-200">
          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
          Updating
        </Badge>
      )}
      
      {onRefresh && !isFetching && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          className="h-6 px-2 text-xs"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Refresh
        </Button>
      )}
    </div>
  );
} 
