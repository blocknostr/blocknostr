import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bug,
  Minimize2,
  Maximize2,
  X,
  Trash2,
  Download,
  Play,
  Pause,
  Monitor,
  Wifi,
  WifiOff,
  ChevronUp,
  ChevronDown,
  Terminal,
  Eye,
  EyeOff,
  Settings
} from 'lucide-react';
import { SavedWallet } from '@/api/types/wallet';
import { clearRateLimitState } from '@/api/external/rateLimitedApi';

interface DebugLog {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error';
  category: 'api' | 'cache' | 'ratelimit' | 'wallet' | 'system' | 'console';
  message: string;
  details?: any;
}

interface DebugPanelProps {
  savedWallets: SavedWallet[];
  isOnline: boolean;
  rateLimitInfo?: any;
  cacheStatus?: any;
  onForceRefresh?: (address: string) => Promise<boolean>;
  onRefreshStale?: () => Promise<void>;
  onCleanupCache?: () => void;
  enabledForPage?: 'wallets'; // Strict page binding
}

const FloatingDebugPanel: React.FC<DebugPanelProps> = ({
  savedWallets,
  isOnline,
  rateLimitInfo,
  cacheStatus,
  onForceRefresh,
  onRefreshStale,
  onCleanupCache,
  enabledForPage = 'wallets'
}) => {
  const [isVisible, setIsVisible] = useState(() => {
    return localStorage.getItem('debugPanel_visible') === 'true';
  });
  const [isExpanded, setIsExpanded] = useState(() => {
    return localStorage.getItem('debugPanel_expanded') !== 'false';
  });
  const [isLogging, setIsLogging] = useState(() => {
    return localStorage.getItem('debugPanel_logging') !== 'false';
  });
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [filterLevel, setFilterLevel] = useState<'all' | 'error' | 'warn' | 'info'>('all');
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('debugPanel_position');
    return saved ? JSON.parse(saved) : { x: 20, y: 20 };
  });
  
  const dragRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 0, y: 0 });

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('debugPanel_visible', isVisible.toString());
  }, [isVisible]);

  useEffect(() => {
    localStorage.setItem('debugPanel_expanded', isExpanded.toString());
  }, [isExpanded]);

  useEffect(() => {
    localStorage.setItem('debugPanel_logging', isLogging.toString());
  }, [isLogging]);

  useEffect(() => {
    localStorage.setItem('debugPanel_position', JSON.stringify(position));
  }, [position]);

  // Add debug log entry
  const addLog = useCallback((level: DebugLog['level'], category: DebugLog['category'], message: string, details?: any) => {
    if (!isLogging) return;
    
    const log: DebugLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      level,
      category,
      message,
      details
    };
    
    // Use setTimeout to avoid setState during render
    setTimeout(() => {
      setDebugLogs(prev => [log, ...prev.slice(0, 49)]); // Keep last 50 logs
    }, 0);
  }, [isLogging]);

  // Monitor console for all logs
  useEffect(() => {
    if (!isLogging) return;

    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
      debug: console.debug
    };

    const captureLog = (level: DebugLog['level'], args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      
      // Determine category based on message content
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

    console.debug = (...args) => {
      captureLog('info', args);
      originalConsole.debug(...args);
    };

    return () => {
      console.log = originalConsole.log;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      console.info = originalConsole.info;
      console.debug = originalConsole.debug;
    };
  }, [isLogging, addLog]);

  // Handle dragging
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
        x: Math.max(0, Math.min(window.innerWidth - 350, e.clientX - offsetRef.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 200, e.clientY - offsetRef.current.y))
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

  const filteredLogs = debugLogs.filter(log => 
    filterLevel === 'all' || log.level === filterLevel
  );

  const getLevelColor = (level: DebugLog['level']) => {
    switch (level) {
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      case 'info': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getCategoryIcon = (category: DebugLog['category']) => {
    switch (category) {
      case 'api': return '🌐';
      case 'cache': return '💾';
      case 'ratelimit': return '⏱️';
      case 'wallet': return '💰';
      case 'system': return '🖥️';
      case 'console': return '📝';
      default: return '📋';
    }
  };

  const exportLogs = () => {
    const data = {
      timestamp: new Date().toISOString(),
      logs: debugLogs,
      walletCount: savedWallets.length,
      isOnline
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `console-logs-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Only show in development or when explicitly enabled, and only on the correct page
  const isCurrentPageWallets = () => {
    // Check if we're on the wallets page based on URL
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      return currentPath === '/' || currentPath === '/wallets' || currentPath.includes('wallet');
    }
    return false;
  };

  // Strict checks for showing the debug panel
  const shouldShowPanel = () => {
    // Must be development mode OR explicitly enabled
    const devModeOrEnabled = process.env.NODE_ENV === 'development' || isVisible;
    // Must be on the correct page
    const correctPage = enabledForPage === 'wallets' && isCurrentPageWallets();
    // Must have wallet data (indicates we're actually on wallets page)
    const hasWalletContext = savedWallets && Array.isArray(savedWallets);
    
    // Warn if trying to use on wrong page
    if (enabledForPage === 'wallets' && !isCurrentPageWallets() && devModeOrEnabled) {
      console.warn('[FloatingDebugPanel] This component is intended for WalletsPage only. Current path:', window.location.pathname);
    }
    
    return devModeOrEnabled && correctPage && hasWalletContext;
  };

  if (!shouldShowPanel()) return null;

  return (
    <>
      {/* Toggle Button */}
      {!isVisible && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            size="sm"
            onClick={() => setIsVisible(true)}
            className="rounded-full h-12 w-12 p-0 bg-gray-900/90 hover:bg-gray-800 border border-gray-600"
          >
            <Bug className="h-5 w-5 text-green-400" />
          </Button>
        </div>
      )}

      {/* Floating Debug Panel */}
      {isVisible && (
        <div
          ref={dragRef}
          className={`fixed z-50 bg-gray-900/95 backdrop-blur-sm border border-gray-600 rounded-lg shadow-xl font-mono text-xs text-white ${
            isDragging ? 'cursor-grabbing' : 'cursor-auto'
          }`}
          style={{
            left: position.x,
            top: position.y,
            width: isExpanded ? '400px' : '280px',
            maxHeight: isExpanded ? '500px' : '120px'
          }}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between p-3 bg-gray-800 rounded-t-lg cursor-grab"
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-green-400" />
              <span className="font-bold text-green-400">Console Debug</span>
              <Badge variant="outline" className="text-xs h-5">
                {filteredLogs.length}
              </Badge>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsLogging(!isLogging)}
                className="h-6 w-6 p-0 text-gray-400 hover:text-white"
              >
                {isLogging ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6 p-0 text-gray-400 hover:text-white"
              >
                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsVisible(false)}
                className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Quick Stats (Always Visible) */}
          <div className="p-2 bg-gray-800/50 border-b border-gray-700">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {isOnline ? <Wifi className="h-3 w-3 text-green-400" /> : <WifiOff className="h-3 w-3 text-red-400" />}
                  <span>{isOnline ? 'Online' : 'Offline'}</span>
                </div>
                <div>Wallets: {savedWallets.length}</div>
                <div className={isLogging ? 'text-green-400' : 'text-gray-500'}>
                  Logging: {isLogging ? 'ON' : 'OFF'}
                </div>
              </div>
              <div className="text-gray-400">
                {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>

          {/* Expanded Content */}
          {isExpanded && (
            <>
              {/* Controls */}
              <div className="p-2 bg-gray-800/30 border-b border-gray-700">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <select
                      value={filterLevel}
                      onChange={(e) => setFilterLevel(e.target.value as any)}
                      className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs"
                      aria-label="Filter log level"
                      title="Filter logs by level"
                    >
                      <option value="all">All</option>
                      <option value="error">Errors</option>
                      <option value="warn">Warnings</option>
                      <option value="info">Info</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDebugLogs([])}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={exportLogs}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Console Logs */}
              <div className="p-2 max-h-80 overflow-y-auto space-y-1">
                {filteredLogs.length === 0 ? (
                  <div className="text-gray-500 text-center py-4">
                    {isLogging ? 'No logs captured yet' : 'Logging is disabled'}
                  </div>
                ) : (
                  filteredLogs.map(log => (
                    <div key={log.id} className="bg-gray-800/50 rounded p-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getCategoryIcon(log.category)}</span>
                          <span className={`font-bold ${getLevelColor(log.level)}`}>
                            {log.level.toUpperCase()}
                          </span>
                          <Badge variant="outline" className="text-xs h-4 px-1">
                            {log.category}
                          </Badge>
                        </div>
                        <span className="text-gray-500 text-xs">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-gray-300 text-xs break-all">
                        {log.message}
                      </div>
                      {log.details && (
                        <details className="text-gray-400 text-xs">
                          <summary className="cursor-pointer">Details</summary>
                          <pre className="mt-1 bg-gray-900 p-1 rounded overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default FloatingDebugPanel; 

