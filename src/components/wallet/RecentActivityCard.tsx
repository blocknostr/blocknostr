
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownLeft, ExternalLink, Loader2 } from "lucide-react";
import { getAddressTransactions } from "@/lib/api/alephiumApi";
import { toast } from "sonner";

interface RecentActivityCardProps {
  address?: string;
  stats?: {
    transactionCount: number;
    receivedAmount: number;
    sentAmount: number;
    tokenCount: number;
  };
  isLoading?: boolean;
  refreshFlag?: number;
}

const RecentActivityCard: React.FC<RecentActivityCardProps> = ({ 
  address,
  stats,
  isLoading: externalIsLoading,
  refreshFlag 
}) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(externalIsLoading ?? true);

  useEffect(() => {
    const fetchRecentTransactions = async () => {
      if (!address) return;
      
      setIsLoading(true);
      try {
        const txs = await getAddressTransactions(address, 20);
        setTransactions(txs);
      } catch (error) {
        console.error("Error fetching recent transactions:", error);
        toast.error("Could not fetch transaction history");
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (address) {
      fetchRecentTransactions();
    } else {
      // If stats are provided externally, use those instead of fetching
      setIsLoading(externalIsLoading ?? false);
    }
  }, [address, refreshFlag, externalIsLoading]);

  // Helper function to format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Helper function to truncate address
  const truncateAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };
  
  // Helper to determine if transaction is incoming or outgoing
  const getTransactionType = (tx: any) => {
    if (!address) return 'unknown';
    
    // If any output is to this address, it's incoming
    const isIncoming = tx.outputs.some((output: any) => output.address === address);
    // If any input is from this address, it's outgoing
    const isOutgoing = tx.inputs.some((input: any) => input.address === address);
    
    if (isIncoming && !isOutgoing) return 'received';
    if (isOutgoing) return 'sent';
    return 'unknown';
  };
  
  // Calculate amount transferred to/from this address
  const getTransactionAmount = (tx: any) => {
    if (!address) return 0;
    
    const type = getTransactionType(tx);
    
    if (type === 'received') {
      // Sum all outputs to this address
      const amount = tx.outputs
        .filter((output: any) => output.address === address)
        .reduce((sum: number, output: any) => sum + Number(output.amount), 0);
      return amount / 10**18; // Convert from nanoALPH to ALPH
    } else if (type === 'sent') {
      // This is a simplification - for accurate accounting we'd need to track change outputs
      const amount = tx.outputs
        .filter((output: any) => output.address !== address)
        .reduce((sum: number, output: any) => sum + Number(output.amount), 0);
      return amount / 10**18; // Convert from nanoALPH to ALPH
    }
    
    return 0;
  };
  
  // Get the counterparty address
  const getCounterpartyAddress = (tx: any) => {
    if (!address) return 'Unknown';
    
    const type = getTransactionType(tx);
    
    if (type === 'received') {
      // The first input address is usually the sender
      return tx.inputs[0]?.address || 'Unknown';
    } else if (type === 'sent') {
      // The first non-self output is usually the recipient
      const recipient = tx.outputs.find((output: any) => output.address !== address);
      return recipient?.address || 'Unknown';
    }
    
    return 'Unknown';
  };

  // Show stats if provided and no transactions
  const showStats = stats && (!transactions || transactions.length === 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Your latest transactions</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
          </div>
        ) : showStats ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 border-b">
              <span className="text-muted-foreground">Total Transactions:</span>
              <span className="font-medium">{stats.transactionCount}</span>
            </div>
            <div className="flex items-center justify-between p-2 border-b">
              <span className="text-muted-foreground">Received:</span>
              <span className="font-medium text-green-500">+{stats.receivedAmount.toFixed(4)} ALPH</span>
            </div>
            <div className="flex items-center justify-between p-2 border-b">
              <span className="text-muted-foreground">Sent:</span>
              <span className="font-medium text-blue-500">-{stats.sentAmount.toFixed(4)} ALPH</span>
            </div>
            <div className="flex items-center justify-between p-2">
              <span className="text-muted-foreground">Tokens Held:</span>
              <span className="font-medium">{stats.tokenCount}</span>
            </div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No transactions found
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.slice(0, 10).map((tx) => {
              const type = getTransactionType(tx);
              const amount = getTransactionAmount(tx);
              const counterparty = getCounterpartyAddress(tx);
              
              return (
                <div key={tx.hash} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${type === 'received' ? 'bg-green-100 dark:bg-green-900/20' : 'bg-blue-100 dark:bg-blue-900/20'}`}>
                      {type === 'received' ? (
                        <ArrowDownLeft className="h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {type === 'received' ? 'Received from' : 'Sent to'} {truncateAddress(counterparty)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(tx.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${type === 'received' ? 'text-green-500' : 'text-blue-500'}`}>
                      {type === 'received' ? '+' : '-'}{amount.toFixed(4)} ALPH
                    </p>
                    <a
                      href={`https://explorer.alephium.org/transactions/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs text-primary hover:underline"
                    >
                      View <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
      {address && (
        <CardFooter>
          <Button variant="ghost" size="sm" className="w-full" asChild>
            <a
              href={`https://explorer.alephium.org/addresses/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2"
            >
              <span>View All Transactions</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default RecentActivityCard;
