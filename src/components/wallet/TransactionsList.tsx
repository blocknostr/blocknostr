
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownLeft, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { handleError } from "@/lib/utils/errorHandling";

interface Transaction {
  id: string;
  type: 'sent' | 'received';
  amount: string;
  timestamp: number;
  status: 'confirmed' | 'pending';
  address: string;
  blockHash?: string;
}

interface AlephiumAddressTransactionsResponse {
  transactions: Array<{
    hash: string;
    blockHash: string;
    timestamp: number;
    inputs: Array<{
      address: string;
      attoAlphAmount: string;
    }>;
    outputs: Array<{
      address: string;
      attoAlphAmount: string;
    }>;
  }>;
}

interface TransactionsListProps {
  address: string;
}

const TransactionsList = ({ address }: TransactionsListProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Node API URL
  const ALEPHIUM_NODE_API = "https://node.mainnet.alephium.org";

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!address) return;
      
      setIsLoading(true);
      
      try {
        // Using the node API URL you provided
        const response = await fetch(`${ALEPHIUM_NODE_API}/addresses/${address}/transactions?fromGroup=0&toGroup=3&limit=10`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch transactions: ${response.status}`);
        }
        
        const data: AlephiumAddressTransactionsResponse = await response.json();
        
        if (!data.transactions || !Array.isArray(data.transactions)) {
          throw new Error('Invalid response format');
        }
        
        console.log('API Response:', data); // Log the response for debugging
        
        // Transform the data into our transaction format
        const formattedTransactions: Transaction[] = data.transactions.map((tx) => {
          // Determine if the transaction is sent or received
          const isSent = tx.inputs.some(input => input.address === address);
          
          // Calculate the total amount
          let amount = '0';
          if (isSent) {
            // For sent, calculate the net amount leaving the address
            // First, sum all inputs from this address
            const selfInputs = tx.inputs.filter(input => input.address === address);
            const inputSum = selfInputs.reduce((sum, input) => 
              (BigInt(sum) + BigInt(input.attoAlphAmount)).toString(), '0');
            
            // Then, sum all outputs going back to this address
            const selfOutputs = tx.outputs.filter(output => output.address === address);
            const outputSum = selfOutputs.reduce((sum, output) => 
              (BigInt(sum) + BigInt(output.attoAlphAmount)).toString(), '0');
            
            // The amount sent is the difference
            amount = (BigInt(inputSum) - BigInt(outputSum)).toString();
          } else {
            // For received, sum outputs that go to the current address
            const selfOutputs = tx.outputs.filter(output => output.address === address);
            amount = selfOutputs.reduce((sum, output) => 
              (BigInt(sum) + BigInt(output.attoAlphAmount)).toString(), '0');
          }
          
          // Format amount to ALPH (1 ALPH = 10^18 attoALPH)
          const formattedAmount = (Number(BigInt(amount)) / 10**18).toString();
          
          // Find the counterparty address (first non-self address in inputs or outputs)
          let counterpartyAddress = '';
          if (isSent) {
            // For sent, get the first recipient that isn't the sender
            counterpartyAddress = tx.outputs.find(output => output.address !== address)?.address || 'Unknown';
          } else {
            // For received, get the first sender
            counterpartyAddress = tx.inputs.find(input => input.address !== address)?.address || 'Unknown';
          }
          
          return {
            id: tx.hash,
            type: isSent ? 'sent' : 'received',
            amount: formattedAmount,
            timestamp: tx.timestamp * 1000, // Convert to milliseconds
            status: 'confirmed',
            address: counterpartyAddress,
            blockHash: tx.blockHash
          };
        });
        
        setTransactions(formattedTransactions);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        
        await handleError(error, {
          toastMessage: "Could not fetch transaction history",
          logMessage: "Transaction fetch error for address: " + address,
          type: 'error',
        });
        
        // If we're using the fixed demo address, show mock data
        if (address === "raLUPHsewjm1iA2kBzRKXB2ntbj3j4puxbVvsZD8iK3r") {
          const mockTransactions: Transaction[] = [
            {
              id: "d35e3ceed8151d62af033c7949e9634afdb76e19197a30741e5951d60c9fbc61",
              type: "received",
              amount: "5.00",
              timestamp: Date.now() - 3600000 * 2,
              status: "confirmed",
              address: "raLxxuVR1W8GV1J5EGcmAXnYLJDcwYwEX5fHdavZpS7c"
            },
            {
              id: "f9cb93e871d31c0c5c8efdc67c3fbc5bd4eb28d3abc3ac331421d93aeb5cf2b1",
              type: "sent",
              amount: "2.25",
              timestamp: Date.now() - 86400000,
              status: "confirmed",
              address: "ra2VbGCNvxJvdPFSXNuTK8f85NqMnQEjmTNLQEwp2FG1"
            },
            {
              id: "517dbcd142a21c34163173ff890d056a8388e9446b32766fb3f5d1c8225e8cb9",
              type: "received",
              amount: "1.75",
              timestamp: Date.now() - 86400000 * 3,
              status: "confirmed",
              address: "raLVdGg8mWdtvwjNoHFGMdArKfy9jmysFvWx1vpFJSRA"
            },
            {
              id: "e2e5b116e9051c5eda5f823c5bf6500e1ece424a456502df88c66338429e3927",
              type: "sent",
              amount: "0.50",
              timestamp: Date.now() - 86400000 * 7,
              status: "confirmed",
              address: "ra2B7pHFJDYLpH8bEawYxcDQbAUAkNf1wjoYCT5xbGz8"
            }
          ];
          
          setTransactions(mockTransactions);
          toast.info("Using sample transaction data for this demo address", {
            description: "Connect your own wallet to see real transaction history"
          });
        } else {
          setTransactions([]);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTransactions();
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

  // Format amount with appropriate precision
  const formatAmount = (amount: string) => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) return "0.00";
    
    return amountNum < 0.0001 
      ? amountNum.toExponential(4) 
      : amountNum.toLocaleString(undefined, { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 4 
        });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>Recent activity on your wallet</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground mb-2">No transactions found</p>
            <p className="text-sm text-muted-foreground">This wallet may be new or has no activity yet</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="hidden sm:table-cell">Address</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {tx.type === 'received' ? (
                        <ArrowDownLeft className="h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 text-blue-500" />
                      )}
                      <Badge variant={tx.type === 'received' ? 'outline' : 'secondary'} className="capitalize">
                        {tx.type}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className={tx.type === 'received' ? 'text-green-500' : 'text-blue-500'}>
                    {tx.type === 'received' ? '+' : '-'} {formatAmount(tx.amount)} ALPH
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{truncateAddress(tx.address)}</TableCell>
                  <TableCell className="hidden md:table-cell">{formatDate(tx.timestamp)}</TableCell>
                  <TableCell className="text-right">
                    <a
                      href={`https://explorer.alephium.org/transactions/${tx.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-primary hover:underline"
                    >
                      View <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionsList;
