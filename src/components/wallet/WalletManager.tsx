
import React, { useState, useEffect } from "react";
import { PlusCircle, Trash2, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import AddressDisplay from "./AddressDisplay";
import { safeLocalStorageSet, safeLocalStorageGet } from "@/lib/utils/storage";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { checkCacheAvailability } from "@/lib/nostr/utils/storage-quota";

interface SavedWallet {
  address: string;
  label: string;
  dateAdded: number;
}

interface WalletManagerProps {
  currentAddress: string;
  onSelectWallet: (address: string) => void;
}

const WalletManager: React.FC<WalletManagerProps> = ({ currentAddress, onSelectWallet }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [savedWallets, setSavedWallets] = useLocalStorage<SavedWallet[]>("blocknoster_saved_wallets", []);

  const handleAddWallet = async () => {
    if (!newAddress) {
      toast.error("Please enter a wallet address");
      return;
    }

    // Basic validation for Alephium addresses
    if (!newAddress.startsWith("1") && !newAddress.startsWith("r")) {
      toast.error("Invalid Alephium address format");
      return;
    }

    // Check if wallet already exists
    if (savedWallets.some(wallet => wallet.address === newAddress)) {
      toast.error("This wallet is already in your list");
      return;
    }

    // Check if we have space in local storage
    const hasSpace = await checkCacheAvailability();
    if (!hasSpace) {
      toast.error("Local storage space is limited. Please remove some wallets first.");
      return;
    }

    // Add the new wallet
    const label = newLabel.trim() || `Wallet ${savedWallets.length + 1}`;
    const newWallet: SavedWallet = {
      address: newAddress,
      label,
      dateAdded: Date.now()
    };

    setSavedWallets([...savedWallets, newWallet]);
    setNewAddress("");
    setNewLabel("");
    setIsAdding(false);
    toast.success(`Added ${label}`);

    // Select the new wallet
    onSelectWallet(newAddress);
  };

  const handleRemoveWallet = (address: string) => {
    setSavedWallets(savedWallets.filter(wallet => wallet.address !== address));
    
    // If removing the currently selected wallet, select another one
    if (address === currentAddress && savedWallets.length > 1) {
      const nextWallet = savedWallets.find(wallet => wallet.address !== address);
      if (nextWallet) {
        onSelectWallet(nextWallet.address);
      }
    }
    
    toast.success("Wallet removed");
  };

  const handleSelectWallet = (address: string) => {
    onSelectWallet(address);
  };

  return (
    <Card className="bg-card/50 border-primary/10 h-full flex flex-col">
      <CardHeader className="py-3 px-4">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              Tracked Wallets
              <TooltipProvider>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    We do not track or store any wallet information. Addresses are only saved in your browser's local storage to protect your privacy.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <CardDescription className="text-xs">Select or add wallets to track</CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsAdding(!isAdding)} 
            className="h-7 px-2"
          >
            <PlusCircle className="h-4 w-4 mr-1" />
            <span className="text-xs">Add</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 py-2 space-y-2 flex-grow overflow-hidden flex flex-col">
        {isAdding && (
          <div className="rounded-md bg-muted/50 p-2 space-y-2 mb-3">
            <Input 
              placeholder="Alephium address" 
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              className="h-8 text-xs"
            />
            <Input 
              placeholder="Label (optional)" 
              value={newLabel} 
              onChange={(e) => setNewLabel(e.target.value)}
              className="h-8 text-xs"
            />
            <div className="flex justify-end gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsAdding(false)}
                className="h-7 text-xs"
              >
                Cancel
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleAddWallet}
                className="h-7 text-xs"
              >
                Save
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2 flex-grow overflow-y-auto pr-1">
          {savedWallets.map((wallet) => (
            <div 
              key={wallet.address} 
              className={`flex items-center gap-2 ${wallet.address === currentAddress ? 'opacity-100' : 'opacity-70'}`}
              onClick={() => handleSelectWallet(wallet.address)}
            >
              <div className="flex-grow cursor-pointer">
                <AddressDisplay address={wallet.address} label={wallet.label} />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveWallet(wallet.address);
                }}
                className="h-6 w-6 p-0"
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" />
                <span className="sr-only">Remove wallet</span>
              </Button>
            </div>
          ))}

          {savedWallets.length === 0 && !isAdding && (
            <div className="text-center py-4 text-xs text-muted-foreground">
              No wallets added yet. Click "Add" to track a wallet.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletManager;
