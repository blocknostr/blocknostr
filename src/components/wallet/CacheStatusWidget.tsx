import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  RefreshCw,
  Database,
  Wifi,
  WifiOff,
  Clock,
  Settings,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Activity,
  Shield,
  Timer
} from 'lucide-react';
import { CacheStatus, WalletCacheConfig } from '@/api/types/wallet';
import { formatDistanceToNow } from 'date-fns';

interface CacheStatusWidgetProps {
  cacheStatus: CacheStatus;
  cacheConfig: WalletCacheConfig;
  onRefreshStale: () => void;
  onCleanupCache: () => void;
  onUpdateConfig: (updates: Partial<WalletCacheConfig>) => void;
  isRefreshing?: boolean;
  rateLimitInfo?: any; // Add rate limit info prop
}

const CacheStatusWidget: React.FC<CacheStatusWidgetProps> = ({
  cacheStatus,
  cacheConfig,
  onRefreshStale,
  onCleanupCache,
  onUpdateConfig,
  isRefreshing = false,
  rateLimitInfo
}) => {
  const [localConfig, setLocalConfig] = useState(cacheConfig);

  const handleConfigUpdate = (key: keyof WalletCacheConfig, value: any) => {
    const updated = { ...localConfig, [key]: value };
    setLocalConfig(updated);
    onUpdateConfig({ [key]: value });
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const getCacheHealthColor = () => {
    const healthPercentage = (cacheStatus.cachedWallets / cacheStatus.totalWallets) * 100;
    if (healthPercentage >= 80) return 'text-green-600';
    if (healthPercentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCacheHealthStatus = () => {
    const healthPercentage = (cacheStatus.cachedWallets / cacheStatus.totalWallets) * 100;
    if (healthPercentage >= 80) return 'Excellent';
    if (healthPercentage >= 60) return 'Good';
    if (healthPercentage >= 40) return 'Fair';
    return 'Poor';
  };

  // Helper to get rate limit status color
  const getRateLimitColor = (endpoint: string) => {
    if (!rateLimitInfo?.endpoints?.[endpoint]) return 'text-gray-500';
    
    const info = rateLimitInfo.endpoints[endpoint];
    const usage = (info.requestsInWindow / info.maxRequests) * 100;
    
    if (info.backoffUntil > Date.now()) return 'text-red-600';
    if (usage >= 80) return 'text-yellow-600';
    if (usage >= 50) return 'text-blue-600';
    return 'text-green-600';
  };

  const getRateLimitStatus = (endpoint: string) => {
    if (!rateLimitInfo?.endpoints?.[endpoint]) return 'Unknown';
    
    const info = rateLimitInfo.endpoints[endpoint];
    const now = Date.now();
    
    if (info.backoffUntil > now) {
      const waitTime = Math.ceil((info.backoffUntil - now) / 1000);
      return `Cooling down (${waitTime}s)`;
    }
    
    const usage = (info.requestsInWindow / info.maxRequests) * 100;
    if (usage >= 80) return 'Near limit';
    if (usage >= 50) return 'Moderate';
    return 'Available';
  };

  return (
    <Card className="w-full">
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <CardTitle className="text-base">Cache & Rate Limits</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {cacheStatus.isOnline ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
            <Badge variant={cacheStatus.isOnline ? "default" : "secondary"}>
              {cacheStatus.isOnline ? "Online" : "Offline"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="py-3">
        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="limits">Limits</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="status" className="space-y-4 mt-4">
            {/* Cache Health Overview */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Cache Health</p>
                      <p className={`text-lg font-bold ${getCacheHealthColor()}`}>
                        {getCacheHealthStatus()}
                      </p>
                    </div>
                    <CheckCircle className={`h-6 w-6 ${getCacheHealthColor()}`} />
                  </div>
                  <Progress 
                    value={(cacheStatus.cachedWallets / cacheStatus.totalWallets) * 100} 
                    className="mt-2 h-2" 
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Storage Used</p>
                      <p className="text-lg font-bold">
                        {formatBytes(cacheStatus.storageUsage)}
                      </p>
                    </div>
                    <Activity className="h-6 w-6 text-blue-600" />
                  </div>
                  <Progress 
                    value={(cacheStatus.storageUsage / cacheConfig.storageQuotaLimit) * 100} 
                    className="mt-2 h-2" 
                  />
                </CardContent>
              </Card>
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="text-center p-2 border rounded">
                <p className="font-medium text-lg">{cacheStatus.totalWallets}</p>
                <p className="text-muted-foreground">Total</p>
              </div>
              <div className="text-center p-2 border rounded">
                <p className="font-medium text-lg text-green-600">{cacheStatus.cachedWallets}</p>
                <p className="text-muted-foreground">Cached</p>
              </div>
              <div className="text-center p-2 border rounded">
                <p className="font-medium text-lg text-orange-600">{cacheStatus.staleWallets}</p>
                <p className="text-muted-foreground">Stale</p>
              </div>
            </div>

            {/* Alerts */}
            {cacheStatus.staleWallets > 0 && (
              <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-800">
                    {cacheStatus.staleWallets} wallet(s) need refresh
                  </p>
                  <p className="text-xs text-orange-600">
                    Data may be outdated. Consider refreshing for latest information.
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={onRefreshStale}
                  disabled={isRefreshing || !cacheStatus.isOnline}
                >
                  {isRefreshing ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    'Refresh'
                  )}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="limits" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-4 w-4" />
                <h4 className="text-sm font-medium">API Rate Limits</h4>
              </div>
              
              {rateLimitInfo?.endpoints ? (
                Object.entries(rateLimitInfo.endpoints).map(([endpoint, info]: [string, any]) => (
                  <div key={endpoint} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium capitalize">{endpoint}</span>
                      <Badge 
                        variant="outline" 
                        className={getRateLimitColor(endpoint)}
                      >
                        {getRateLimitStatus(endpoint)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Requests: {info.requestsInWindow}/{info.maxRequests}</span>
                        <span>Failures: {info.failures}</span>
                      </div>
                      
                      <Progress 
                        value={(info.requestsInWindow / info.maxRequests) * 100}
                        className="h-1"
                      />
                      
                      {info.backoffUntil > Date.now() && (
                        <div className="flex items-center gap-1 text-xs text-red-600">
                          <Timer className="h-3 w-3" />
                          <span>
                            Cooling down for {Math.ceil((info.backoffUntil - Date.now()) / 1000)}s
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Rate limit info not available</p>
                </div>
              )}
              
              {rateLimitInfo && (
                <div className="grid grid-cols-2 gap-4 mt-4 text-xs">
                  <div className="p-2 bg-muted rounded">
                    <p className="font-medium">Cache Size</p>
                    <p>{rateLimitInfo.cacheSize || 0} entries</p>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <p className="font-medium">Pending Requests</p>
                    <p>{rateLimitInfo.pendingRequests || 0}</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Refresh</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically refresh stale wallet data
                  </p>
                </div>
                <Switch
                  checked={localConfig.enableAutoRefresh}
                  onCheckedChange={(checked) => handleConfigUpdate('enableAutoRefresh', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Background Sync</Label>
                  <p className="text-xs text-muted-foreground">
                    Sync data when app becomes visible
                  </p>
                </div>
                <Switch
                  checked={localConfig.enableBackgroundSync}
                  onCheckedChange={(checked) => handleConfigUpdate('enableBackgroundSync', checked)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Cache Duration</Label>
                <p className="text-xs text-muted-foreground">
                  How long to keep data fresh (currently: {formatDuration(localConfig.defaultTTL)})
                </p>
                <Input
                  type="number"
                  value={localConfig.defaultTTL / 60000} // Convert to minutes
                  onChange={(e) => handleConfigUpdate('defaultTTL', parseInt(e.target.value) * 60000)}
                  placeholder="Minutes"
                  min="1"
                  max="1440" // 24 hours
                />
              </div>
              
              <div className="space-y-2">
                <Label>Refresh Interval</Label>
                <p className="text-xs text-muted-foreground">
                  How often to check for stale data (currently: {formatDuration(localConfig.refreshInterval)})
                </p>
                <Input
                  type="number"
                  value={localConfig.refreshInterval / 60000} // Convert to minutes
                  onChange={(e) => handleConfigUpdate('refreshInterval', parseInt(e.target.value) * 60000)}
                  placeholder="Minutes"
                  min="1"
                  max="60"
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="actions" className="space-y-4 mt-4">
            <div className="space-y-3">
              <Button 
                variant="outline" 
                onClick={onRefreshStale}
                disabled={isRefreshing || !cacheStatus.isOnline}
                className="w-full justify-start"
              >
                {isRefreshing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh Stale Wallets ({cacheStatus.staleWallets})
              </Button>
              
              <Button 
                variant="outline" 
                onClick={onCleanupCache}
                className="w-full justify-start"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Cleanup Cache
              </Button>
              
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">Cache Statistics</span>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>Last cleanup: {formatDistanceToNow(cacheStatus.lastCleanup)} ago</p>
                  <p>Storage quota: {formatBytes(cacheConfig.storageQuotaLimit)}</p>
                  <p>Usage: {((cacheStatus.storageUsage / cacheConfig.storageQuotaLimit) * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CacheStatusWidget; 

