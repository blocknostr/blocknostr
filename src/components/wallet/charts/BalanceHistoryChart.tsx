
import React, { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Mock data for the chart - in a real app, this would come from an API
interface HistoryDataPoint {
  date: string;
  balance: number;
}

// Convert a Date object to an ISO string date component (YYYY-MM-DD)
const formatDateForKey = (date: Date) => {
  return date.toISOString().split('T')[0];
};

interface BalanceHistoryChartProps {
  address: string;
  refreshFlag?: number; // Add refreshFlag prop to trigger refreshes
}

const BalanceHistoryChart: React.FC<BalanceHistoryChartProps> = ({ address, refreshFlag = 0 }) => {
  const [historyData, setHistoryData] = useState<HistoryDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  // Function to generate mock history data - would be replaced with API call
  const generateHistoryData = () => {
    const today = new Date();
    const data: HistoryDataPoint[] = [];
    
    // Generate 30 days of data
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateStr = formatDateForKey(date);
      
      // Generate a somewhat realistic price curve with some randomness
      // Base value around 100 ALPH with range of ±20
      const baseValue = 100;
      const randomFactor = Math.sin(i * 0.3) * 15 + (Math.random() * 10 - 5);
      const balance = baseValue + randomFactor;
      
      data.push({
        date: dateStr,
        balance: parseFloat(balance.toFixed(2))
      });
    }
    
    return data;
  };

  // Fetch or generate chart data
  const fetchChartData = async () => {
    setLoading(true);
    
    try {
      // In a real implementation, this would be an API call
      // const response = await fetch(`/api/wallet/${address}/history`);
      // const data = await response.json();
      
      // For now, we'll use generated mock data
      const mockData = generateHistoryData();
      
      // Simulate network delay for better UX testing
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setHistoryData(mockData);
    } catch (error) {
      console.error('Error fetching balance history:', error);
      // Fallback to empty data on error
      setHistoryData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount and when address changes
  useEffect(() => {
    fetchChartData();
  }, [address]);
  
  // Refresh data when refreshFlag changes
  useEffect(() => {
    if (refreshFlag > 0) {
      fetchChartData();
    }
  }, [refreshFlag]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      fetchChartData();
      console.log("Auto-refreshing chart data");
    }, 5 * 60 * 1000); // 5 minutes in milliseconds

    return () => clearInterval(refreshInterval); // Cleanup on unmount
  }, []);

  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = new Date(label);
      const formattedDate = date.toLocaleDateString(undefined, { 
        month: 'long', 
        day: 'numeric',
        year: 'numeric'
      });
      
      return (
        <div className="p-2 bg-background border rounded shadow-sm text-sm">
          <p className="font-medium">{formattedDate}</p>
          <p className="text-primary">
            {payload[0].value.toFixed(2)} ALPH
          </p>
        </div>
      );
    }
    
    return null;
  };

  if (loading) {
    return <Skeleton className="h-[250px] w-full" />;
  }

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={historyData}
          margin={{
            top: 5,
            right: 5,
            left: 5,
            bottom: 5,
          }}
        >
          <defs>
            <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="date" 
            tickFormatter={formatXAxis} 
            tickCount={6} 
            axisLine={false}
            tickLine={false}
            stroke="hsl(var(--muted-foreground))" 
            fontSize={10}
          />
          <YAxis 
            hide={true}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="balance" 
            stroke="hsl(var(--primary))" 
            fillOpacity={1}
            fill="url(#balanceGradient)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BalanceHistoryChart;
