
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWallet } from "@alephium/web3-react";
import { sendTransaction } from "@/lib/api/alephiumApi";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";

interface SendTransactionProps {
  fromAddress: string;
}

const SendTransaction = ({ fromAddress }: SendTransactionProps) => {
  const wallet = useWallet();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!wallet.signer) {
      toast.error("Wallet not connected", {
        description: "Please connect your wallet to send transactions"
      });
      return;
    }
    
    if (!recipient) {
      toast.error("Invalid recipient", {
        description: "Please enter a valid Alephium address"
      });
      return;
    }
    
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast.error("Invalid amount", {
        description: "Please enter a valid amount greater than 0"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log("Sending transaction:", {
        fromAddress,
        recipient,
        amount: amountValue
      });
      
      const result = await sendTransaction(
        fromAddress,
        recipient,
        amountValue,
        wallet.signer
      );
      
      console.log("Transaction result:", result);
      
      toast.success("Transaction submitted", {
        description: `Transaction ID: ${result.txId.substring(0, 10)}...`
      });
      
      // Reset form
      setRecipient("");
      setAmount("");
    } catch (error) {
      console.error("Transaction error:", error);
      toast.error("Transaction failed", {
        description: error instanceof Error ? error.message : "Unknown error occurred"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Send ALPH</CardTitle>
        <CardDescription className="text-xs">Transfer to another address</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSend} className="space-y-3">
          <div className="grid gap-1.5">
            <Label htmlFor="recipient" className="text-xs">Recipient Address</Label>
            <Input
              id="recipient"
              placeholder="Enter Alephium address"
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
              required
              className="h-8 text-sm"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="amount" className="text-xs">Amount (ALPH)</Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                placeholder="0.0"
                step="0.000001"
                min="0.000001"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                className="h-8 text-sm"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-xs text-muted-foreground">ALPH</span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Minimum transaction: 0.000001 ALPH
            </p>
          </div>
          
          <Button 
            className="w-full mt-3" 
            type="submit"
            size="sm" 
            disabled={isLoading || !wallet.signer}
          >
            {isLoading ? "Processing..." : (
              <>
                Send <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SendTransaction;
