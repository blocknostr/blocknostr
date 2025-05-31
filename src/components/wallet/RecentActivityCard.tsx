
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownLeft, ExternalLink, Loader2, ArrowRightLeft, RefreshCw } from "lucide-react";
import { getAddressTransactions } from "@/api/external/cachedAlephiumApi";
import { toast } from "@/lib/toast";
import { 
  getTransactionType,
  getTransactionAmountForDisplay,
  getCounterpartyAddress
} from "@/lib/utils/officialTransactionParser";

interface RecentActivityCardProps {
  address: string;
}

const RecentActivityCard: React.FC<RecentActivityCardProps> = ({ address }) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    
    fetchRecentTransactions();
  }, [address]);

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
  
  // Use official Alephium Explorer transaction parsing logic
  const parseTransaction = (tx: any) => {
    return {
      type: getTransactionType(address, tx),
      amount: getTransactionAmountForDisplay(address, tx),
      counterparty: getCounterpartyAddress(address, tx)
    };
  };

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
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No transactions found
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.slice(0, 10).map((tx) => {
              const parsed = parseTransaction(tx);
              const { type, amount, counterparty } = parsed;
              
              return (
                <div key={tx.hash} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      type === 'received' ? 'bg-green-100 dark:bg-green-900/20' : 
                      type === 'swap' ? 'bg-purple-100 dark:bg-purple-900/20' : 
                      type === 'internal' ? 'bg-orange-100 dark:bg-orange-900/20' : 
                      'bg-blue-100 dark:bg-blue-900/20'
                    }`}>
                      {type === 'received' ? (
                        <ArrowDownLeft className="h-4 w-4 text-green-500" />
                      ) : type === 'swap' ? (
                        <ArrowRightLeft className="h-4 w-4 text-purple-500" />
                      ) : type === 'internal' ? (
                        <RefreshCw className="h-4 w-4 text-orange-500" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {type === 'received' ? 'Received from' : 
                         type === 'swap' ? 'Swapped with' : 
                         type === 'internal' ? 'Internal transaction' : 
                         'Sent to'} {type !== 'internal' ? truncateAddress(counterparty) : ''}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(tx.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${
                      type === 'received' ? 'text-green-500' : 
                      type === 'swap' ? 'text-purple-500' : 
                      type === 'internal' ? 'text-orange-500' : 
                      'text-blue-500'
                    }`}>
                      {type === 'received' ? '+' : 
                       type === 'swap' ? '±' : 
                       type === 'internal' ? '↻' : 
                       '-'}{amount.toFixed(4)} ALPH
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
    </Card>
  );
};

export default RecentActivityCard;

