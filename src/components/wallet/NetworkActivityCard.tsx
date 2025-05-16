
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Network, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface NetworkActivityData {
  transactionsLast24h: number;
  activeNodes: number;
  averageTps: number;
}

const NetworkActivityCard: React.FC<{ className?: string }> = ({ className = "" }) => {
  // Fetch network activity data
  const { data, isLoading } = useQuery({
    queryKey: ['network-activity'],
    queryFn: async (): Promise<NetworkActivityData> => {
      // In a real app, this would fetch from a real API
      // Currently using mock data based on references
      return {
        transactionsLast24h: 42582,
        activeNodes: 324,
        averageTps: 8.2
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <Card className={`bg-gradient-to-br from-indigo-500/10 via-indigo-400/5 to-background ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4 text-indigo-500" />
          <span>Network Activity</span>
        </CardTitle>
        <CardDescription className="text-xs">Last 24 hours</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <Activity className="h-4 w-4 text-indigo-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Transactions</p>
                <p className="text-base font-medium">
                  {isLoading ? "..." : data?.transactionsLast24h.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">24h</div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Network className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active Nodes</p>
                <p className="text-base font-medium">
                  {isLoading ? "..." : data?.activeNodes}
                </p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">Global</div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg TPS</p>
                <p className="text-base font-medium">
                  {isLoading ? "..." : data?.averageTps}
                </p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">Current</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NetworkActivityCard;
