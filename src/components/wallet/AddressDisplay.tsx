
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, CheckCheck } from "lucide-react";
import { toast } from "@/lib/toast";

interface AddressDisplayProps {
  address: string;
  label?: string;
}

const AddressDisplay = ({ address, label = "Your Address" }: AddressDisplayProps) => {
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
      <CardContent className="flex items-center justify-between py-1 px-2">
        <div className="flex items-center gap-1">
          <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center mr-1">
            <span className="text-xs font-medium">ID</span>
          </div>
          <div>
            <p className="text-xs font-medium truncate max-w-[120px]">{label}</p>
            <p className="text-xs text-muted-foreground">
              {formatAddress(address)}
            </p>
          </div>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={copyToClipboard} 
          className="h-6 w-6 p-0"
        >
          {copied ? <CheckCheck className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          <span className="sr-only">Copy address</span>
        </Button>
      </CardContent>
    </Card>
  );
};

export default AddressDisplay;

