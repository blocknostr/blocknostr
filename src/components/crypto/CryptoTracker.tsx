import React, { useState, useEffect } from "react";
import { ExternalLink, RefreshCw, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getMultipleCoinsPrice } from "@/lib/api/coingeckoApi";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface CryptoData {
  id: string;
  name: string;
  symbol: string;
  price: number;
  priceChange24h: number;
  marketCapRank: number;
}

const STORAGE_KEY = "blocknoster_watched_coins";
const DEFAULT_COINS = ['bitcoin', 'alephium', 'ergo'];

const CryptoTracker: React.FC = () => {
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [newCoinId, setNewCoinId] = useState("");
  const [watchedCoins, setWatchedCoins] = useState<string[]>(DEFAULT_COINS);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  
  // Load watched coins from storage on component mount
  useEffect(() => {
    const storedCoins = localStorage.getItem(STORAGE_KEY);
    if (storedCoins) {
      try {
        const parsedCoins = JSON.parse(storedCoins);
        if (Array.isArray(parsedCoins) && parsedCoins.length > 0) {
          setWatchedCoins(parsedCoins);
        }
      } catch (err) {
        console.error("Error parsing stored coins:", err);
      }
    }
  }, []);

  // Save watched coins to storage when they change
  useEffect(() => {
    if (watchedCoins.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(watchedCoins));
    }
  }, [watchedCoins]);
  
  const fetchCryptoData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getMultipleCoinsPrice(watchedCoins);
      setCryptoData(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching crypto data:", err);
      setError("Failed to load price data");
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch data on component mount and when watchedCoins changes
  useEffect(() => {
    fetchCryptoData();
    
    // Refresh every 2 minutes
    const interval = setInterval(fetchCryptoData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [watchedCoins]);
  
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
      <span className={`${isPositive ? 'text-green-500' : 'text-red-500'} text-xs`}>
        {isPositive ? '+' : ''}{change.toFixed(2)}%
      </span>
    );
  };
  
  const handleAddCoin = () => {
    if (!newCoinId.trim()) {
      toast.error("Please enter a valid coin ID");
      return;
    }
    
    // Normalize the coin ID (lowercase, trim spaces)
    const normalizedId = newCoinId.trim().toLowerCase();
    
    // Check if already in the list
    if (watchedCoins.includes(normalizedId)) {
      toast.error("This coin is already being tracked");
      return;
    }
    
    // Add the new coin
    setWatchedCoins(prev => [...prev, normalizedId]);
    setNewCoinId("");
    setAddDialogOpen(false);
    toast.success(`Added ${normalizedId} to tracked coins`);
  };
  
  const handleRemoveCoin = (coinId: string) => {
    // Don't allow removing all coins
    if (watchedCoins.length <= 1) {
      toast.error("You must track at least one coin");
      return;
    }
    
    setWatchedCoins(prev => prev.filter(id => id !== coinId));
    toast.success(`Removed ${coinId} from tracked coins`);
  };
  
  const renderCryptoItem = (crypto: CryptoData) => (
    <div key={crypto.id} className="flex items-center justify-between py-1 hover:bg-accent/30 group px-1 rounded">
      <div className="flex items-center gap-1">
        <div className="text-xs bg-muted px-1 rounded">
          #{crypto.marketCapRank}
        </div>
        <div className="text-xs font-medium">{crypto.name}</div>
        <div className="text-xs text-muted-foreground uppercase">{crypto.symbol}</div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-xs font-medium">{formatPrice(crypto.price)}</div>
        {formatChange(crypto.priceChange24h)}
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => handleRemoveCoin(crypto.id)}
          title="Remove from tracking"
        >
          <span className="sr-only">Remove</span>
          &times;
        </Button>
      </div>
    </div>
  );
  
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <svg className="h-3.5 w-3.5 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15 9.354C14.3802 8.7343 13.5233 8.39405 12.6361 8.4156C11.7489 8.43715 10.9075 8.8178 10.3179 9.46729C9.72833 10.1168 9.44338 10.9797 9.53398 11.8509C9.62457 12.722 10.08 13.5164 10.784 14.046L13.2 16L15.616 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h3 className="font-medium text-xs">Market Prices</h3>
        </div>
        
        <div className="flex gap-1">
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-5 w-5 p-0"
                title="Add coin"
              >
                <Plus className="h-3 w-3" />
                <span className="sr-only">Add coin</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add cryptocurrency</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="coinId" className="text-sm">
                    Coin ID (from CoinGecko)
                  </label>
                  <div className="flex gap-2">
                    <Input 
                      id="coinId" 
                      value={newCoinId}
                      onChange={(e) => setNewCoinId(e.target.value)}
                      placeholder="e.g. bitcoin, ethereum"
                      className="flex-1"
                    />
                    <Button onClick={handleAddCoin}>Add</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter the CoinGecko ID of the cryptocurrency you want to track
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-5 w-5 p-0"
            disabled={loading}
            onClick={fetchCryptoData}
            title="Refresh prices"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            <span className="sr-only">Refresh prices</span>
          </Button>
        </div>
      </div>
      
      {error ? (
        <div className="p-2 text-center text-xs text-muted-foreground bg-accent/20 rounded">
          {error}. <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={fetchCryptoData}>Try again</Button>
        </div>
      ) : loading && cryptoData.length === 0 ? (
        <div className="space-y-1">
          {[1, 2, 3].map(i => (
            <div key={i} className="py-1 px-1">
              <div className="flex justify-between items-center">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-0">
            {cryptoData.map(renderCryptoItem)}
          </div>
          
          {lastUpdated && (
            <div className="mt-1 text-xs text-center text-muted-foreground">
              <div className="flex items-center justify-center text-[10px]">
                <span>Updated {lastUpdated.toLocaleTimeString()}</span>
                <a 
                  href="https://www.coingecko.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center ml-1 text-primary hover:underline"
                >
                  CoinGecko
                  <ExternalLink className="h-2 w-2 ml-0.5" />
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
