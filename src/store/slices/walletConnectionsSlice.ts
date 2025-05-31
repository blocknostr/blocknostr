import { createSlice, createAsyncThunk, createEntityAdapter, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';

// Connection interfaces
export interface WalletConnection {
  id: string;
  walletAddress: string;
  network: 'Bitcoin' | 'Alephium' | 'Ergo';
  type: 'browser_extension' | 'walletconnect' | 'hardware' | 'mobile' | 'desktop' | 'api';
  name: string;
  icon?: string;
  version?: string;
  // Connection status
  status: 'connected' | 'disconnected' | 'connecting' | 'error' | 'unauthorized';
  isActive: boolean;
  lastConnected: number;
  lastDisconnected?: number;
  connectionDuration: number;
  // Security tracking
  security: {
    isSecure: boolean;
    encryptionLevel: 'none' | 'basic' | 'advanced';
    certificateValid: boolean;
    lastSecurityCheck: number;
    riskLevel: 'low' | 'medium' | 'high';
    securityWarnings: string[];
    permissions: string[];
    trustedDomains: string[];
  };
  // Performance metrics
  performance: {
    latency: number;
    reliability: number; // 0-100 percentage
    uptime: number; // percentage
    errorRate: number; // percentage
    lastResponseTime: number;
    averageResponseTime: number;
    totalRequests: number;
    failedRequests: number;
    successfulRequests: number;
    bandwidthUsage: number; // bytes
  };
  // Connection metadata
  metadata: {
    userAgent?: string;
    platform?: string;
    deviceType?: 'desktop' | 'mobile' | 'tablet';
    browserName?: string;
    browserVersion?: string;
    ipAddress?: string;
    location?: {
      country?: string;
      city?: string;
      timezone?: string;
    };
    sessionId: string;
    connectionMethod: string;
    protocolVersion?: string;
  };
  // Configuration
  config: {
    autoReconnect: boolean;
    reconnectAttempts: number;
    maxReconnectAttempts: number;
    reconnectDelay: number;
    timeout: number;
    keepAlive: boolean;
    keepAliveInterval: number;
    enableNotifications: boolean;
    logLevel: 'none' | 'error' | 'warn' | 'info' | 'debug';
  };
  // Error tracking
  errors: Array<{
    id: string;
    timestamp: number;
    type: 'connection' | 'authentication' | 'network' | 'timeout' | 'security';
    message: string;
    code?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    resolved: boolean;
    resolvedAt?: number;
  }>;
  // Activity tracking
  lastActivity: number;
  activityCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface ConnectionFilter {
  network?: WalletConnection['network'][];
  type?: WalletConnection['type'][];
  status?: WalletConnection['status'][];
  riskLevel?: WalletConnection['security']['riskLevel'][];
  isActive?: boolean;
  minReliability?: number;
  maxLatency?: number;
  searchTerm?: string;
}

export interface ConnectionAnalytics {
  totalConnections: number;
  activeConnections: number;
  connectionsByNetwork: Record<WalletConnection['network'], number>;
  connectionsByType: Record<WalletConnection['type'], number>;
  connectionsByStatus: Record<WalletConnection['status'], number>;
  securityMetrics: {
    secureConnections: number;
    riskDistribution: Record<WalletConnection['security']['riskLevel'], number>;
    totalWarnings: number;
    certificateIssues: number;
  };
  performanceMetrics: {
    averageLatency: number;
    averageReliability: number;
    averageUptime: number;
    totalBandwidth: number;
    errorRate: number;
  };
  activityMetrics: {
    totalRequests: number;
    requestsLast24h: number;
    mostActiveConnection: string | null;
    averageSessionDuration: number;
  };
  timeRangeStats: {
    last24h: { connections: number; requests: number; errors: number };
    last7d: { connections: number; requests: number; errors: number };
    last30d: { connections: number; requests: number; errors: number };
  };
}

export interface ConnectionState {
  entities: Record<string, WalletConnection>;
  ids: string[];
  loading: boolean;
  error: string | null;
  // Active connection management
  activeConnectionId: string | null;
  connectionQueue: string[];
  // Filtering and search
  filters: ConnectionFilter;
  searchResults: string[];
  isSearching: boolean;
  searchTerm: string;
  // Analytics
  analytics: ConnectionAnalytics;
  analyticsLoading: boolean;
  analyticsLastUpdated: number;
  // Real-time monitoring
  monitoringEnabled: boolean;
  monitoringInterval: number;
  lastMonitoringUpdate: number;
  // Security alerts
  securityAlerts: Array<{
    id: string;
    connectionId: string;
    type: 'certificate' | 'encryption' | 'permission' | 'suspicious_activity';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: number;
    acknowledged: boolean;
  }>;
  // Performance tracking
  globalPerformance: {
    averageLatency: number;
    totalBandwidth: number;
    uptime: number;
    lastUpdate: number;
  };
  // Connection history
  connectionHistory: Array<{
    connectionId: string;
    action: 'connected' | 'disconnected' | 'error' | 'timeout';
    timestamp: number;
    metadata?: any;
  }>;
  maxHistoryEntries: number;
}

// Entity adapter for normalized state management
const connectionsAdapter = createEntityAdapter<WalletConnection>({
  selectId: (connection) => connection.id,
  sortComparer: (a, b) => {
    // Sort by active status first, then by last activity
    if (a.isActive !== b.isActive) {
      return a.isActive ? -1 : 1;
    }
    return b.lastActivity - a.lastActivity;
  },
});

// Initial state
const initialState: ConnectionState = connectionsAdapter.getInitialState({
  loading: false,
  error: null,
  activeConnectionId: null,
  connectionQueue: [],
  filters: {},
  searchResults: [],
  isSearching: false,
  searchTerm: '',
  analytics: {
    totalConnections: 0,
    activeConnections: 0,
    connectionsByNetwork: {
      Bitcoin: 0,
      Alephium: 0,
      Ergo: 0,
    },
    connectionsByType: {
      browser_extension: 0,
      walletconnect: 0,
      hardware: 0,
      mobile: 0,
      desktop: 0,
      api: 0,
    },
    connectionsByStatus: {
      connected: 0,
      disconnected: 0,
      connecting: 0,
      error: 0,
      unauthorized: 0,
    },
    securityMetrics: {
      secureConnections: 0,
      riskDistribution: {
        low: 0,
        medium: 0,
        high: 0,
      },
      totalWarnings: 0,
      certificateIssues: 0,
    },
    performanceMetrics: {
      averageLatency: 0,
      averageReliability: 0,
      averageUptime: 0,
      totalBandwidth: 0,
      errorRate: 0,
    },
    activityMetrics: {
      totalRequests: 0,
      requestsLast24h: 0,
      mostActiveConnection: null,
      averageSessionDuration: 0,
    },
    timeRangeStats: {
      last24h: { connections: 0, requests: 0, errors: 0 },
      last7d: { connections: 0, requests: 0, errors: 0 },
      last30d: { connections: 0, requests: 0, errors: 0 },
    },
  },
  analyticsLoading: false,
  analyticsLastUpdated: 0,
  monitoringEnabled: true,
  monitoringInterval: 30000, // 30 seconds
  lastMonitoringUpdate: 0,
  securityAlerts: [],
  globalPerformance: {
    averageLatency: 0,
    totalBandwidth: 0,
    uptime: 0,
    lastUpdate: 0,
  },
  connectionHistory: [],
  maxHistoryEntries: 1000,
});

// Async thunks
export const establishConnection = createAsyncThunk(
  'walletConnections/establishConnection',
  async (params: {
    walletAddress: string;
    network: WalletConnection['network'];
    type: WalletConnection['type'];
    config?: Partial<WalletConnection['config']>;
  }, { rejectWithValue }) => {
    try {
      const { walletAddress, network, type, config = {} } = params;
      
      // Simulate connection establishment
      const connectionId = `${type}_${walletAddress}_${Date.now()}`;
      
      // Default configuration
      const defaultConfig: WalletConnection['config'] = {
        autoReconnect: true,
        reconnectAttempts: 0,
        maxReconnectAttempts: 3,
        reconnectDelay: 5000,
        timeout: 30000,
        keepAlive: true,
        keepAliveInterval: 60000,
        enableNotifications: true,
        logLevel: 'info',
        ...config,
      };

      // Create connection object
      const connection: WalletConnection = {
        id: connectionId,
        walletAddress,
        network,
        type,
        name: getConnectionName(type, network),
        status: 'connecting',
        isActive: false,
        lastConnected: Date.now(),
        connectionDuration: 0,
        security: {
          isSecure: type === 'hardware' || type === 'browser_extension',
          encryptionLevel: type === 'hardware' ? 'advanced' : 'basic',
          certificateValid: true,
          lastSecurityCheck: Date.now(),
          riskLevel: 'low',
          securityWarnings: [],
          permissions: [],
          trustedDomains: [],
        },
        performance: {
          latency: 0,
          reliability: 100,
          uptime: 100,
          errorRate: 0,
          lastResponseTime: 0,
          averageResponseTime: 0,
          totalRequests: 0,
          failedRequests: 0,
          successfulRequests: 0,
          bandwidthUsage: 0,
        },
        metadata: {
          sessionId: generateSessionId(),
          connectionMethod: type,
          deviceType: detectDeviceType(),
          platform: navigator.platform,
          userAgent: navigator.userAgent,
        },
        config: defaultConfig,
        errors: [],
        lastActivity: Date.now(),
        activityCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update connection status
      connection.status = 'connected';
      connection.isActive = true;
      connection.lastConnected = Date.now();

      return connection;
    } catch (error) {
      console.error('Error establishing connection:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Connection failed');
    }
  }
);

export const disconnectConnection = createAsyncThunk(
  'walletConnections/disconnectConnection',
  async (connectionId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const connection = state.walletConnections.entities[connectionId];
      
      if (!connection) {
        throw new Error('Connection not found');
      }

      // Simulate disconnection process
      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        connectionId,
        disconnectedAt: Date.now(),
        duration: Date.now() - connection.lastConnected,
      };
    } catch (error) {
      console.error('Error disconnecting:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Disconnection failed');
    }
  }
);

export const monitorConnections = createAsyncThunk(
  'walletConnections/monitorConnections',
  async (_, { getState }) => {
    const state = getState() as RootState;
    const connections = Object.values(state.walletConnections.entities);
    
    const monitoringResults = await Promise.all(
      connections
        .filter(conn => conn.isActive)
        .map(async (connection) => {
          // Simulate performance monitoring
          const latency = Math.random() * 100 + 50; // 50-150ms
          const reliability = Math.max(0, connection.performance.reliability - Math.random() * 5);
          
          return {
            connectionId: connection.id,
            performance: {
              latency,
              reliability,
              lastResponseTime: Date.now(),
            },
            timestamp: Date.now(),
          };
        })
    );

    return monitoringResults;
  }
);

export const performSecurityCheck = createAsyncThunk(
  'walletConnections/performSecurityCheck',
  async (connectionId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const connection = state.walletConnections.entities[connectionId];
      
      if (!connection) {
        throw new Error('Connection not found');
      }

      // Simulate security check
      await new Promise(resolve => setTimeout(resolve, 2000));

      const securityResults = {
        connectionId,
        isSecure: connection.security.isSecure,
        certificateValid: Math.random() > 0.1, // 90% chance of valid certificate
        riskLevel: Math.random() > 0.8 ? 'medium' : 'low' as WalletConnection['security']['riskLevel'],
        warnings: [] as string[],
        timestamp: Date.now(),
      };

      // Add warnings based on risk assessment
      if (securityResults.riskLevel === 'medium') {
        securityResults.warnings.push('Elevated security risk detected');
      }

      if (!securityResults.certificateValid) {
        securityResults.warnings.push('Certificate validation failed');
        securityResults.riskLevel = 'high';
      }

      return securityResults;
    } catch (error) {
      console.error('Error performing security check:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Security check failed');
    }
  }
);

