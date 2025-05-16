
import React, { useState, useEffect } from "react";
import { ExternalLink, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getMultipleCoinsPrice } from "@/lib/api/coingeckoApi";

interface CryptoData {
  id: string;
  name: string;
  symbol: string;
  price: number;
  priceChange24h: number;
  marketCapRank: number;
}

const CryptoTracker: React.FC = () => {
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const fetchCryptoData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getMultipleCoinsPrice(['bitcoin', 'alephium', 'ergo']);
      setCryptoData(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching crypto data:", err);
      setError("Failed to load price data");
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch data on component mount
  useEffect(() => {
    fetchCryptoData();
    
    // Refresh every 2 minutes
    const interval = setInterval(fetchCryptoData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    } else if (price >= 1) {
      return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    } else {
      return `$${price.toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
    }
  };
  
  const formatChange = (change: number) => {
    const isPositive = change >= 0;
    return (
      <span className={`${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {isPositive ? '+' : ''}{change.toFixed(2)}%
      </span>
    );
  };
  
  const renderCryptoItem = (crypto: CryptoData) => (
    <div key={crypto.id} className="flex flex-col p-2 rounded-md hover:bg-accent/50">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          <div className="text-sm font-medium">{crypto.name}</div>
          <div className="text-xs text-muted-foreground uppercase">{crypto.symbol}</div>
        </div>
        <div className="text-xs bg-muted px-1.5 py-0.5 rounded">
          #{crypto.marketCapRank}
        </div>
      </div>
      <div className="flex justify-between mt-1">
        <div className="text-base font-medium">{formatPrice(crypto.price)}</div>
        <div className="text-sm">{formatChange(crypto.priceChange24h)}</div>
      </div>
    </div>
  );
  
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15 9.354C14.3802 8.7343 13.5233 8.39405 12.6361 8.4156C11.7489 8.43715 10.9075 8.8178 10.3179 9.46729C9.72833 10.1168 9.44338 10.9797 9.53398 11.8509C9.62457 12.722 10.08 13.5164 10.784 14.046L13.2 16L15.616 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h3 className="font-medium text-sm">Market Prices</h3>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 w-7 p-0"
          disabled={loading}
          onClick={fetchCryptoData}
          title="Refresh prices"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="sr-only">Refresh prices</span>
        </Button>
      </div>
      
      {error ? (
        <div className="p-3 text-center text-sm text-muted-foreground bg-accent/20 rounded">
          {error}. <Button variant="link" size="sm" className="p-0 h-auto" onClick={fetchCryptoData}>Try again</Button>
        </div>
      ) : loading && cryptoData.length === 0 ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-2">
              <div className="flex justify-between items-center mb-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-8" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-5 w-14" />
                <Skeleton className="h-4 w-10" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-0.5">
            {cryptoData.map(renderCryptoItem)}
          </div>
          
          {lastUpdated && (
            <div className="mt-2 text-xs text-center text-muted-foreground">
              <div className="flex items-center justify-center">
                <span>Updated {lastUpdated.toLocaleTimeString()}</span>
                <a 
                  href="https://www.coingecko.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center ml-1 text-primary hover:underline"
                >
                  CoinGecko
                  <ExternalLink className="h-3 w-3 ml-0.5" />
                </a>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CryptoTracker;
