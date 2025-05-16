
import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Loader2 } from "lucide-react";
import { getAddressTokens, EnrichedToken } from "@/lib/api/alephiumApi";
import { getAlephiumPrice } from "@/lib/api/coingeckoApi";
import { Toggle } from "@/components/ui/toggle";
import { formatCurrency } from "@/lib/utils/formatters";

interface TokenDistributionChartProps {
  address: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff6b81', '#36a2eb'];

const TokenDistributionChart: React.FC<TokenDistributionChartProps> = ({ address }) => {
  const [tokens, setTokens] = useState<EnrichedToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alphPrice, setAlphPrice] = useState(0);
  const [showUsd, setShowUsd] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!address) return;
      
      setIsLoading(true);
      
      try {
        // Fetch both tokens and ALPH price
        const [tokenData, priceData] = await Promise.all([
          getAddressTokens(address),
          getAlephiumPrice()
        ]);
        
        setTokens(tokenData);
        setAlphPrice(priceData.price);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Could not fetch token data');
        setTokens([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [address]);

  // Transform token data for chart - separate NFTs from fungible tokens
  const chartData = tokens
    .filter(token => parseFloat(token.formattedAmount.replace(/,/g, '')) > 0) // Filter out zero balances
    .map((token, index) => {
      const tokenAmount = token.isNFT ? 1 : parseFloat(token.formattedAmount.replace(/,/g, ''));
      const tokenValue = token.isNFT ? alphPrice * 0.1 : (token.id === 'alephium' ? tokenAmount * alphPrice : tokenAmount * 0.01);
      
      return {
        name: token.symbol,
        tokenAmount,
        usdValue: tokenValue,
        value: showUsd ? tokenValue : tokenAmount,
        fill: COLORS[index % COLORS.length],
        isNFT: token.isNFT,
        id: token.id
      };
    });

  // Add "Other" category if there are too many tokens
  if (chartData.length > 5) {
    const topTokens = chartData.slice(0, 4);
    const otherTokens = chartData.slice(4);
    
    // Sum values based on display mode
    const otherValue = otherTokens.reduce((sum, token) => sum + token.value, 0);
    const otherUsdValue = otherTokens.reduce((sum, token) => sum + token.usdValue, 0);
    const otherTokenAmount = otherTokens.reduce((sum, token) => sum + token.tokenAmount, 0);
    
    topTokens.push({
      name: 'Other',
      tokenAmount: otherTokenAmount,
      usdValue: otherUsdValue,
      value: showUsd ? otherUsdValue : otherTokenAmount,
      fill: COLORS[4],
      isNFT: false,
      id: 'other'
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
    <>
      <div className="flex justify-end mb-2">
        <Toggle
          pressed={showUsd}
          onPressedChange={(pressed) => {
            setShowUsd(pressed);
            // Update chart data values based on display mode
            chartData.forEach(item => {
              item.value = pressed ? item.usdValue : item.tokenAmount;
            });
          }}
          size="sm"
          className="h-7 px-3 text-xs"
        >
          {showUsd ? "USD Value" : "Token Amount"}
        </Toggle>
      </div>
      
      <ResponsiveContainer width="100%" height="90%">
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
          <Tooltip 
            formatter={(value, name, props) => {
              const { isNFT, tokenAmount, usdValue } = props.payload;
              
              if (isNFT) {
                return showUsd 
                  ? [`${formatCurrency(usdValue)} (NFT)`, name]
                  : ["NFT", name];
              }
              
              return showUsd
                ? [formatCurrency(usdValue), name]
                : [`${Number(tokenAmount).toLocaleString()}`, name];
            }} 
          />
        </PieChart>
      </ResponsiveContainer>
    </>
  );
};

export default TokenDistributionChart;
