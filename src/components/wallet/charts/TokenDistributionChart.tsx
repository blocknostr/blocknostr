
import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Loader2 } from "lucide-react";
import { getAddressTokens, EnrichedToken } from "@/lib/api/alephiumApi";

interface TokenDistributionChartProps {
  address: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const TokenDistributionChart: React.FC<TokenDistributionChartProps> = ({ address }) => {
  const [tokens, setTokens] = useState<EnrichedToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTokens = async () => {
      if (!address) return;
      
      setIsLoading(true);
      
      try {
        const tokenData = await getAddressTokens(address);
        setTokens(tokenData);
      } catch (error) {
        console.error('Error fetching tokens:', error);
        setError('Could not fetch token data');
        setTokens([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTokens();
  }, [address]);

  // Transform token data for chart
  const chartData = tokens
    .filter(token => parseFloat(token.formattedAmount) > 0) // Filter out zero balances
    .map((token, index) => ({
      name: token.symbol,
      value: parseFloat(token.formattedAmount.replace(/,/g, '')),
      fill: COLORS[index % COLORS.length],
    }));

  // Add "Other" category if there are too many tokens
  if (chartData.length > 5) {
    const topTokens = chartData.slice(0, 4);
    const otherTokens = chartData.slice(4);
    const otherValue = otherTokens.reduce((sum, token) => sum + token.value, 0);
    
    topTokens.push({
      name: 'Other',
      value: otherValue,
      fill: COLORS[5 % COLORS.length],
    });
    
    chartData.length = 0;
    chartData.push(...topTokens);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-full text-muted-foreground">
        {error}
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="flex justify-center items-center h-full text-muted-foreground">
        No tokens found
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={5}
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {chartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.fill} 
              stroke="rgba(255,255,255,0.2)"
            />
          ))}
        </Pie>
        <Legend />
        <Tooltip formatter={(value) => [`${Number(value).toLocaleString()}`, 'Amount']} />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default TokenDistributionChart;