export const calculateConnectionAnalytics = createAsyncThunk(
  'walletConnections/calculateAnalytics',
  async (_, { getState }) => {
    const state = getState() as RootState;
    const connections = Object.values(state.walletConnections.entities);
    
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    // Basic metrics
    const totalConnections = connections.length;
    const activeConnections = connections.filter(conn => conn.isActive).length;

    // Group by network
    const connectionsByNetwork = connections.reduce((acc, conn) => {
      acc[conn.network] = (acc[conn.network] || 0) + 1;
      return acc;
    }, {} as Record<WalletConnection['network'], number>);

    // Group by type
    const connectionsByType = connections.reduce((acc, conn) => {
      acc[conn.type] = (acc[conn.type] || 0) + 1;
      return acc;
    }, {} as Record<WalletConnection['type'], number>);

    // Group by status
    const connectionsByStatus = connections.reduce((acc, conn) => {
      acc[conn.status] = (acc[conn.status] || 0) + 1;
      return acc;
    }, {} as Record<WalletConnection['status'], number>);

    // Security metrics
    const secureConnections = connections.filter(conn => conn.security.isSecure).length;
    const riskDistribution = connections.reduce((acc, conn) => {
      acc[conn.security.riskLevel] = (acc[conn.security.riskLevel] || 0) + 1;
      return acc;
    }, {} as Record<WalletConnection['security']['riskLevel'], number>);
    
    const totalWarnings = connections.reduce((sum, conn) => 
      sum + conn.security.securityWarnings.length, 0
    );
    
    const certificateIssues = connections.filter(conn => 
      !conn.security.certificateValid
    ).length;

    // Performance metrics
    const averageLatency = connections.length > 0 
      ? connections.reduce((sum, conn) => sum + conn.performance.latency, 0) / connections.length
      : 0;
    
    const averageReliability = connections.length > 0
      ? connections.reduce((sum, conn) => sum + conn.performance.reliability, 0) / connections.length
      : 0;
    
    const averageUptime = connections.length > 0
      ? connections.reduce((sum, conn) => sum + conn.performance.uptime, 0) / connections.length
      : 0;
    
    const totalBandwidth = connections.reduce((sum, conn) => 
      sum + conn.performance.bandwidthUsage, 0
    );
    
    const totalRequests = connections.reduce((sum, conn) => 
      sum + conn.performance.totalRequests, 0
    );
    
    const totalFailedRequests = connections.reduce((sum, conn) => 
      sum + conn.performance.failedRequests, 0
    );
    
    const errorRate = totalRequests > 0 ? (totalFailedRequests / totalRequests) * 100 : 0;

    // Activity metrics
    const requestsLast24h = connections.reduce((sum, conn) => {
      // Estimate requests in last 24h based on activity
      const timeSinceLastActivity = now - conn.lastActivity;
      if (timeSinceLastActivity < day) {
        return sum + Math.floor(conn.performance.totalRequests * 0.1); // Rough estimate
      }
      return sum;
    }, 0);

    const mostActiveConnection = connections.length > 0
      ? connections.reduce((most, conn) => 
          conn.activityCount > most.activityCount ? conn : most
        ).id
      : null;

    const averageSessionDuration = connections.length > 0
      ? connections.reduce((sum, conn) => sum + conn.connectionDuration, 0) / connections.length
      : 0;

    // Time range statistics
    const last24h = {
      connections: connections.filter(conn => conn.createdAt >= now - day).length,
      requests: requestsLast24h,
      errors: connections.reduce((sum, conn) => 
        sum + conn.errors.filter(err => err.timestamp >= now - day).length, 0
      ),
    };

    const last7d = {
      connections: connections.filter(conn => conn.createdAt >= now - 7 * day).length,
      requests: connections.reduce((sum, conn) => sum + conn.performance.totalRequests, 0),
      errors: connections.reduce((sum, conn) => 
        sum + conn.errors.filter(err => err.timestamp >= now - 7 * day).length, 0
      ),
    };

    const last30d = {
      connections: connections.filter(conn => conn.createdAt >= now - 30 * day).length,
      requests: totalRequests,
      errors: connections.reduce((sum, conn) => conn.errors.length, 0),
    };

    return {
      totalConnections,
      activeConnections,
      connectionsByNetwork,
      connectionsByType,
      connectionsByStatus,
      securityMetrics: {
        secureConnections,
        riskDistribution,
        totalWarnings,
        certificateIssues,
      },
      performanceMetrics: {
        averageLatency,
        averageReliability,
        averageUptime,
        totalBandwidth,
        errorRate,
      },
      activityMetrics: {
        totalRequests,
        requestsLast24h,
        mostActiveConnection,
        averageSessionDuration,
      },
      timeRangeStats: {
        last24h,
        last7d,
        last30d,
      },
    };
  }
);

