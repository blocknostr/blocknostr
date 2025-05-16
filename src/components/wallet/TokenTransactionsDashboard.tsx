
import React, { useState, useEffect, useCallback } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, RefreshCw, Bell, BellOff } from "lucide-react";
import { 
  fetchAllTokenTransactions, 
  subscribeToAllTokenUpdates,
  TokenTransaction,
  cleanupTokenTransactions
} from "@/lib/api/tokenTransactions";
import { fetchTokenList, TokenMetadata } from "@/lib/api/tokenMetadata";
import { toast } from "sonner";
import TokenTransactions from "./TokenTransactions";

interface TokenTransactionsDashboardProps {
  address?: string; // Optional address to filter transactions
}

const TokenTransactionsDashboard: React.FC<TokenTransactionsDashboardProps> = ({ address }) => {
  const [tokens, setTokens] = useState<Record<string, TokenMetadata>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [newTransactionCount, setNewTransactionCount] = useState<Record<string, number>>({});
  
  // Load tokens
  const loadTokens = useCallback(async () => {
    try {
      setIsLoading(true);
      const tokenList = await fetchTokenList();
      setTokens(tokenList);
      
      // Select first token by default if none selected
      if (!selectedTokenId && Object.keys(tokenList).length > 0) {
        setSelectedTokenId(Object.keys(tokenList)[0]);
      }
    } catch (error) {
      console.error("Error loading tokens:", error);
      toast.error("Failed to load tokens");
    } finally {
      setIsLoading(false);
    }
  }, [selectedTokenId]);
  
  // Handle new transaction from streaming
  const handleNewTransaction = useCallback((tokenId: string, symbol: string, tx: TokenTransaction) => {
    // Update transaction counter
    setNewTransactionCount(prev => ({
      ...prev,
      [tokenId]: (prev[tokenId] || 0) + 1
    }));
    
    // Show notification
    toast.info(`New ${symbol} transaction`, {
      description: `Transaction processed at ${new Date(tx.timestamp).toLocaleTimeString()}`
    });
  }, []);
  
  // Toggle subscription to all token updates
  const toggleSubscription = () => {
    if (isSubscribed) {
      setIsSubscribed(false);
      cleanupTokenTransactions();
      toast.info("Stopped monitoring all tokens");
    } else {
      setIsSubscribed(true);
      toast.info("Monitoring all tokens for new transactions");
    }
  };
  
  // Initial load
  useEffect(() => {
    loadTokens();
    
    // Clean up on unmount
    return () => {
      cleanupTokenTransactions();
    };
  }, [loadTokens]);
  
  // Subscribe to all token updates
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    if (isSubscribed) {
      unsubscribe = subscribeToAllTokenUpdates(handleNewTransaction);
    }
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isSubscribed, handleNewTransaction]);
  
  // Filter tokens based on search term
  const filteredTokens = Object.values(tokens).filter(token => 
    token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.id.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Clear transaction count for a token when it's selected
  const handleTokenSelect = (tokenId: string) => {
    setSelectedTokenId(tokenId);
    setNewTransactionCount(prev => ({
      ...prev,
      [tokenId]: 0
    }));
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <CardTitle>Alephium Token Transactions</CardTitle>
            <CardDescription>
              {address 
                ? `Transactions for address ${address}`
                : 'Monitor token transactions across the Alephium network'}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={isSubscribed ? "default" : "outline"}
              size="sm"
              onClick={toggleSubscription}
              className="flex items-center gap-1.5 h-9"
            >
              {isSubscribed ? (
                <>
                  <BellOff className="h-3.5 w-3.5" />
                  <span>Stop Monitoring</span>
                </>
              ) : (
                <>
                  <Bell className="h-3.5 w-3.5" />
                  <span>Monitor All</span>
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadTokens}
              className="flex items-center gap-1.5 h-9"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search tokens..." 
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : filteredTokens.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No tokens found
              </div>
            ) : (
              <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2">
                {filteredTokens.map(token => (
                  <div
                    key={token.id}
                    className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-muted transition-colors ${
                      selectedTokenId === token.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => handleTokenSelect(token.id)}
                  >
                    <div className="flex items-center gap-2">
                      {token.logoURI ? (
                        <img 
                          src={token.logoURI} 
                          alt={token.symbol} 
                          className="h-6 w-6 rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/alephium/token-list/master/logos/unknown.png';
                          }}
                        />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                          <span className="text-xs font-medium">
                            {token.symbol ? token.symbol.substring(0, 2) : '??'}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{token.symbol}</div>
                        <div className="text-xs text-muted-foreground">{token.name}</div>
                      </div>
                    </div>
                    
                    {newTransactionCount[token.id] > 0 && (
                      <div className="rounded-full bg-primary w-5 h-5 flex items-center justify-center text-xs text-white">
                        {newTransactionCount[token.id]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="md:col-span-2">
            {selectedTokenId ? (
              <TokenTransactions tokenId={selectedTokenId} address={address} />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                {isLoading ? "Loading tokens..." : "Select a token to view transactions"}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TokenTransactionsDashboard;
