import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Bug,
  Database,
  Shield,
  Activity,
  Settings,
  Trash2,
  RefreshCw,
  Download,
  Monitor,
  Wifi,
  WifiOff,
  Terminal,
  Eye,
  EyeOff,
  Clock,
  CheckCircle,
  AlertTriangle,
  Minimize2,
  Maximize2,
  X
} from 'lucide-react';
import { SavedWallet, CacheStatus, WalletCacheConfig } from '@/api/types/wallet';
import { clearRateLimitState } from '@/api/external/rateLimitedApi';

interface DebugLog {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error';
  category: 'api' | 'cache' | 'ratelimit' | 'wallet' | 'system' | 'console';
  message: string;
  details?: any;
}

interface UnifiedDeveloperPanelProps {
  savedWallets: SavedWallet[];
  isOnline: boolean;
  rateLimitInfo?: any;
  cacheStatus?: CacheStatus;
  cacheConfig?: WalletCacheConfig;
  onForceRefresh?: (address: string) => Promise<boolean>;
  onRefreshStale?: () => Promise<void>;
  onCleanupCache?: () => void;
  onUpdateConfig?: (updates: Partial<WalletCacheConfig>) => void;
  enabledForPage?: 'wallets';
}

const UnifiedDeveloperPanel: React.FC<UnifiedDeveloperPanelProps> = ({
  savedWallets,
  isOnline,
  rateLimitInfo,
  cacheStatus,
  cacheConfig,
  onForceRefresh,
  onRefreshStale,
  onCleanupCache,
  onUpdateConfig,
  enabledForPage = 'wallets'
}) => {
  // Panel visibility and state
  const [isVisible, setIsVisible] = useState(() => {
    return localStorage.getItem('devPanel_visible') === 'true';
  });
  const [isExpanded, setIsExpanded] = useState(() => {
    return localStorage.getItem('devPanel_expanded') !== 'false';
  });
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Debug logging state
  const [isLogging, setIsLogging] = useState(() => {
    return localStorage.getItem('devPanel_logging') !== 'false';
  });
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [filterLevel, setFilterLevel] = useState<'all' | 'error' | 'warn' | 'info'>('all');
  
  // Cache config state
  const [localConfig, setLocalConfig] = useState(cacheConfig || {
    maxAge: 300000,
    maxWallets: 50,
    storageQuotaLimit: 10485760,
    enableAutoRefresh: true,
    refreshInterval: 300000
  });
  
  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('devPanel_position');
    return saved ? JSON.parse(saved) : { x: 20, y: 20 };
  });
  
  const dragRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 0, y: 0 });

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('devPanel_visible', isVisible.toString());
  }, [isVisible]);

  useEffect(() => {
    localStorage.setItem('devPanel_expanded', isExpanded.toString());
  }, [isExpanded]);

  useEffect(() => {
    localStorage.setItem('devPanel_logging', isLogging.toString());
  }, [isLogging]);

  useEffect(() => {
    localStorage.setItem('devPanel_position', JSON.stringify(position));
  }, [position]);

  // Update local config when props change
  useEffect(() => {
    if (cacheConfig) {
      setLocalConfig(cacheConfig);
    }
  }, [cacheConfig]);

  // Add debug log entry
  const addLog = (level: DebugLog['level'], category: DebugLog['category'], message: string, details?: any) => {
    if (!isLogging) return;
    
    const log: DebugLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      level,
      category,
      message,
      details
    };
    
    setDebugLogs(prev => [log, ...prev.slice(0, 99)]); // Keep last 100 logs
  };

  // Console monitoring
  useEffect(() => {
    if (!isLogging) return;

    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info
    };

    const captureLog = (level: DebugLog['level'], args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      
      let category: DebugLog['category'] = 'console';
      if (message.includes('[API]') || message.includes('API')) category = 'api';
      else if (message.includes('[Cache]') || message.includes('Cache')) category = 'cache';
      else if (message.includes('[RateLimit]') || message.includes('Rate')) category = 'ratelimit';
      else if (message.includes('[Wallet') || message.includes('Wallet')) category = 'wallet';
      else if (message.includes('[System]') || message.includes('System')) category = 'system';
      
      addLog(level, category, message, args.length > 1 ? args.slice(1) : undefined);
    };

    console.log = (...args) => {
      captureLog('info', args);
      originalConsole.log(...args);
    };

    console.warn = (...args) => {
      captureLog('warn', args);
      originalConsole.warn(...args);
    };

    console.error = (...args) => {
      captureLog('error', args);
      originalConsole.error(...args);
    };

    console.info = (...args) => {
      captureLog('info', args);
      originalConsole.info(...args);
    };

    return () => {
      console.log = originalConsole.log;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      console.info = originalConsole.info;
    };
  }, [isLogging]);

  // Utility functions
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

  const getRateLimitStatus = () => {
    if (!rateLimitInfo?.endpoints) return { hasLimits: false, nearLimits: false };
    
    const hasLimits = Object.values(rateLimitInfo.endpoints).some((info: any) => 
      info.backoffUntil > Date.now()
    );
    
    const nearLimits = Object.values(rateLimitInfo.endpoints).some((info: any) => 
      (info.requestsInWindow / info.maxRequests) > 0.8
    );

    return { hasLimits, nearLimits };
  };

  const getCacheHealth = () => {
    if (!cacheStatus) return { percentage: 0, status: 'Unknown' };
    
    const percentage = (cacheStatus.cachedWallets / cacheStatus.totalWallets) * 100;
    let status = 'Poor';
    if (percentage >= 80) status = 'Excellent';
    else if (percentage >= 60) status = 'Good';
    else if (percentage >= 40) status = 'Fair';
    
    return { percentage, status };
  };

  const handleConfigUpdate = (key: keyof WalletCacheConfig, value: any) => {
    const updated = { ...localConfig, [key]: value };
    setLocalConfig(updated);
    if (onUpdateConfig) {
      onUpdateConfig({ [key]: value });
    }
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(debugLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `debug-logs-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Dragging functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    
    setIsDragging(true);
    const rect = dragRef.current.getBoundingClientRect();
    offsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 400, e.clientX - offsetRef.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 300, e.clientY - offsetRef.current.y))
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Don't render if not visible or wrong page
  if (!isVisible || enabledForPage !== 'wallets') return null;

  const rateLimitStatus = getRateLimitStatus();
  const cacheHealth = getCacheHealth();

  return (
    <div
      ref={dragRef}
      className="fixed z-50 bg-background border border-border rounded-lg shadow-2xl min-w-[350px] max-w-[500px]"
      style={{
        left: position.x,
        top: position.y,
        width: isMinimized ? '200px' : '400px',
        height: isMinimized ? 'auto' : '600px'
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 border-b cursor-move bg-muted/50"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <Bug className="h-4 w-4" />
          <span className="font-medium text-sm">Developer Tools</span>
          <Badge variant="outline" className="text-xs">
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-6 w-6 p-0"
          >
            {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Quick Status Bar */}
      {!isMinimized && (
        <div className="p-2 border-b bg-muted/20">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Badge variant={rateLimitStatus.hasLimits ? "destructive" : rateLimitStatus.nearLimits ? "secondary" : "default"}>
                Rate Limits: {rateLimitStatus.hasLimits ? 'Active' : rateLimitStatus.nearLimits ? 'Near' : 'OK'}
              </Badge>
              <Badge variant={cacheHealth.percentage >= 80 ? "default" : cacheHealth.percentage >= 60 ? "secondary" : "destructive"}>
                Cache: {cacheHealth.status}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsLogging(!isLogging)}
                className="h-6 px-2"
              >
                {isLogging ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!isMinimized && (
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="overview" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4 m-2">
              <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
              <TabsTrigger value="cache" className="text-xs">Cache</TabsTrigger>
              <TabsTrigger value="limits" className="text-xs">Limits</TabsTrigger>
              <TabsTrigger value="logs" className="text-xs">Logs</TabsTrigger>
            </TabsList>
            
            <div className="flex-1 overflow-auto p-2">
              <TabsContent value="overview" className="mt-0 space-y-3">
                {/* System Status */}
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm">System Status</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        {isOnline ? <Wifi className="h-3 w-3 text-green-500" /> : <WifiOff className="h-3 w-3 text-red-500" />}
                        <span>Connection: {isOnline ? 'Online' : 'Offline'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Monitor className="h-3 w-3" />
                        <span>Logging: {isLogging ? 'Active' : 'Inactive'}</span>
                      </div>
                    </div>
                    
                    {(rateLimitStatus.hasLimits || rateLimitStatus.nearLimits) && (
                      <Alert variant={rateLimitStatus.hasLimits ? "destructive" : "default"} className="py-1">
                        <AlertTriangle className="h-3 w-3" />
                        <AlertDescription className="text-xs">
                          {rateLimitStatus.hasLimits 
                            ? 'Rate limits active - using cached data'
                            : 'Approaching rate limits - requests may be delayed'
                          }
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="grid grid-cols-2 gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onRefreshStale}
                        disabled={!onRefreshStale}
                        className="text-xs h-7"
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Refresh
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onCleanupCache}
                        disabled={!onCleanupCache}
                        className="text-xs h-7"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Clean
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => clearRateLimitState()}
                        className="text-xs h-7"
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        Reset Limits
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportLogs}
                        className="text-xs h-7"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Export
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="cache" className="mt-0 space-y-3">
                {cacheStatus && (
                  <>
                    {/* Cache Health */}
                    <Card>
                      <CardContent className="py-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Cache Health</span>
                          <Badge variant={cacheHealth.percentage >= 80 ? "default" : "secondary"}>
                            {cacheHealth.status}
                          </Badge>
                        </div>
                        <Progress value={cacheHealth.percentage} className="h-2" />
                        <div className="text-xs text-muted-foreground mt-1">
                          {cacheStatus.cachedWallets} / {cacheStatus.totalWallets} wallets cached
                        </div>
                      </CardContent>
                    </Card>

                    {/* Storage Usage */}
                    <Card>
                      <CardContent className="py-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Storage</span>
                          <span className="text-xs">{formatBytes(cacheStatus.storageUsage)}</span>
                        </div>
                        <Progress 
                          value={(cacheStatus.storageUsage / localConfig.storageQuotaLimit) * 100} 
                          className="h-2" 
                        />
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>

              <TabsContent value="limits" className="mt-0 space-y-3">
                {rateLimitInfo?.endpoints && Object.entries(rateLimitInfo.endpoints).map(([endpoint, info]: [string, any]) => {
                  const usage = (info.requestsInWindow / info.maxRequests) * 100;
                  const isBackedOff = info.backoffUntil > Date.now();
                  
                  return (
                    <Card key={endpoint}>
                      <CardContent className="py-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{endpoint.toUpperCase()}</span>
                          <Badge variant={isBackedOff ? "destructive" : usage >= 80 ? "secondary" : "default"}>
                            {isBackedOff ? 'WAIT' : usage >= 80 ? 'HIGH' : 'OK'}
                          </Badge>
                        </div>
                        <Progress value={Math.min(usage, 100)} className="h-2" />
                        <div className="text-xs text-muted-foreground mt-1">
                          {info.requestsInWindow} / {info.maxRequests} requests
                          {isBackedOff && (
                            <span className="text-red-600 ml-2">
                              (Cooling down: {Math.ceil((info.backoffUntil - Date.now()) / 1000)}s)
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </TabsContent>

              <TabsContent value="logs" className="mt-0 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Filter:</Label>
                    <select
                      value={filterLevel}
                      onChange={(e) => setFilterLevel(e.target.value as any)}
                      className="text-xs border rounded px-1"
                      aria-label="Filter log level"
                    >
                      <option value="all">All</option>
                      <option value="error">Errors</option>
                      <option value="warn">Warnings</option>
                      <option value="info">Info</option>
                    </select>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDebugLogs([])}
                    className="text-xs h-6"
                  >
                    Clear
                  </Button>
                </div>
                
                <div className="space-y-1 max-h-[300px] overflow-auto">
                  {debugLogs
                    .filter(log => filterLevel === 'all' || log.level === filterLevel)
                    .slice(0, 50)
                    .map(log => (
                      <div key={log.id} className="text-xs p-2 border rounded bg-muted/50">
                        <div className="flex items-center gap-1 mb-1">
                          <Badge 
                            variant={log.level === 'error' ? 'destructive' : log.level === 'warn' ? 'secondary' : 'default'}
                            className="text-xs px-1"
                          >
                            {log.level}
                          </Badge>
                          <Badge variant="outline" className="text-xs px-1">
                            {log.category}
                          </Badge>
                          <span className="text-muted-foreground">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="font-mono text-xs break-all">
                          {log.message}
                        </div>
                      </div>
                    ))}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      )}
    </div>
  );
};

// Toggle button component
export const DeveloperPanelToggle: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <Button
      onClick={onClick}
      variant="outline"
      size="sm"
      className="fixed bottom-4 right-4 z-40 h-8 w-8 p-0 rounded-full shadow-lg"
    >
      <Terminal className="h-4 w-4" />
    </Button>
  );
};

export default UnifiedDeveloperPanel; 

