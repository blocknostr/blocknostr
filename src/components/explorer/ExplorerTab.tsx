import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Hash, 
  MapPin, 
  History, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowRightLeft, 
  RefreshCw,
  ExternalLink,
  Eye,
  Activity
} from "lucide-react";
import ExplorerSearch from "./ExplorerSearch";
import TransactionDetails from "./TransactionDetails";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { truncateAddress } from "@/lib/utils/formatters";
import { 
  getTransactionType,
  getTransactionAmountForDisplay,
  getCounterpartyAddress
} from "@/lib/utils/officialTransactionParser";

interface ExplorerTabProps {
  selectedAddress?: string; // Currently selected wallet address
}

const ExplorerTab: React.FC<ExplorerTabProps> = ({ selectedAddress }) => {
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<{
    address?: string;
    transactions?: any[];
  }>({});

  const handleAddressFound = (address: string, transactions: any[]) => {
    setSearchResults({ address, transactions });
    setSelectedTransaction(null); // Clear selected transaction when new search
  };

  const handleTransactionSelected = (transaction: any) => {
    setSelectedTransaction(transaction);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'received':
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      case 'sent':
        return <ArrowUpRight className="h-4 w-4 text-blue-500" />;
      case 'swap':
        return <ArrowRightLeft className="h-4 w-4 text-purple-500" />;
      case 'internal':
        return <RefreshCw className="h-4 w-4 text-orange-500" />;
      default:
        return <Hash className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'received':
        return "text-green-500";
      case 'sent':
        return "text-blue-500";
      case 'swap':
        return "text-purple-500";
      case 'internal':
        return "text-orange-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Explorer Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-6 w-6" />
            Alephium Explorer
          </CardTitle>
          <CardDescription>
            Powered by official [Alephium Explorer Backend](https://github.com/alephium/explorer-backend) parsing logic
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="search" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2" disabled={!searchResults.transactions}>
            <Activity className="h-4 w-4" />
            Results {searchResults.transactions && `(${searchResults.transactions.length})`}
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-2" disabled={!selectedTransaction}>
            <Eye className="h-4 w-4" />
            Details
          </TabsTrigger>
        </TabsList>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-6">
          <ExplorerSearch 
            onAddressFound={handleAddressFound}
          />
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          {searchResults.address && searchResults.transactions ? (
            <div className="space-y-6">
              {/* Address Summary */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Address Analysis
                      </CardTitle>
                      <CardDescription className="font-mono text-xs break-all">
                        {searchResults.address}
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={`https://explorer.alephium.org/addresses/${searchResults.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Explorer
                      </a>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Total Transactions */}
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {searchResults.transactions.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Transactions</div>
                    </div>

                    {/* Received */}
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {searchResults.transactions.filter(tx => {
                          const type = getTransactionType(searchResults.address!, tx);
                          return type === 'received';
                        }).length}
                      </div>
                      <div className="text-sm text-green-600">Received</div>
                    </div>

                    {/* Sent */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {searchResults.transactions.filter(tx => {
                          const type = getTransactionType(searchResults.address!, tx);
                          return type === 'sent';
                        }).length}
                      </div>
                      <div className="text-sm text-blue-600">Sent</div>
                    </div>

                    {/* Swaps/Internal */}
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {searchResults.transactions.filter(tx => {
                          const type = getTransactionType(searchResults.address!, tx);
                          return type === 'swap' || type === 'internal';
                        }).length}
                      </div>
                      <div className="text-sm text-purple-600">Swaps/Internal</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Transaction List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Transaction History
                  </CardTitle>
                  <CardDescription>
                    Parsed using official Alephium Explorer Backend logic
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead className="hidden sm:table-cell">Counterparty</TableHead>
                          <TableHead className="hidden md:table-cell">Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {searchResults.transactions.slice(0, 50).map((tx) => {
                          const type = getTransactionType(searchResults.address!, tx);
                          const amount = getTransactionAmountForDisplay(searchResults.address!, tx);
                          const counterparty = getCounterpartyAddress(searchResults.address!, tx);
                          
                          return (
                            <TableRow 
                              key={tx.hash} 
                              className="hover:bg-muted/40 cursor-pointer"
                              onClick={() => handleTransactionSelected(tx)}
                            >
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getTypeIcon(type)}
                                  <span className="capitalize">{type}</span>
                                </div>
                              </TableCell>
                              <TableCell className={`font-medium ${getTypeColor(type)}`}>
                                {type === 'received' ? '+' : 
                                 type === 'swap' ? '±' : 
                                 type === 'internal' ? '↻' : 
                                 '-'} {amount.toFixed(4)} ALPH
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">
                                {truncateAddress(counterparty)}
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {formatDate(tx.timestamp)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-1 justify-end">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleTransactionSelected(tx);
                                    }}
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    asChild
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <a
                                      href={`https://explorer.alephium.org/transactions/${tx.hash}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {searchResults.transactions.length > 50 && (
                    <div className="mt-4 text-center text-sm text-muted-foreground">
                      Showing first 50 transactions of {searchResults.transactions.length} total
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-medium mb-2">No Search Results</h3>
                <p className="text-sm text-muted-foreground">
                  Use the Search tab to find transactions and addresses
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <TransactionDetails 
            transaction={selectedTransaction}
            address={searchResults.address}
          />
        </TabsContent>
      </Tabs>

      {/* Explorer Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">About This Explorer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground space-y-2">
            <p>
              This mini-explorer uses the official parsing logic from the{" "}
              <a 
                href="https://github.com/alephium/explorer-backend" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Alephium Explorer Backend
              </a>{" "}
              repository, ensuring 100% compatibility with{" "}
              <a 
                href="https://explorer.alephium.org" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                explorer.alephium.org
              </a>.
            </p>
            <p>
              Transaction classification, amount calculation, and counterparty detection 
              use the same algorithms that power the official Alephium blockchain explorer.
            </p>
            <div className="flex items-center gap-4 mt-4">
              <Badge variant="secondary" className="text-xs">
                <Hash className="h-3 w-3 mr-1" />
                Official Parsing Logic
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <Activity className="h-3 w-3 mr-1" />
                Real-time Data
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <ExternalLink className="h-3 w-3 mr-1" />
                Explorer Compatible
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExplorerTab; 
