
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Hash, Database, Activity, Clock, Blocks, Network, Server, WifiOff } from "lucide-react";
import { fetchNetworkStats } from "@/lib/api/alephiumApi";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface NetworkStats {
  hashRate: string;
  difficulty: string;
  blockTime: string;
  activeAddresses: number;
  tokenCount: number;
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

interface NetworkStatsCardProps {
  className?: string;
}

const NetworkStatsCard: React.FC<NetworkStatsCardProps> = ({ className = "" }) => {
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const data = await fetchNetworkStats();
        setStats(data);
        setLastUpdated(new Date());
      } catch (error) {
        console.error("Error fetching network stats:", error);
        // Set updated sample data
        setStats({
          hashRate: "38.2 PH/s",
          difficulty: "3.51 P",
          blockTime: "64.0s",
          activeAddresses: 193500,
          tokenCount: 385,
          totalTransactions: "4.28M",
          totalSupply: "110.06M ALPH",
          totalBlocks: "3.75M",
          isLiveData: false,
          latestBlocks: [
            { hash: "0xa1b2c3...", timestamp: Date.now() - 60000, height: 3752480, txNumber: 5 },
            { hash: "0xd4e5f6...", timestamp: Date.now() - 120000, height: 3752479, txNumber: 3 },
            { hash: "0x789012...", timestamp: Date.now() - 180000, height: 3752478, txNumber: 7 }
          ]
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
    
    // Refresh data every 2 minutes
    const intervalId = setInterval(fetchStats, 120000);
    
    return () => clearInterval(intervalId);
  }, []);

  const formatTimestamp = (timestamp: number): string => {
    const now = Date.now();
    const diffSeconds = Math.floor((now - timestamp) / 1000);
    
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    return `${Math.floor(diffSeconds / 3600)}h ago`;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Network Statistics</CardTitle>
              <CardDescription>Current Alephium blockchain metrics from explorer.alephium.org</CardDescription>
            </div>
          </div>
          
          {!isLoading && stats && (
            <div className="flex items-center gap-2">
              {stats.isLiveData !== false ? (
                <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full">
                  <div className="w-1.5 h-1.5 bg-green-600 dark:bg-green-400 rounded-full animate-pulse" />
                  <span>Live Data</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded-full">
                  <WifiOff className="h-3 w-3" />
                  <span>Fallback Data</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-[180px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
          </div>
        ) : (
          <div className="space-y-6">
            {stats?.isLiveData === false && (
              <Alert variant="warning" className="mb-4">
                <AlertDescription className="text-xs flex items-center gap-1.5">
                  <WifiOff className="h-3.5 w-3.5" />
                  <span>Unable to connect to Alephium Explorer API. Using fallback data.</span>
                </AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <div className="space-y-1 flex items-start">
                <Database className="h-4 w-4 mr-2 mt-1 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Token Types</p>
                  <p className="text-lg font-medium">{stats?.tokenCount}</p>
                </div>
              </div>
              <div className="space-y-1 flex items-start">
                <Hash className="h-4 w-4 mr-2 mt-1 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Difficulty</p>
                  <p className="text-lg font-medium">{stats?.difficulty}</p>
                </div>
              </div>
            </div>
            
            {stats?.latestBlocks && stats.latestBlocks.length > 0 && (
              <div className="mt-4">
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
            
            <div className="pt-2 flex justify-between items-center">
              <a 
                href="https://explorer.alephium.org/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                View more on Explorer
                <Network className="h-3.5 w-3.5" />
              </a>
              
              <div className="text-xs text-muted-foreground">
                Updated: {lastUpdated.toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NetworkStatsCard;
