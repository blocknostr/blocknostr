
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { SavedWallet } from "@/types/wallet";
import { Button } from "@/components/ui/button";
import { Check, ExternalLink, Plus, Trash2 } from "lucide-react";
import { removeWallet, setActiveWallet } from "@/lib/nostr/utils/wallet-persistence";
import { toast } from "sonner";

interface WalletSelectorProps {
  wallets: SavedWallet[];
  activeWalletIndex: number;
  onWalletChange: () => void;
  onAddWallet: () => void;
  isLoggedIn: boolean;
}

export function WalletSelector({ 
  wallets, 
  activeWalletIndex,
  onWalletChange,
  onAddWallet,
  isLoggedIn
}: WalletSelectorProps) {
  const handleWalletSelect = async (index: number) => {
    if (index === activeWalletIndex) return;
    
    const success = await setActiveWallet(index);
    if (success) {
      onWalletChange();
    }
  };
  
  const handleWalletRemove = async (address: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (wallets.length <= 1) {
      toast.error("Cannot remove your only wallet");
      return;
    }
    
    const success = await removeWallet(address);
    if (success) {
      toast.success("Wallet removed");
      onWalletChange();
    }
  };
  
  // Format wallet address for display
  const formatAddress = (address: string) => {
    if (address.length <= 13) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 6)}`;
  };

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium mb-2">Your Wallets</h3>
      <div className="flex flex-wrap gap-2">
        {wallets.map((wallet, index) => (
          <Card 
            key={wallet.address}
            className={`cursor-pointer hover:bg-muted/50 transition-colors ${index === activeWalletIndex ? 'border-primary' : ''}`}
            onClick={() => handleWalletSelect(index)}
          >
            <CardContent className="p-3 flex items-center justify-between gap-2">
              <div>
                <p className="font-medium text-sm">{wallet.label || formatAddress(wallet.address)}</p>
                <p className="text-xs text-muted-foreground">{formatAddress(wallet.address)}</p>
              </div>
              <div className="flex items-center gap-1">
                {index === activeWalletIndex && (
                  <Check size={16} className="text-primary" />
                )}
                <Button
                  variant="ghost" 
                  size="icon"
                  className="h-6 w-6 text-destructive"
                  onClick={(e) => handleWalletRemove(wallet.address, e)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {wallets.length < 6 && isLoggedIn && (
          <Button 
            variant="outline" 
            className="h-auto flex flex-col p-3" 
            onClick={onAddWallet}
          >
            <Plus size={16} className="mb-1" />
            <span className="text-xs">Add Wallet</span>
          </Button>
        )}
        
        {!isLoggedIn && wallets.length === 0 && (
          <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 w-full p-3">
            <div className="flex items-start gap-2 text-amber-800 dark:text-amber-400">
              <ExternalLink className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <span className="text-sm">
                Connect your Nostr account to add and manage multiple wallets.
              </span>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export default WalletSelector;
