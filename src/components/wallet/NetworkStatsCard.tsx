
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Box, TrendingUp, Clock, Server } from "lucide-react";
import axios from "axios";

interface NetworkStatsCardProps {
  refreshFlag?: number;
}

interface NetworkStats {
  blockHeight: number;
  hashrate: string;
  nodeVersion: string;
  currentTimeStamp: number;
}

const NetworkStatsCard: React.FC<NetworkStatsCardProps> = ({ refreshFlag = 0 }) => {
  const [stats, setStats] = useState<NetworkStats>({
    blockHeight: 0,
    hashrate: "0",
    nodeVersion: "0.0.0",
    currentTimeStamp: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNetworkStats = async () => {
      setIsLoading(true);
      try {
        // Make API calls to fetch network stats
        const infoResponse = await axios.get("https://backend.mainnet.alephium.org/infos/node");
        const blockchainResponse = await axios.get("https://backend.mainnet.alephium.org/blockflow/blocks/best");
        
        setStats({
          blockHeight: blockchainResponse.data[0]?.height || 0,
          hashrate: formatHashrate(infoResponse.data.blockflow.hashrate || 0),
          nodeVersion: infoResponse.data.version || "Unknown",
          currentTimeStamp: Date.now()
        });
      } catch (error) {
        console.error("Error fetching network stats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchNetworkStats();
    
    // Set up auto-refresh
    const interval = setInterval(fetchNetworkStats, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [refreshFlag]);
  
  const formatHashrate = (hashrate: number): string => {
    if (hashrate >= 1e12) {
      return (hashrate / 1e12).toFixed(2) + " TH/s";
    } else if (hashrate >= 1e9) {
      return (hashrate / 1e9).toFixed(2) + " GH/s";
    } else if (hashrate >= 1e6) {
      return (hashrate / 1e6).toFixed(2) + " MH/s";
    } else if (hashrate >= 1e3) {
      return (hashrate / 1e3).toFixed(2) + " KH/s";
    } else {
      return hashrate.toFixed(2) + " H/s";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Network Statistics</CardTitle>
        <CardDescription>Live Alephium network metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col p-3 rounded-lg bg-muted/40">
            <span className="text-xs text-muted-foreground mb-1 flex items-center">
              <Box className="h-3.5 w-3.5 mr-1" /> 
              Block Height
            </span>
            {isLoading ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <span className="text-lg font-medium">{stats.blockHeight.toLocaleString()}</span>
            )}
          </div>
          
          <div className="flex flex-col p-3 rounded-lg bg-muted/40">
            <span className="text-xs text-muted-foreground mb-1 flex items-center">
              <TrendingUp className="h-3.5 w-3.5 mr-1" /> 
              Network Hashrate
            </span>
            {isLoading ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <span className="text-lg font-medium">{stats.hashrate}</span>
            )}
          </div>
          
          <div className="flex flex-col p-3 rounded-lg bg-muted/40">
            <span className="text-xs text-muted-foreground mb-1 flex items-center">
              <Server className="h-3.5 w-3.5 mr-1" /> 
              Node Version
            </span>
            {isLoading ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <span className="text-lg font-medium">v{stats.nodeVersion}</span>
            )}
          </div>
          
          <div className="flex flex-col p-3 rounded-lg bg-muted/40">
            <span className="text-xs text-muted-foreground mb-1 flex items-center">
              <Clock className="h-3.5 w-3.5 mr-1" /> 
              Last Updated
            </span>
            {isLoading ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <span className="text-lg font-medium">
                {new Date(stats.currentTimeStamp).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NetworkStatsCard;
