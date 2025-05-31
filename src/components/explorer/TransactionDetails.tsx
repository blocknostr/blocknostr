import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Hash, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowRightLeft, 
  RefreshCw, 
  ExternalLink,
  Clock,
  Blocks,
  Fuel,
  Eye,
  Copy
} from "lucide-react";
import { truncateAddress } from "@/lib/utils/formatters";
import { 
  getTransactionType,
  getTransactionAmountForDisplay,
  getCounterpartyAddress,
  deltaAmountForAddress,
  deltaTokenAmountForAddress
} from "@/lib/utils/officialTransactionParser";

interface TransactionDetailsProps {
  transaction: any;
  address?: string; // Current wallet address for perspective
}

const TransactionDetails: React.FC<TransactionDetailsProps> = ({ 
  transaction, 
  address 
}) => {
  if (!transaction) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Hash className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-medium mb-2">No Transaction Selected</h3>
          <p className="text-sm text-muted-foreground">
            Search for a transaction to view details
          </p>
        </CardContent>
      </Card>
    );
  }

  // Use official parsing logic if we have an address perspective
  const parsedData = address ? {
    type: getTransactionType(address, transaction),
    amount: getTransactionAmountForDisplay(address, transaction),
    counterparty: getCounterpartyAddress(address, transaction),
    alphDelta: deltaAmountForAddress(address, transaction.inputs, transaction.outputs),
    tokenDeltas: deltaTokenAmountForAddress(address, transaction.inputs, transaction.outputs)
  } : null;

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      full: date.toISOString()
    };
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
        return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300";
      case 'sent':
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300";
      case 'swap':
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300";
      case 'internal':
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300";
    }
  };

  const timestamp = formatDate(transaction.timestamp);
  const gasAmount = transaction.gasAmount || 0;
  const gasPrice = transaction.gasPrice || 0;
  const gasFee = (gasAmount * gasPrice) / 1e18;

  return (
    <div className="space-y-6">
      {/* Transaction Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Transaction Details
              </CardTitle>
              <CardDescription className="font-mono text-xs break-all">
                {transaction.hash}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(transaction.hash)}
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a
                  href={`https://explorer.alephium.org/transactions/${transaction.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Explorer
                </a>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Transaction Type (if we have address perspective) */}
            {parsedData && (
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                {getTypeIcon(parsedData.type)}
                <div>
                  <div className="font-medium capitalize">{parsedData.type}</div>
                  <Badge variant="secondary" className={getTypeColor(parsedData.type)}>
                    {parsedData.type === 'received' ? '+' : 
                     parsedData.type === 'swap' ? '±' : 
                     parsedData.type === 'internal' ? '↻' : 
                     '-'} {parsedData.amount.toFixed(4)} ALPH
                  </Badge>
                </div>
              </div>
            )}

            {/* Timestamp */}
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">{timestamp.date}</div>
                <div className="text-sm text-muted-foreground">{timestamp.time}</div>
              </div>
            </div>

            {/* Block */}
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Blocks className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">Block</div>
                <div className="text-sm text-muted-foreground font-mono">
                  {truncateAddress(transaction.blockHash)}
                </div>
              </div>
            </div>

            {/* Gas Fee */}
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Fuel className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">{gasFee.toFixed(6)} ALPH</div>
                <div className="text-sm text-muted-foreground">Gas Fee</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ALPH Movements (if we have address perspective) */}
      {parsedData && (
        <Card>
          <CardHeader>
            <CardTitle>ALPH Movement</CardTitle>
            <CardDescription>
              Net ALPH change from this transaction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getTypeIcon(parsedData.type)}
                  <div>
                    <div className="font-medium">
                      {parsedData.type === 'received' ? 'Received from' : 
                       parsedData.type === 'sent' ? 'Sent to' : 
                       parsedData.type === 'swap' ? 'Swapped with' : 
                       'Interacted with'}
                    </div>
                    <div className="text-sm text-muted-foreground font-mono">
                      {parsedData.counterparty !== 'Unknown' ? truncateAddress(parsedData.counterparty) : 'Unknown'}
                    </div>
                  </div>
                </div>
                <div className={`text-lg font-bold ${
                  parsedData.alphDelta > 0n ? 'text-green-500' : 
                  parsedData.alphDelta < 0n ? 'text-red-500' : 
                  'text-gray-500'
                }`}>
                  {parsedData.alphDelta > 0n ? '+' : ''}
                  {(Number(parsedData.alphDelta) / 1e18).toFixed(6)} ALPH
                </div>
              </div>

              {gasFee > 0 && (
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                  <div className="flex items-center gap-3">
                    <Fuel className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Gas Fee</div>
                      <div className="text-sm text-muted-foreground">
                        {gasAmount.toLocaleString()} gas × {(gasPrice / 1e9).toFixed(2)} GWei
                      </div>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-red-500">
                    -{gasFee.toFixed(6)} ALPH
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Token Movements (if we have address perspective) */}
      {parsedData && parsedData.tokenDeltas.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Token Movements</CardTitle>
            <CardDescription>
              Token changes from this transaction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from(parsedData.tokenDeltas.entries()).map(([tokenId, delta]) => (
                <div key={tokenId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Token</div>
                    <div className="text-sm text-muted-foreground font-mono">
                      {truncateAddress(tokenId)}
                    </div>
                  </div>
                  <div className={`font-bold ${
                    delta > 0n ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {delta > 0n ? '+' : ''}{delta.toString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inputs */}
      <Card>
        <CardHeader>
          <CardTitle>Inputs ({transaction.inputs?.length || 0})</CardTitle>
          <CardDescription>
            UTXOs consumed by this transaction
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(!transaction.inputs || transaction.inputs.length === 0) ? (
            <div className="text-center py-8 text-muted-foreground">
              No inputs (coinbase transaction)
            </div>
          ) : (
            <div className="space-y-3">
              {transaction.inputs.map((input: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-mono text-sm">
                      {input.address ? truncateAddress(input.address) : 'Unknown Address'}
                    </div>
                    {input.tokens && input.tokens.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {input.tokens.length} token(s)
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {input.attoAlphAmount ? 
                        (Number(input.attoAlphAmount) / 1e18).toFixed(6) : 
                        (input.amount ? Number(input.amount) / 1e18 : 0).toFixed(6)
                      } ALPH
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Outputs */}
      <Card>
        <CardHeader>
          <CardTitle>Outputs ({transaction.outputs?.length || 0})</CardTitle>
          <CardDescription>
            UTXOs created by this transaction
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(!transaction.outputs || transaction.outputs.length === 0) ? (
            <div className="text-center py-8 text-muted-foreground">
              No outputs
            </div>
          ) : (
            <div className="space-y-3">
              {transaction.outputs.map((output: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-mono text-sm">
                      {truncateAddress(output.address)}
                    </div>
                    {output.tokens && output.tokens.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {output.tokens.length} token(s)
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {output.attoAlphAmount ? 
                        (Number(output.attoAlphAmount) / 1e18).toFixed(6) : 
                        (output.amount ? Number(output.amount) / 1e18 : 0).toFixed(6)
                      } ALPH
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Raw Transaction Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Raw Transaction Data
          </CardTitle>
          <CardDescription>
            Complete transaction object for debugging
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
            {JSON.stringify(transaction, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionDetails; 
