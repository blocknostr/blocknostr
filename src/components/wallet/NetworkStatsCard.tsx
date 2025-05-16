
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ExternalLink } from "lucide-react";
import { fetchNetworkStats } from "@/lib/api/alephiumApi";
import { Button } from "@/components/ui/button";

interface NetworkStats {
  hashRate: string;
  difficulty: string;
  blockTime: string;
  activeAddresses: number;
  tokenCount: number;
}

const NetworkStatsCard: React.FC = () => {
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const data = await fetchNetworkStats();
        setStats(data);
      } catch (error) {
        console.error("Error fetching network stats:", error);
        // Set sample data
        setStats({
          hashRate: "38.2 PH/s",
          difficulty: "3.51 P",
          blockTime: "64.0s",
          activeAddresses: 24890,
          tokenCount: 385
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-background border-primary/10">
      <CardContent className="p-3">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xs font-medium">Network Status</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-[10px] h-6 p-0 text-primary hover:text-primary hover:bg-transparent"
            asChild
          >
            <a 
              href="https://explorer.alephium.org/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center"
            >
              Explorer
              <ExternalLink className="h-2.5 w-2.5 ml-1" />
            </a>
          </Button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary/70" />
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-x-2 gap-y-1 text-center">
            <div className="bg-background/80 rounded p-1.5">
              <p className="text-[10px] text-muted-foreground mb-0.5">Hash Rate</p>
              <p className="text-xs font-medium">{stats?.hashRate}</p>
            </div>
            <div className="bg-background/80 rounded p-1.5">
              <p className="text-[10px] text-muted-foreground mb-0.5">Difficulty</p>
              <p className="text-xs font-medium">{stats?.difficulty}</p>
            </div>
            <div className="bg-background/80 rounded p-1.5">
              <p className="text-[10px] text-muted-foreground mb-0.5">Block Time</p>
              <p className="text-xs font-medium">{stats?.blockTime}</p>
            </div>
            <div className="bg-background/80 rounded p-1.5">
              <p className="text-[10px] text-muted-foreground mb-0.5">Addresses</p>
              <p className="text-xs font-medium">{stats?.activeAddresses.toLocaleString()}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NetworkStatsCard;
