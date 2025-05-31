import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/business/useWallet';
import { Wallet, ArrowUpDown, ExternalLink, RefreshCw } from 'lucide-react';

interface WalletCardProps {
  address: string;
  showDetails?: boolean;
}

/**
 * Simplified WalletCard component that uses the unified useWallet hook
 * Works with both legacy and Redux wallet data management
 */
const WalletCard: React.FC<WalletCardProps> = ({ 
  address,
  showDetails = true
}) => {
  // Use the unified wallet hook
  const { 
    wallet, 
    isLoading, 
    error, 
    isReduxEnabled,
    fetchWallet 
  } = useWallet(address, { autoFetch: true });
  
  // Format address for display
  const shortAddress = address?.slice(0, 8) + '...' + address?.slice(-4);
  
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="py-3">
          <div className="flex items-center gap-3">
            <div className="rounded-full h-10 w-10 bg-muted flex items-center justify-center">
              <Wallet className="h-5 w-5 text-muted-foreground opacity-30" />
            </div>
            <div className="w-24 h-5 bg-muted rounded"></div>
          </div>
        </CardHeader>
        <CardContent className="py-3">
          <div className="space-y-2">
            <div className="w-3/4 h-4 bg-muted rounded"></div>
            <div className="w-1/2 h-4 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardContent className="py-4">
          <div className="text-center">
            <p className="text-sm text-red-500 mb-2">Failed to load wallet</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchWallet()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!wallet) {
    return (
      <Card>
        <CardContent className="py-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Wallet not found</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Format balance
  const balance = wallet.balance?.balance || 0;
  const formattedBalance = typeof balance === 'number' 
    ? balance.toFixed(4) 
    : parseFloat(balance.toString()).toFixed(4);
  
  return (
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center gap-3">
          <div className="rounded-full h-10 w-10 bg-primary/10 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 overflow-hidden">
            <CardTitle className="text-base truncate">
              {wallet.label || shortAddress}
            </CardTitle>
            <p className="text-xs text-muted-foreground truncate">
              {shortAddress}
            </p>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <Badge variant={isReduxEnabled ? 'default' : 'secondary'} className="text-xs">
              {isReduxEnabled ? 'Redux' : 'Legacy'}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      {showDetails && (
        <CardContent className="py-3">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Balance:</span>
              <span className="font-medium">{formattedBalance} {wallet.network}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge variant={wallet.isConnected ? "default" : "outline"}>
                {wallet.isConnected ? "Connected" : "Watch-only"}
              </Badge>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button size="sm" variant="outline" className="flex-1">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Transactions
              </Button>
              <Button size="sm" variant="outline" className="flex-1">
                <ExternalLink className="h-4 w-4 mr-2" />
                Explorer
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default WalletCard; 
