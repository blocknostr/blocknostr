
import React, { useState } from "react";
import { Wallet, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { SavedWallet } from "@/hooks/use-saved-wallets";
import AddWalletDialog from "./AddWalletDialog";
import { cn } from "@/lib/utils";

interface WalletSelectorProps {
  wallets: SavedWallet[];
  activeWalletIndex: number;
  onSelectWallet: (address: string) => void;
  onAddWallet: (address: string, label: string) => void;
  onRemoveWallet: (address: string) => void;
  className?: string;
}

const WalletSelector: React.FC<WalletSelectorProps> = ({
  wallets,
  activeWalletIndex,
  onSelectWallet,
  onAddWallet,
  onRemoveWallet,
  className
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const activeWallet = wallets[activeWalletIndex];
  
  const formatAddress = (addr: string) => {
    if (!addr) return "";
    if (addr.length <= 12) return addr;
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 6)}`;
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className={cn("flex justify-between w-full max-w-xs", className)}
          >
            <div className="flex items-center">
              <Wallet className="h-4 w-4 mr-2" />
              <span className="truncate">
                {activeWallet ? (activeWallet.label || formatAddress(activeWallet.address)) : "Select Wallet"}
              </span>
            </div>
            <span className="sr-only">Open wallet selector</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-[260px]">
          {wallets.length > 0 ? (
            <>
              {wallets.map((wallet, index) => (
                <DropdownMenuItem 
                  key={wallet.address}
                  className={cn(
                    "flex items-center justify-between cursor-pointer", 
                    index === activeWalletIndex && "bg-muted"
                  )}
                  onClick={() => onSelectWallet(wallet.address)}
                >
                  <div className="truncate mr-2">
                    <span className="font-medium block text-sm">
                      {wallet.label || `Wallet ${index + 1}`}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatAddress(wallet.address)}</span>
                  </div>
                  
                  {wallets.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-70 hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveWallet(wallet.address);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="sr-only">Remove wallet</span>
                    </Button>
                  )}
                </DropdownMenuItem>
              ))}
              
              <DropdownMenuSeparator />
            </>
          ) : (
            <div className="px-2 py-3 text-center text-sm text-muted-foreground">
              No wallets added yet
            </div>
          )}
          
          <DropdownMenuItem 
            className="cursor-pointer flex items-center justify-center text-primary"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Wallet
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AddWalletDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAddWallet={onAddWallet}
        existingWallets={wallets}
      />
    </>
  );
};

export default WalletSelector;
