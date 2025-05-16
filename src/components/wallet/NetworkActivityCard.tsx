
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRightLeft, Clock, TrendingUp } from "lucide-react";
import axios from "axios";

interface NetworkActivityCardProps {
  refreshFlag?: number;
}

interface ActivityStats {
  txCountLast24h: number;
  avgBlockTimeMinutes: number;
  tpsAverage: number;
  lastUpdated: Date;
}

const NetworkActivityCard: React.FC<NetworkActivityCardProps> = ({ refreshFlag = 0 }) => {
  const [stats, setStats] = useState<ActivityStats>({
    txCountLast24h: 0,
    avgBlockTimeMinutes: 0,
    tpsAverage: 0,
    lastUpdated: new Date()
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNetworkActivity = async () => {
      setIsLoading(true);
      try {
        // In a real implementation, you would call an API that provides this data
        // For now, we'll use placeholder values
        
        // Mock API call (simulating real data)
        // const response = await axios.get("https://api.alephium.org/v1/stats/recent");
        
        // For demo purposes, we'll use simulated data
        const mockData = {
          txCount24h: Math.floor(10000 + Math.random() * 5000),
          avgBlockTime: 60 + Math.random() * 10, // Seconds
          tps: 4 + Math.random() * 2
        };
        
        setStats({
          txCountLast24h: mockData.txCount24h,
          avgBlockTimeMinutes: parseFloat((mockData.avgBlockTime / 60).toFixed(2)),
          tpsAverage: parseFloat(mockData.tps.toFixed(2)),
          lastUpdated: new Date()
        });
      } catch (error) {
        console.error("Error fetching network activity:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchNetworkActivity();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchNetworkActivity, 30000);
    
    return () => clearInterval(interval);
  }, [refreshFlag]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Network Activity</CardTitle>
        <CardDescription>Recent blockchain performance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-full">
                <ArrowRightLeft className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm">Transactions (24h)</span>
            </div>
            {isLoading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <span className="font-medium">{stats.txCountLast24h.toLocaleString()}</span>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-full">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm">Avg Block Time</span>
            </div>
            {isLoading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <span className="font-medium">{stats.avgBlockTimeMinutes} min</span>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-full">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm">Transactions/sec</span>
            </div>
            {isLoading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <span className="font-medium">{stats.tpsAverage}</span>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground mt-4">
            Last updated: {stats.lastUpdated.toLocaleTimeString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default NetworkActivityCard;
