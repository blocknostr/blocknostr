import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Hash, MapPin, Blocks, ExternalLink, Loader2 } from "lucide-react";
import { getAddressTransactions } from "@/api/external/cachedAlephiumApi";
import { toast } from "@/lib/toast";

interface ExplorerSearchProps {
  onTransactionFound?: (txHash: string, txData: any) => void;
  onAddressFound?: (address: string, txData: any[]) => void;
}

type SearchType = 'transaction' | 'address' | 'block' | 'unknown';

const ExplorerSearch: React.FC<ExplorerSearchProps> = ({ 
  onTransactionFound, 
  onAddressFound 
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchType, setSearchType] = useState<SearchType>('unknown');

  // Detect what type of search query this is
  const detectSearchType = (query: string): SearchType => {
    const trimmedQuery = query.trim();
    
    if (!trimmedQuery) return 'unknown';
    
    // Transaction hash (64 hex characters)
    if (/^[a-fA-F0-9]{64}$/.test(trimmedQuery)) {
      return 'transaction';
    }
    
    // Alephium address (Base58 encoded, starts with 1, typically 42-50 characters)
    // Base58 alphabet: 123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz
    // (excludes 0, O, I, l to avoid confusion)
    if (/^1[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{25,50}$/.test(trimmedQuery)) {
      return 'address';
    }
    
    // Block hash (64 hex characters, same as transaction)
    if (/^[a-fA-F0-9]{64}$/.test(trimmedQuery)) {
      return 'block'; // Note: this overlaps with transaction, we'll try both
    }
    
    return 'unknown';
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a transaction hash or address");
      return;
    }

    setIsSearching(true);
    setSearchResult(null);
    
    const type = detectSearchType(searchQuery);
    setSearchType(type);

    try {
      if (type === 'address') {
        // Search for address transactions
        console.log(`[Explorer] Searching for address: ${searchQuery}`);
        const transactions = await getAddressTransactions(searchQuery, 100);
        
        setSearchResult({
          type: 'address',
          data: {
            address: searchQuery,
            transactions: transactions,
            totalTransactions: transactions.length
          }
        });
        
        if (onAddressFound) {
          onAddressFound(searchQuery, transactions);
        }
        
        toast.success(`Found ${transactions.length} transactions for address`);
        
      } else if (type === 'transaction') {
        // For transaction hash, we need to search through addresses to find it
        // This is a limitation - we'd need direct transaction API access
        toast.info("Transaction search requires API access", {
          description: "Try searching by address instead"
        });
        
        setSearchResult({
          type: 'transaction',
          data: {
            hash: searchQuery,
            found: false,
            message: "Direct transaction lookup requires full explorer API"
          }
        });
        
      } else {
        toast.error("Invalid search query", {
          description: "Please enter a valid Alephium address or transaction hash"
        });
      }
      
    } catch (error) {
      console.error('[Explorer] Search error:', error);
      toast.error("Search failed", {
        description: error instanceof Error ? error.message : "Please try again"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getSearchTypeInfo = (type: SearchType) => {
    switch (type) {
      case 'transaction':
        return {
          icon: <Hash className="h-4 w-4" />,
          label: "Transaction Hash",
          color: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
        };
      case 'address':
        return {
          icon: <MapPin className="h-4 w-4" />,
          label: "Alephium Address",
          color: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300"
        };
      case 'block':
        return {
          icon: <Blocks className="h-4 w-4" />,
          label: "Block Hash",
          color: "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300"
        };
      default:
        return {
          icon: <Search className="h-4 w-4" />,
          label: "Unknown",
          color: "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300"
        };
    }
  };

  const currentType = detectSearchType(searchQuery);
  const typeInfo = getSearchTypeInfo(currentType);

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Alephium Explorer
          </CardTitle>
          <CardDescription>
            Search transactions, addresses, and blocks on the Alephium blockchain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Input */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter transaction hash or address..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              </div>
              <Button 
                onClick={handleSearch} 
                disabled={isSearching || !searchQuery.trim()}
                className="min-w-[100px]"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </>
                )}
              </Button>
            </div>

            {/* Search Type Detection */}
            {searchQuery.trim() && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Detected:</span>
                <Badge variant="secondary" className={typeInfo.color}>
                  {typeInfo.icon}
                  <span className="ml-1">{typeInfo.label}</span>
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResult && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
          </CardHeader>
          <CardContent>
            {searchResult.type === 'address' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Address Details</h3>
                    <p className="text-sm text-muted-foreground font-mono">
                      {searchResult.data.address}
                    </p>
                  </div>
                  <a
                    href={`https://explorer.alephium.org/addresses/${searchResult.data.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary hover:underline"
                  >
                    View on Explorer <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {searchResult.data.totalTransactions}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Transactions</div>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {searchResult.data.transactions.filter((tx: any) => {
                        const isIncoming = tx.outputs?.some((output: any) => 
                          output.address === searchResult.data.address
                        );
                        const isOutgoing = tx.inputs?.some((input: any) => 
                          input.address === searchResult.data.address
                        );
                        return isIncoming && !isOutgoing;
                      }).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Received</div>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {searchResult.data.transactions.filter((tx: any) => {
                        const isOutgoing = tx.inputs?.some((input: any) => 
                          input.address === searchResult.data.address
                        );
                        return isOutgoing;
                      }).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Sent</div>
                  </div>
                </div>
              </div>
            )}

            {searchResult.type === 'transaction' && (
              <div className="space-y-4">
                <div className="text-center py-8">
                  <Hash className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-medium mb-2">Transaction Search</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchResult.data.message}
                  </p>
                  <a
                    href={`https://explorer.alephium.org/transactions/${searchResult.data.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary hover:underline"
                  >
                    View on Official Explorer <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
          <CardDescription>
            Explore the Alephium blockchain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a
              href="https://explorer.alephium.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Search className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">Official Explorer</div>
                <div className="text-sm text-muted-foreground">explorer.alephium.org</div>
              </div>
              <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
            </a>
            
            <a
              href="https://explorer.alephium.org/blocks"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Blocks className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">Latest Blocks</div>
                <div className="text-sm text-muted-foreground">Recent blockchain activity</div>
              </div>
              <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExplorerSearch; 
