
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Activity, Network } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Sample data for the network activity (in production, this would come from an API)
const generateActivityData = () => {
  const data = [];
  const now = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  let baseAddresses = 180000;
  
  for (let date = new Date(startDate); date <= now; date.setDate(date.getDate() + 1)) {
    // Realistic growth pattern with some randomness
    const dailyGrowth = Math.floor(Math.random() * 300) + 100; // 100-400 new addresses per day
    baseAddresses += dailyGrowth;
    
    data.push({
      date: date.toISOString().split('T')[0],
      addresses: baseAddresses
    });
  }

  return data;
};

interface NetworkActivityCardProps {
  className?: string;
}

const NetworkActivityCard: React.FC<NetworkActivityCardProps> = ({ className = "" }) => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API fetch
    const fetchData = () => {
      setIsLoading(true);
      // In a real implementation, this would be an API call
      setTimeout(() => {
        const activityData = generateActivityData();
        setData(activityData);
        setIsLoading(false);
      }, 800);
    };

    fetchData();
  }, []);

  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value.toString();
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Network Activity
        </CardTitle>
        <CardDescription>Growing number of active addresses on the Alephium network</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-[280px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
          </div>
        ) : (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
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
        )}
        <div className="mt-4 text-sm text-muted-foreground">
          <p className="flex items-center gap-1">
            <Network className="h-4 w-4 text-primary" />
            <span>Data is simulated. In production, this would use real data from the Alephium Explorer API.</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default NetworkActivityCard;
