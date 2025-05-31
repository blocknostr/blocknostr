import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Activity, Network, WifiOff, Hash, Database, Clock, Blocks, Server, Wifi } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { fetchNetworkStats } from "@/api/external/alephiumApi";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NetworkStats {
  hashRate: string;
  difficulty: string;
  blockTime: string;
  activeAddresses: number;
  totalTransactions: string;
  totalSupply: string;
  totalBlocks: string;
  latestBlocks: Array<{
    hash: string;
    timestamp: number;
    height: number;
    txNumber: number;
  }>;
  isLiveData?: boolean;
}

interface UnifiedNetworkCardProps {
  className?: string;
  updateApiStatus?: (isLive: boolean) => void;
}

// Generate activity data for the chart
const generateActivityData = () => {
  const data = [];
  const now = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  let baseAddresses = 180000;
  
  for (let date = new Date(startDate); date <= now; date.setDate(date.getDate() + 1)) {
    const dailyGrowth = Math.floor(Math.random() * 300) + 100;
    baseAddresses += dailyGrowth;
    
    data.push({
      date: date.toISOString().split('T')[0],
      addresses: baseAddresses
    });
  }

  return data;
};

const UnifiedNetworkCard: React.FC<UnifiedNetworkCardProps> = ({ className = "", updateApiStatus }) => {
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [dataStatus, setDataStatus] = useState<'live' | 'fallback' | 'simulated'>('simulated');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch network stats
        const networkStats = await fetchNetworkStats();
        setStats(networkStats);
        
        // Generate activity data (this would come from API in production)
        const activity = generateActivityData();
        setActivityData(activity);
        
        // Determine overall data status
        if (networkStats.isLiveData !== false) {
          setDataStatus('live');
        } else {
          setDataStatus('fallback');
        }
        
        setLastUpdated(new Date());
        
        // Update parent component with API status
        if (updateApiStatus) {
          updateApiStatus(networkStats.isLiveData !== false);
        }
      } catch (error) {
        console.error("Error fetching network data:", error);
        
        // Fallback data
        const fallbackStats = {
          hashRate: "38.2 PH/s",
          difficulty: "3.51 P",
          blockTime: "64.0s",
          activeAddresses: 193500,
          totalTransactions: "4.28M",
          totalSupply: "110.06M ALPH",
          totalBlocks: "3.75M",
          isLiveData: false,
          latestBlocks: [
            { hash: "0xa1b2c3...", timestamp: Date.now() - 60000, height: 3752480, txNumber: 5 },
            { hash: "0xd4e5f6...", timestamp: Date.now() - 120000, height: 3752479, txNumber: 3 },
            { hash: "0x789012...", timestamp: Date.now() - 180000, height: 3752478, txNumber: 7 }
          ]
        };
        
        setStats(fallbackStats);
        setActivityData(generateActivityData());
        setDataStatus('simulated');
        
        if (updateApiStatus) {
          updateApiStatus(false);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    
    // Refresh data every 2 minutes
    const intervalId = setInterval(fetchData, 120000);
    
    return () => clearInterval(intervalId);
  }, [updateApiStatus]);

  const formatTimestamp = (timestamp: number): string => {
    const now = Date.now();
    const diffSeconds = Math.floor((now - timestamp) / 1000);
    
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    return `${Math.floor(diffSeconds / 3600)}h ago`;
  };

  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toString();
  };

  const getStatusInfo = () => {
    switch (dataStatus) {
      case 'live':
        return {
          icon: <div className="w-1.5 h-1.5 bg-green-600 dark:bg-green-400 rounded-full animate-pulse" />,
          text: 'Live Data',
          className: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400'
        };
      case 'fallback':
        return {
          icon: <WifiOff className="h-3 w-3" />,
          text: 'Fallback Data',
          className: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400'
        };
      default:
        return {
          icon: <WifiOff className="h-3 w-3" />,
          text: 'Simulated Data',
          className: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Alephium Network</CardTitle>
              <CardDescription>Blockchain statistics and network activity</CardDescription>
            </div>
          </div>
          
          {!isLoading && (
            <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${statusInfo.className}`}>
              {statusInfo.icon}
              <span>{statusInfo.text}</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
          </div>
        ) : (
          <div className="space-y-6">
            {dataStatus !== 'live' && (
              <Alert variant="warning">
                <AlertDescription className="text-xs flex items-center gap-1.5">
                  <WifiOff className="h-3.5 w-3.5" />
                  <span>
                    {dataStatus === 'fallback' 
                      ? 'Unable to connect to Alephium Explorer API. Using fallback data.'
                      : 'Using simulated data for demonstration purposes.'
                    }
                  </span>
                </AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="stats" className="w-full">
              <TabsList className="grid grid-cols-2 max-w-sm">
                <TabsTrigger value="stats" className="flex items-center gap-2">
                  <Database className="h-3 w-3" />
                  <span>Statistics</span>
                </TabsTrigger>
                <TabsTrigger value="activity" className="flex items-center gap-2">
                  <Activity className="h-3 w-3" />
                  <span>Activity</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="stats" className="mt-4 space-y-4">
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1 flex items-start">
                    <Activity className="h-4 w-4 mr-2 mt-1 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Transactions</p>
                      <p className="text-lg font-medium">{stats?.totalTransactions}</p>
                    </div>
                  </div>
                  <div className="space-y-1 flex items-start">
                    <Hash className="h-4 w-4 mr-2 mt-1 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Hash Rate</p>
                      <p className="text-lg font-medium">{stats?.hashRate}</p>
                    </div>
                  </div>
                  <div className="space-y-1 flex items-start">
                    <Database className="h-4 w-4 mr-2 mt-1 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Supply</p>
                      <p className="text-lg font-medium">{stats?.totalSupply}</p>
                    </div>
                  </div>
                  <div className="space-y-1 flex items-start">
                    <Blocks className="h-4 w-4 mr-2 mt-1 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Blocks</p>
                      <p className="text-lg font-medium">{stats?.totalBlocks}</p>
                    </div>
                  </div>
                  <div className="space-y-1 flex items-start">
                    <Clock className="h-4 w-4 mr-2 mt-1 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Block Time</p>
                      <p className="text-lg font-medium">{stats?.blockTime}</p>
                    </div>
                  </div>
                  <div className="space-y-1 flex items-start">
                    <Server className="h-4 w-4 mr-2 mt-1 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Active Addresses</p>
                      <p className="text-lg font-medium">{stats?.activeAddresses.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Latest Blocks */}
                {stats?.latestBlocks && stats.latestBlocks.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                      <Blocks className="h-4 w-4 text-primary" />
                      Latest Blocks
                    </h4>
                    <div className="space-y-2 bg-muted/40 rounded-md p-2">
                      {stats.latestBlocks.map((block, idx) => (
                        <div key={idx} className="flex justify-between text-sm border-b last:border-0 border-muted pb-1 last:pb-0">
                          <div className="flex items-center">
                            <span className="font-medium">#{block.height}</span>
                            <span className="ml-2 text-xs text-muted-foreground truncate max-w-[100px]">{block.hash}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-1.5 py-0.5 bg-primary/10 rounded">{block.txNumber} tx</span>
                            <span className="text-xs text-muted-foreground">{formatTimestamp(block.timestamp)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="activity" className="mt-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                      <Activity className="h-4 w-4 text-primary" />
                      Network Growth - Active Addresses (30 days)
                    </h4>
                    <div className="h-[240px] bg-muted/20 rounded-lg p-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={activityData}
                          margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(date) => {
                              const d = new Date(date);
                              return `${d.getDate()}/${d.getMonth() + 1}`;
                            }}
                            tick={{ fontSize: 12 }}
                            tickMargin={10}
                            tickCount={7}
                          />
                          <YAxis 
                            tickFormatter={formatYAxis}
                            tick={{ fontSize: 12 }}
                            tickMargin={5}
                            width={40}
                          />
                          <Tooltip 
                            formatter={(value: number) => [`${value.toLocaleString()} addresses`, 'Active Addresses']}
                            labelFormatter={(date) => {
                              const d = new Date(date);
                              return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="addresses" 
                            stroke="hsl(var(--primary))" 
                            fill="hsl(var(--primary) / 0.2)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Footer */}
            <div className="pt-2 flex justify-between items-center text-xs text-muted-foreground border-t">
              <a 
                href="https://explorer.alephium.org/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                View more on Explorer
                <Network className="h-3.5 w-3.5" />
              </a>
              
              <div className="flex items-center gap-1">
                <Wifi className={`h-3 w-3 ${dataStatus === 'live' ? 'text-green-500' : 'text-amber-500'}`} />
                <span>Updated: {lastUpdated.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UnifiedNetworkCard; 

