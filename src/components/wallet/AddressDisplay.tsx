
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, CheckCheck, Pencil } from "lucide-react";
import { toast } from "sonner";
import { SavedWallet } from "@/hooks/use-saved-wallets";

interface AddressDisplayProps {
  wallet: SavedWallet;
  onLabelEdit?: (address: string, newLabel: string) => void;
  className?: string;
}

const AddressDisplay = ({ 
  wallet, 
  onLabelEdit,
  className 
}: AddressDisplayProps) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newLabel, setNewLabel] = useState(wallet.label);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    toast.success("Address copied to clipboard");
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  // Format address for display
  const formatAddress = (addr: string) => {
    if (!addr) return "";
    if (addr.length <= 12) return addr;
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 6)}`;
  };

  const handleEditSave = () => {
    if (isEditing) {
      onLabelEdit?.(wallet.address, newLabel);
    }
    setIsEditing(!isEditing);
  };

  return (
    <Card className={`bg-muted/50 ${className}`}>
      <CardContent className="flex items-center justify-between py-2 px-3">
        {isEditing ? (
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="text-xs font-medium bg-background border px-1 py-0.5 rounded w-24 sm:w-32"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleEditSave();
                }
              }}
            />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleEditSave}
              className="h-5 w-5 p-0"
            >
              <CheckCheck className="h-3 w-3" />
              <span className="sr-only">Save label</span>
            </Button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <div className="flex flex-col">
              <p className="text-xs font-medium">
                {wallet.label || "Your Address"}
                {onLabelEdit && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleEditSave}
                    className="h-5 w-5 p-0 ml-1"
                  >
                    <Pencil className="h-3 w-3" />
                    <span className="sr-only">Edit label</span>
                  </Button>
                )}
              </p>
              <p className="text-xs text-muted-foreground break-all sm:break-normal">
                {formatAddress(wallet.address)}
              </p>
            </div>
          </div>
        )}
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={copyToClipboard} 
          className="h-7 px-2 py-0"
        >
          {copied ? <CheckCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          <span className="sr-only">Copy address</span>
        </Button>
      </CardContent>
    </Card>
  );
};

export default AddressDisplay;
