
import React, { useState, useEffect } from "react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from "recharts";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { fetchBalanceHistory } from "@/lib/api/alephiumApi";
import { getAlephiumPriceHistory, getAlephiumPrice } from "@/lib/api/coingeckoApi";
import { formatCurrency } from "@/lib/utils/formatters";

interface BalanceHistoryChartProps {
  address: string;
}

interface BalanceData {
  date: string;
  balance: number;
  usdValue?: number;
}

const timeRanges = [
  { label: "7D", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "All", days: 365 }
];

const BalanceHistoryChart: React.FC<BalanceHistoryChartProps> = ({ address }) => {
  const [balanceData, setBalanceData] = useState<BalanceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(7); // Default to 7 days
  const [error, setError] = useState<string | null>(null);
  const [showUsd, setShowUsd] = useState(true);
  const [currentPrice, setCurrentPrice] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!address) return;
      
      setIsLoading(true);
      
      try {
        // Fetch both balance history and price history
        const [balanceHistory, priceHistory, currentPriceData] = await Promise.all([
          fetchBalanceHistory(address, timeRange),
          getAlephiumPriceHistory(timeRange),
          getAlephiumPrice()
        ]);
        
        setCurrentPrice(currentPriceData.price);
        
        // Create a map of timestamps to prices for quick lookups
        const priceMap = new Map(
          priceHistory.map(item => [new Date(item.timestamp).toISOString().split('T')[0], item.price])
        );
        
        // Combine balance and price data
        const combinedData = balanceHistory.map(item => {
          const date = item.date;
          const price = priceMap.get(date) || currentPriceData.price;
          
          return {
            ...item,
            usdValue: item.balance * price
          };
        });
        
        setBalanceData(combinedData);
        setError(null);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Could not load balance history");
        
        // Use sample data for demonstration
        const sampleData = generateSampleData(timeRange, currentPrice);
        setBalanceData(sampleData);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [address, timeRange]);

  const generateSampleData = (days: number, price: number) => {
    const data: BalanceData[] = [];
    const now = new Date();
    let balance = 1000 + Math.random() * 500;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Add some randomness to the balance
      balance = balance + (Math.random() - 0.48) * 50;
      if (balance < 100) balance = 100 + Math.random() * 200;
      
      const dateStr = date.toISOString().split('T')[0];
      
      data.push({
        date: dateStr,
        balance: parseFloat(balance.toFixed(2)),
        usdValue: parseFloat((balance * price).toFixed(2))
      });
    }
    
    return data;
  };

  const formatYAxis = (value: number) => {
    if (showUsd) {
      if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
      return `$${value.toFixed(0)}`;
    } else {
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
      return value.toString();
    }
  };

  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-4">
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
        
        <Toggle
          pressed={showUsd}
          onPressedChange={setShowUsd}
          size="sm"
          className="h-7 px-3 text-xs flex items-center gap-1"
        >
          {showUsd ? "USD" : "ALPH"}
        </Toggle>
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
              domain={['dataMin', 'dataMax']}
            />
            <Tooltip 
              formatter={(value, name) => {
                if (name === "Balance") {
                  return [`${Number(value).toLocaleString()} ALPH`, showUsd ? "ALPH Balance" : "Balance"];
                }
                return [formatCurrency(Number(value)), "USD Value"];
              }}
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
            />
            <Legend />
            {!showUsd && (
              <Line
                type="monotone"
                dataKey="balance"
                name="Balance"
                stroke="#8884d8"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            )}
            {showUsd && (
              <Line
                type="monotone"
                dataKey="usdValue"
                name="USD Value"
                stroke="#82ca9d"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            )}
            {balanceData.length > 1 && (
              <ReferenceLine 
                y={showUsd ? balanceData[balanceData.length-1].usdValue : balanceData[balanceData.length-1].balance}
                stroke="#ff7300"
                strokeDasharray="3 3"
              />
            )}
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
