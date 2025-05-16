
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
      // In a real app, you'd want to catch any signer or signature errors here
      const result = await sendTransaction(
        fromAddress,
        recipient,
        amountValue,
        wallet.signer
      );
      
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
    <Card>
      <CardHeader>
        <CardTitle>Send ALPH</CardTitle>
        <CardDescription>Transfer ALPH to another address</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSend}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="recipient">Recipient Address</Label>
              <Input
                id="recipient"
                placeholder="Enter Alephium address"
                value={recipient}
                onChange={e => setRecipient(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (ALPH)</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.0"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-sm text-muted-foreground">ALPH</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum transaction: 0.01 ALPH
              </p>
            </div>
          </div>
          
          <Button 
            className="w-full mt-6" 
            type="submit" 
            disabled={isLoading || !wallet.signer}
          >
            {isLoading ? "Processing..." : (
              <>
                Send <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SendTransaction;
