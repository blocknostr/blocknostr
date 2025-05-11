
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { toast } from "sonner";
import { nostrService } from "@/lib/nostr";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Slider
} from "@/components/ui/slider";
import { Input } from "@/components/ui/input";

interface ZapButtonProps {
  eventId: string;
  pubkey: string;
  zapCount: number;
  zapAmount: number;
  userHasZapped: boolean;
  onZap: (amount: number) => void;
}

const ZapButton: React.FC<ZapButtonProps> = ({ 
  eventId, 
  pubkey, 
  zapCount, 
  zapAmount,
  userHasZapped,
  onZap 
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [amount, setAmount] = useState(1000); // Default to 1000 sats
  const [isZapping, setIsZapping] = useState(false);
  const isLoggedIn = !!nostrService.publicKey;
  
  const predefinedAmounts = [100, 500, 1000, 5000, 10000, 50000, 100000];
  
  const handleZap = async () => {
    if (!isLoggedIn) {
      toast.error("You must be logged in to send zaps");
      return;
    }
    
    setIsZapping(true);
    
    try {
      // In a production app, this would call a Lightning wallet
      // For this demo, we'll just simulate the zap
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Call the onZap callback with the amount
      onZap(amount);
      
      toast.success(`Zap of ${amount} sats sent!`);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error sending zap:", error);
      toast.error("Failed to send zap");
    } finally {
      setIsZapping(false);
    }
  };
  
  // Format sats with k for thousands
  const formatSats = (sats: number): string => {
    if (sats >= 1000) {
      return `${(sats / 1000).toFixed(1)}k`;
    }
    return sats.toString();
  };
  
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className={`rounded-full hover:text-yellow-500 hover:bg-yellow-500/10 ${userHasZapped ? 'text-yellow-500' : ''}`}
          title="Zap sats"
        >
          <Zap className="h-[18px] w-[18px]" />
          {zapCount > 0 && (
            <span className="ml-1 text-xs">
              {zapCount > 0 && zapCount}
              {zapAmount > 0 && ` (${formatSats(zapAmount)})`}
            </span>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send a Zap</DialogTitle>
          <DialogDescription>
            Send sats via Lightning to show appreciation for this post.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col space-y-4 py-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Amount (sats)</span>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-24 text-right"
              min={1}
            />
          </div>
          
          <Slider
            value={[amount]}
            min={1}
            max={100000}
            step={1}
            onValueChange={(value) => setAmount(value[0])}
            className="mt-2"
          />
          
          <div className="flex flex-wrap gap-2 mt-2">
            {predefinedAmounts.map((amt) => (
              <Button 
                key={amt} 
                variant="outline" 
                size="sm"
                onClick={() => setAmount(amt)}
                className={amount === amt ? "bg-primary text-primary-foreground" : ""}
              >
                {formatSats(amt)}
              </Button>
            ))}
          </div>
        </div>
        
        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleZap} 
            disabled={isZapping || amount <= 0}
            className="gap-2"
          >
            <Zap className="h-4 w-4" />
            {isZapping ? "Processing..." : "Zap!"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ZapButton;
