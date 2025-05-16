
import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SavedWallet } from "@/hooks/use-saved-wallets";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface AddWalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddWallet: (address: string, label: string) => void;
  existingWallets: SavedWallet[];
}

const AddWalletDialog: React.FC<AddWalletDialogProps> = ({ 
  open, 
  onOpenChange,
  onAddWallet,
  existingWallets 
}) => {
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!address.trim()) {
      setValidationError("Wallet address is required");
      return;
    }

    // Check for existing address
    const addressExists = existingWallets.some(wallet => wallet.address.toLowerCase() === address.toLowerCase());
    if (addressExists) {
      setValidationError("This wallet address is already in your list");
      return;
    }

    // Basic format validation for Alephium addresses
    if (!address.startsWith("1") && !address.startsWith("r") && address.length !== 58) {
      setValidationError("Please enter a valid Alephium wallet address");
      return;
    }

    setIsSubmitting(true);
    
    // Add the wallet and close the dialog
    onAddWallet(address, label || `Wallet ${existingWallets.length + 1}`);
    
    // Reset form
    setAddress("");
    setLabel("");
    setValidationError("");
    setIsSubmitting(false);
    onOpenChange(false);
    
    // Show privacy notice
    toast.info("Privacy Notice", {
      description: "Wallet data is stored locally on your device only, not on blockchain or relays. You have full control over your data."
    });
  };

  const handleClose = () => {
    setAddress("");
    setLabel("");
    setValidationError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Wallet</DialogTitle>
          <DialogDescription>
            Enter an Alephium wallet address to track its balances and transactions
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-sm">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Wallet addresses are stored locally on your device only and are never shared with servers or the blockchain.
            </AlertDescription>
          </Alert>
          
          <div className="grid gap-2">
            <Label htmlFor="address">Wallet Address</Label>
            <Input
              id="address"
              placeholder="raLUPHsewjm1iA2kBzRKXB2ntbj3j4puxbVvsZD8iK3r"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setValidationError("");
              }}
            />
            {validationError && (
              <p className="text-xs text-destructive mt-1">{validationError}</p>
            )}
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="label">Label (Optional)</Label>
            <Input
              id="label"
              placeholder="My Wallet"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Add a name to easily identify this wallet
            </p>
          </div>
          
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !address.trim()}>
              {isSubmitting ? "Adding..." : "Add Wallet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddWalletDialog;