// Helper functions
function getConnectionName(type: WalletConnection['type'], network: WalletConnection['network']): string {
  const typeNames = {
    browser_extension: 'Browser Extension',
    walletconnect: 'WalletConnect',
    hardware: 'Hardware Wallet',
    mobile: 'Mobile Wallet',
    desktop: 'Desktop Wallet',
    api: 'API Connection',
  };
  
  return `${typeNames[type]} (${network})`;
}

function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function detectDeviceType(): 'desktop' | 'mobile' | 'tablet' {
  const userAgent = navigator.userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk/.test(userAgent)) {
    return 'tablet';
  }
  if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/.test(userAgent)) {
    return 'mobile';
  }
  return 'desktop';
}

// Wallet Connections Slice
const walletConnectionsSlice = createSlice({
  name: 'walletConnections',
  initialState,
  reducers: {
    // Connection management
    addConnection: (state, action: PayloadAction<WalletConnection>) => {
      connectionsAdapter.addOne(state, action.payload);
      
      // Add to connection history
      state.connectionHistory.unshift({
        connectionId: action.payload.id,
        action: 'connected',
        timestamp: Date.now(),
        metadata: {
          network: action.payload.network,
          type: action.payload.type,
        },
      });
      
      // Maintain history limit
      if (state.connectionHistory.length > state.maxHistoryEntries) {
        state.connectionHistory = state.connectionHistory.slice(0, state.maxHistoryEntries);
      }
    },

    updateConnection: (state, action: PayloadAction<{ id: string; changes: Partial<WalletConnection> }>) => {
      const { id, changes } = action.payload;
      connectionsAdapter.updateOne(state, { 
        id, 
        changes: { 
          ...changes, 
          updatedAt: Date.now(),
          lastActivity: Date.now(),
        } 
      });
    },

    removeConnection: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const connection = state.entities[id];
      
      connectionsAdapter.removeOne(state, id);
      
      // Add to connection history
      if (connection) {
        state.connectionHistory.unshift({
          connectionId: id,
          action: 'disconnected',
          timestamp: Date.now(),
          metadata: {
            duration: Date.now() - connection.lastConnected,
          },
        });
      }
      
      // Clear active connection if it was removed
      if (state.activeConnectionId === id) {
        state.activeConnectionId = null;
      }
      
      // Remove from queue
      state.connectionQueue = state.connectionQueue.filter(connId => connId !== id);
    },

    // Active connection management
    setActiveConnection: (state, action: PayloadAction<string | null>) => {
      const connectionId = action.payload;
      
      // Deactivate current active connection
      if (state.activeConnectionId) {
        const currentActive = state.entities[state.activeConnectionId];
        if (currentActive) {
          connectionsAdapter.updateOne(state, {
            id: state.activeConnectionId,
            changes: { isActive: false, updatedAt: Date.now() },
          });
        }
      }
      
      // Activate new connection
      if (connectionId && state.entities[connectionId]) {
        connectionsAdapter.updateOne(state, {
          id: connectionId,
          changes: { isActive: true, lastActivity: Date.now(), updatedAt: Date.now() },
        });
      }
      
      state.activeConnectionId = connectionId;
    },

    // Performance tracking
    updatePerformanceMetrics: (state, action: PayloadAction<{
      connectionId: string;
      metrics: Partial<WalletConnection['performance']>;
    }>) => {
      const { connectionId, metrics } = action.payload;
      const connection = state.entities[connectionId];
      
      if (connection) {
        connectionsAdapter.updateOne(state, {
          id: connectionId,
          changes: {
            performance: { ...connection.performance, ...metrics },
            lastActivity: Date.now(),
            updatedAt: Date.now(),
          },
        });
      }
    },

    // Security management
    addSecurityAlert: (state, action: PayloadAction<Omit<ConnectionState['securityAlerts'][0], 'id' | 'timestamp' | 'acknowledged'>>) => {
      const alert = {
        ...action.payload,
        id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        timestamp: Date.now(),
        acknowledged: false,
      };
      
      state.securityAlerts.unshift(alert);
      
      // Keep only last 100 alerts
      if (state.securityAlerts.length > 100) {
        state.securityAlerts = state.securityAlerts.slice(0, 100);
      }
    },

    acknowledgeSecurityAlert: (state, action: PayloadAction<string>) => {
      const alertId = action.payload;
      const alertIndex = state.securityAlerts.findIndex(alert => alert.id === alertId);
      
      if (alertIndex !== -1) {
        state.securityAlerts[alertIndex].acknowledged = true;
      }
    },

    updateSecurityStatus: (state, action: PayloadAction<{
      connectionId: string;
      security: Partial<WalletConnection['security']>;
    }>) => {
      const { connectionId, security } = action.payload;
      const connection = state.entities[connectionId];
      
      if (connection) {
        connectionsAdapter.updateOne(state, {
          id: connectionId,
          changes: {
            security: { ...connection.security, ...security, lastSecurityCheck: Date.now() },
            updatedAt: Date.now(),
          },
        });
      }
    },

    // Error tracking
    addConnectionError: (state, action: PayloadAction<{
      connectionId: string;
      error: Omit<WalletConnection['errors'][0], 'id' | 'timestamp' | 'resolved'>;
    }>) => {
      const { connectionId, error } = action.payload;
      const connection = state.entities[connectionId];
      
      if (connection) {
        const newError = {
          ...error,
          id: `error_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          timestamp: Date.now(),
          resolved: false,
        };
        
        const updatedErrors = [...connection.errors, newError];
        
        connectionsAdapter.updateOne(state, {
          id: connectionId,
          changes: {
            errors: updatedErrors,
            updatedAt: Date.now(),
          },
        });
        
        // Add to connection history
        state.connectionHistory.unshift({
          connectionId,
          action: 'error',
          timestamp: Date.now(),
          metadata: { error: newError },
        });
      }
    },

    resolveConnectionError: (state, action: PayloadAction<{ connectionId: string; errorId: string }>) => {
      const { connectionId, errorId } = action.payload;
      const connection = state.entities[connectionId];
      
      if (connection) {
        const updatedErrors = connection.errors.map(error =>
          error.id === errorId
            ? { ...error, resolved: true, resolvedAt: Date.now() }
            : error
        );
        
        connectionsAdapter.updateOne(state, {
          id: connectionId,
          changes: {
            errors: updatedErrors,
            updatedAt: Date.now(),
          },
        });
      }
    },

    // Filtering and search
    setFilters: (state, action: PayloadAction<Partial<ConnectionFilter>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    clearFilters: (state) => {
      state.filters = {};
      state.searchResults = [];
      state.searchTerm = '';
    },

    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },

    // Monitoring
    setMonitoringEnabled: (state, action: PayloadAction<boolean>) => {
      state.monitoringEnabled = action.payload;
      if (action.payload) {
        state.lastMonitoringUpdate = Date.now();
      }
    },

    setMonitoringInterval: (state, action: PayloadAction<number>) => {
      state.monitoringInterval = action.payload;
    },

    // Global performance
    updateGlobalPerformance: (state, action: PayloadAction<Partial<ConnectionState['globalPerformance']>>) => {
      state.globalPerformance = {
        ...state.globalPerformance,
        ...action.payload,
        lastUpdate: Date.now(),
      };
    },

    // Bulk operations
    clearConnectionHistory: (state) => {
      state.connectionHistory = [];
    },

    clearSecurityAlerts: (state) => {
      state.securityAlerts = [];
    },

    // Error handling
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Establish connection
      .addCase(establishConnection.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(establishConnection.fulfilled, (state, action) => {
        state.loading = false;
        connectionsAdapter.addOne(state, action.payload);
        
        // Set as active if it's the first connection
        if (!state.activeConnectionId) {
          state.activeConnectionId = action.payload.id;
        }
      })
      .addCase(establishConnection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Disconnect connection
      .addCase(disconnectConnection.fulfilled, (state, action) => {
        const { connectionId, disconnectedAt, duration } = action.payload;
        
        connectionsAdapter.updateOne(state, {
          id: connectionId,
          changes: {
            status: 'disconnected',
            isActive: false,
            lastDisconnected: disconnectedAt,
            connectionDuration: duration,
            updatedAt: Date.now(),
          },
        });
        
        // Clear active connection if it was disconnected
        if (state.activeConnectionId === connectionId) {
          state.activeConnectionId = null;
        }
        
        // Add to history
        state.connectionHistory.unshift({
          connectionId,
          action: 'disconnected',
          timestamp: disconnectedAt,
          metadata: { duration },
        });
      })
      
      // Monitor connections
      .addCase(monitorConnections.fulfilled, (state, action) => {
        action.payload.forEach(result => {
          const { connectionId, performance } = result;
          const connection = state.entities[connectionId];
          
          if (connection) {
            connectionsAdapter.updateOne(state, {
              id: connectionId,
              changes: {
                performance: { ...connection.performance, ...performance },
                lastActivity: Date.now(),
                updatedAt: Date.now(),
              },
            });
          }
        });
        
        state.lastMonitoringUpdate = Date.now();
      })
      
      // Security check
      .addCase(performSecurityCheck.fulfilled, (state, action) => {
        const { connectionId, isSecure, certificateValid, riskLevel, warnings } = action.payload;
        const connection = state.entities[connectionId];
        
        if (connection) {
          connectionsAdapter.updateOne(state, {
            id: connectionId,
            changes: {
              security: {
                ...connection.security,
                isSecure,
                certificateValid,
                riskLevel,
                securityWarnings: warnings,
                lastSecurityCheck: Date.now(),
              },
              updatedAt: Date.now(),
            },
          });
          
          // Add security alerts for warnings
          warnings.forEach(warning => {
            state.securityAlerts.unshift({
              id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              connectionId,
              type: 'suspicious_activity',
              severity: riskLevel === 'high' ? 'high' : 'medium',
              message: warning,
              timestamp: Date.now(),
              acknowledged: false,
            });
          });
        }
      })
      
      // Calculate analytics
      .addCase(calculateConnectionAnalytics.pending, (state) => {
        state.analyticsLoading = true;
      })
      .addCase(calculateConnectionAnalytics.fulfilled, (state, action) => {
        state.analyticsLoading = false;
        state.analytics = action.payload;
        state.analyticsLastUpdated = Date.now();
      })
      .addCase(calculateConnectionAnalytics.rejected, (state, action) => {
        state.analyticsLoading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const {
  addConnection,
  updateConnection,
  removeConnection,
  setActiveConnection,
  updatePerformanceMetrics,
  addSecurityAlert,
  acknowledgeSecurityAlert,
  updateSecurityStatus,
  addConnectionError,
  resolveConnectionError,
  setFilters,
  clearFilters,
  setSearchTerm,
  setMonitoringEnabled,
  setMonitoringInterval,
  updateGlobalPerformance,
  clearConnectionHistory,
  clearSecurityAlerts,
  clearError,
} = walletConnectionsSlice.actions;

// Export selectors
export const {
  selectAll: selectAllConnections,
  selectById: selectConnectionById,
  selectIds: selectConnectionIds,
  selectEntities: selectConnectionEntities,
  selectTotal: selectTotalConnections,
} = connectionsAdapter.getSelectors((state: RootState) => state.walletConnections);

// Custom selectors
export const selectActiveConnection = (state: RootState) =>
  state.walletConnections.activeConnectionId
    ? state.walletConnections.entities[state.walletConnections.activeConnectionId]
    : null;

export const selectConnectionsByNetwork = (state: RootState, network: WalletConnection['network']) =>
  selectAllConnections(state).filter(conn => conn.network === network);

export const selectConnectionsByStatus = (state: RootState, status: WalletConnection['status']) =>
  selectAllConnections(state).filter(conn => conn.status === status);

export const selectSecureConnections = (state: RootState) =>
  selectAllConnections(state).filter(conn => conn.security.isSecure);

export const selectHighRiskConnections = (state: RootState) =>
  selectAllConnections(state).filter(conn => conn.security.riskLevel === 'high');

export const selectConnectionAnalytics = (state: RootState) => state.walletConnections.analytics;

export const selectSecurityAlerts = (state: RootState) => state.walletConnections.securityAlerts;

export const selectUnacknowledgedAlerts = (state: RootState) =>
  state.walletConnections.securityAlerts.filter(alert => !alert.acknowledged);

export const selectConnectionHistory = (state: RootState) => state.walletConnections.connectionHistory;

export const selectConnectionLoadingState = (state: RootState) => ({
  loading: state.walletConnections.loading,
  isSearching: state.walletConnections.isSearching,
  analyticsLoading: state.walletConnections.analyticsLoading,
  error: state.walletConnections.error,
});

export const selectGlobalPerformance = (state: RootState) => state.walletConnections.globalPerformance;

export default walletConnectionsSlice.reducer; 

