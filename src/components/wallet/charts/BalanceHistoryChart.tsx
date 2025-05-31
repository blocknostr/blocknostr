import React, { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchBalanceHistory } from "@/api/external/alephiumApi";

// Real data interface matching the API
interface HistoryDataPoint {
  date: string;
  balance: number;
  timestamp: number;
  source: 'api' | 'calculated' | 'estimated';
}

// Convert a Date object to an ISO string date component (YYYY-MM-DD)
const formatDateForKey = (date: Date) => {
  return date.toISOString().split('T')[0];
};

interface BalanceHistoryChartProps {
  address: string;
  refreshFlag?: number; // Add refreshFlag prop to trigger refreshes
  alphPrice?: number; // Current ALPH price for enhanced display
  showPrice?: boolean; // Whether to show price information
  days?: number; // Configurable number of days to show (default: 30)
}

const BalanceHistoryChart: React.FC<BalanceHistoryChartProps> = ({ 
  address, 
  refreshFlag = 0, 
  alphPrice = 0, 
  showPrice = false,
  days = 30
}) => {
  const [historyData, setHistoryData] = useState<HistoryDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<'api' | 'calculated' | 'estimated'>('estimated');
  const [error, setError] = useState<string | null>(null);

  // Fetch real chart data using the new API
  const fetchChartData = async () => {
    // ✅ CRITICAL FIX: Validate address before making API calls
    if (!address || address.trim() === '') {
      console.error('[BalanceHistoryChart] Empty address provided');
      setError('No wallet address provided');
      setLoading(false);
      return;
    }
    
    // ✅ FIX: More flexible address validation for Alephium (match alephiumApi)
    if (address.length < 44 || address.length > 58) {
      console.error('[BalanceHistoryChart] Invalid address length:', address, 'Length:', address.length);
      setError('Invalid wallet address format');
      setLoading(false);
      return;
    }
    
    if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(address)) {
      console.error('[BalanceHistoryChart] Invalid address characters:', address);
      setError('Invalid wallet address format');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log(`[BalanceHistoryChart] Fetching ${days} days of data for ${address.slice(0, 8)}...`);
      
      // Use the new real API
      const data = await fetchBalanceHistory(address, days);
      
      if (data && data.length > 0) {
        setHistoryData(data);
        setDataSource(data[0].source); // Use the source from the first data point
        console.log(`[BalanceHistoryChart] ✅ Loaded ${data.length} data points from ${data[0].source} source`);
      } else {
        throw new Error('No data returned from API');
      }
    } catch (error: any) {
      console.error('[BalanceHistoryChart] Error fetching balance history:', error);
      setError(error.message || 'Failed to load balance history');
      setHistoryData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount and when address or days changes
  useEffect(() => {
    // ✅ SKIP: Don't fetch if address is invalid (updated validation)
    if (!address || address.trim() === '' || address.length < 44 || address.length > 58 || !/^[1-9A-HJ-NP-Za-km-z]+$/.test(address)) {
      console.log('[BalanceHistoryChart] Skipping fetch due to invalid address:', address);
      setLoading(false);
      setError('Invalid wallet address');
      return;
    }
    
    fetchChartData();
  }, [address, days]);
  
  // Refresh data when refreshFlag changes
  useEffect(() => {
    // ✅ SKIP: Don't refresh if address is invalid (updated validation)
    if (!address || address.trim() === '' || address.length < 44 || address.length > 58 || !/^[1-9A-HJ-NP-Za-km-z]+$/.test(address)) {
      return;
    }
    
    if (refreshFlag > 0) {
      fetchChartData();
    }
  }, [refreshFlag]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    // ✅ SKIP: Don't auto-refresh if address is invalid (updated validation)
    if (!address || address.trim() === '' || address.length < 44 || address.length > 58 || !/^[1-9A-HJ-NP-Za-km-z]+$/.test(address)) {
      return;
    }

    const refreshInterval = setInterval(() => {
      fetchChartData();
      console.log("Auto-refreshing chart data");
    }, 5 * 60 * 1000); // 5 minutes in milliseconds

    return () => clearInterval(refreshInterval); // Cleanup on unmount
  }, [address, days]);

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
      
      const alphAmount = payload[0].value;
      const usdValue = alphPrice > 0 ? alphAmount * alphPrice : null;
      
      return (
        <div className="p-3 bg-background border rounded shadow-lg text-sm">
          <p className="font-medium text-foreground mb-1">{formattedDate}</p>
          <p className="text-primary font-semibold">
            {alphAmount.toFixed(2)} ALPH
          </p>
          {usdValue && (
            <p className="text-green-600 font-medium">
              ${usdValue.toFixed(2)} USD
            </p>
          )}
        </div>
      );
    }
    
    return null;
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  if (!historyData || historyData.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-sm">No balance history available</p>
          <p className="text-xs mt-1">Chart will update as data becomes available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      {/* Data source indicator */}
      {dataSource && (
        <div className="absolute top-2 right-2 z-10">
          <span className={`px-2 py-1 text-xs rounded-full border ${
            dataSource === 'api' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
            dataSource === 'calculated' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
            'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
          }`}>
            {dataSource === 'api' ? '🟢 Live' : dataSource === 'calculated' ? '🔵 Calc' : '🟡 Est'}
          </span>
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={historyData}
          margin={{
            top: 10,
            right: 10,
            left: 10,
            bottom: 20,
          }}
        >
          <defs>
            <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatXAxis} 
            interval="preserveStartEnd"
            axisLine={false}
            tickLine={false}
            stroke="hsl(var(--muted-foreground))" 
            fontSize={11}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis 
            hide={false}
            axisLine={false}
            tickLine={false}
            stroke="hsl(var(--muted-foreground))" 
            fontSize={10}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(value) => `${value.toFixed(0)}`}
            domain={['dataMin - 5', 'dataMax + 5']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="balance" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#balanceGradient)" 
            dot={false}
            activeDot={{ r: 4, stroke: 'hsl(var(--primary))', strokeWidth: 2, fill: 'hsl(var(--background))' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BalanceHistoryChart;

