
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { alephiumService } from "@/lib/alephium";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

const SendTransactionForm = () => {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isSending, setIsSending] = useState(false);
  
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipient || !amount) {
      toast.error("Please fill all fields");
      return;
    }
    
    try {
      setIsSending(true);
      
      // Convert amount to smallest unit (10^18)
      const amountInSmallestUnit = (parseFloat(amount) * 10**18).toString();
      
      const txId = await alephiumService.sendTransaction(recipient, amountInSmallestUnit);
      
      if (txId) {
        toast.success("Transaction sent successfully!");
        setRecipient("");
        setAmount("");
      }
    } catch (error) {
      console.error("Error sending transaction:", error);
      toast.error("Failed to send transaction");
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Send ALPH</CardTitle>
      </CardHeader>
      <form onSubmit={handleSend}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Address</Label>
            <Input
              id="recipient"
              placeholder="Recipient's Alephium address"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (ALPH)</Label>
            <Input
              id="amount"
              type="number"
              step="0.000000000000000001"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            type="submit" 
            disabled={isSending || !recipient || !amount}
            className="w-full"
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Transaction
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default SendTransactionForm;
