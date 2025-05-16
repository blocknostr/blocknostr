
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, CheckCheck } from "lucide-react";
import { toast } from "sonner";

interface AddressDisplayProps {
  address: string;
}

const AddressDisplay = ({ address }: AddressDisplayProps) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(address);
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

  return (
    <Card className="bg-muted/50">
      <CardContent className="flex items-center justify-between py-2 px-3">
        <div className="flex items-center space-x-2">
          <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-xs font-medium">ID</span>
          </div>
          <div>
            <p className="text-xs font-medium">Your Address</p>
            <p className="text-xs text-muted-foreground break-all sm:break-normal">
              {formatAddress(address)}
            </p>
          </div>
        </div>
        
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
