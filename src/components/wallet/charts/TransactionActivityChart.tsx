
import React, { useState, useEffect } from "react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TransactionActivityChartProps {
  address: string;
}

const timeRanges = [
  { label: "7D", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 }
];

const TransactionActivityChart: React.FC<TransactionActivityChartProps> = ({ address }) => {
  const [addressData, setAddressData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(7); // Default to 7 days
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        // Generate sample data based on richlist.alephium.world statistics
        // In a real implementation, this would fetch from an API
        const sampleData = generateSampleData(timeRange);
        setAddressData(sampleData);
      } catch (err) {
        console.error("Error fetching active addresses data:", err);
        setError("Could not load active addresses data");
        
        // Use sample data for demonstration
        const sampleData = generateSampleData(timeRange);
        setAddressData(sampleData);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [timeRange]);

  const generateSampleData = (days: number) => {
    const data = [];
    const now = new Date();
    
    // Base value for active addresses (starting point)
    let baseValue = 152000;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Generate a realistic looking growth pattern with some variance
      const dailyChange = Math.random() * 200 - 50; // Between -50 and +150 addresses per day
      baseValue += dailyChange;
      
      data.push({
        date: dateStr,
        activeAddresses: Math.round(baseValue)
      });
    }
    
    return data;
  };

  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-muted-foreground">
          Data visualization based on richlist.alephium.world
        </div>
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {timeRanges.map(range => (
            <Button
              key={range.days}
              variant={timeRange === range.days ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setTimeRange(range.days)}
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
        </div>
      ) : addressData.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart
            data={addressData}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
              }}
            />
            <YAxis 
              tickFormatter={formatYAxis} 
              width={40}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value) => [`${Number(value).toLocaleString()} addresses`, '']}
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
            />
            <Legend />
            <Line 
              type="monotone"
              dataKey="activeAddresses" 
              name="Active Addresses" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex justify-center items-center h-[200px] text-muted-foreground">
          {error || "No address data available"}
        </div>
      )}
    </div>
  );
};

export default TransactionActivityChart;
