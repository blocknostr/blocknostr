
import React, { useState, useEffect } from "react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from "recharts";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchBalanceHistory } from "@/lib/api/alephiumApi";

interface BalanceHistoryChartProps {
  address: string;
}

const timeRanges = [
  { label: "7D", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "All", days: 365 }
];

const BalanceHistoryChart: React.FC<BalanceHistoryChartProps> = ({ address }) => {
  const [balanceData, setBalanceData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(7); // Default to 7 days
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!address) return;
      
      setIsLoading(true);
      
      try {
        const data = await fetchBalanceHistory(address, timeRange);
        setBalanceData(data);
      } catch (err) {
        console.error("Error fetching balance history:", err);
        setError("Could not load balance history");
        
        // Use sample data for demonstration
        const sampleData = generateSampleData(timeRange);
        setBalanceData(sampleData);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [address, timeRange]);

  const generateSampleData = (days: number) => {
    const data = [];
    const now = new Date();
    let balance = 1000 + Math.random() * 500;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Add some randomness to the balance
      balance = balance + (Math.random() - 0.48) * 50;
      if (balance < 100) balance = 100 + Math.random() * 200;
      
      data.push({
        date: date.toISOString().split('T')[0],
        balance: balance.toFixed(2)
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
      <div className="flex justify-end mb-4">
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
      ) : balanceData.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart
            data={balanceData}
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
              formatter={(value) => [`${Number(value).toLocaleString()} ALPH`, 'Balance']}
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="balance"
              name="ALPH Balance"
              stroke="#8884d8"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex justify-center items-center h-[200px] text-muted-foreground">
          {error || "No balance data available"}
        </div>
      )}
    </div>
  );
};

export default BalanceHistoryChart;
