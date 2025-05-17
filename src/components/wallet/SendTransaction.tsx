
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWallet } from "@alephium/web3-react";
import { sendTransaction } from "@/lib/api/alephiumApi";
import { toast } from "sonner";
import { Send } from "lucide-react";

interface SendTransactionProps {
  fromAddress: string;
}

const SendTransaction = ({ fromAddress }: SendTransactionProps) => {
  const wallet = useWallet();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [signerReady, setSignerReady] = useState(false);
  const [sigType, setSigType] = useState<string>("unknown");
  const [pubKeyDisplay, setPubKeyDisplay] = useState<string>("");
  
  // Check if the signer is properly initialized
  useEffect(() => {
    const checkSigner = async () => {
      if (wallet.signer && wallet.connectionStatus === 'connected') {
        try {
          // Check if wallet has an account, which should include the public key
          if (wallet.signer && wallet.account) {
            setSignerReady(true);
            console.log("Signer ready with address:", wallet.account.address);
            
            if (wallet.account.publicKey) {
              console.log("Public key available:", wallet.account.publicKey);
              
              let pubkey = wallet.account.publicKey;
              if (pubkey.startsWith('0x')) {
                pubkey = pubkey.substring(2);
              }
              
              // Determine signature type based on key length
              if (pubkey.length === 64) {
                setSigType("schnorr");
                console.log("Using Schnorr signature scheme (32-byte public key)");
              } else if (pubkey.length === 66) {
                setSigType("ecdsa");
                console.log("Using ECDSA signature scheme (33-byte public key)");
              } else {
                setSigType("unknown");
                console.warn(`Unusual public key length: ${pubkey.length}. Type unknown.`);
              }
              
              // Set a shortened version of the pubkey for display
              setPubKeyDisplay(pubkey.substring(0, 6) + "..." + pubkey.substring(pubkey.length - 4));
            } else {
              console.warn("Public key not available in account");
              setSigType("unknown");
              setPubKeyDisplay("Not available");
            }
          } else {
            console.warn("Signer is connected but missing account info");
            setSignerReady(false);
          }
        } catch (error) {
          console.error("Error checking signer:", error);
          setSignerReady(false);
        }
      } else {
        setSignerReady(false);
      }
    };
    
    checkSigner();
  }, [wallet.signer, wallet.connectionStatus, wallet.account]);
  
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!wallet.signer || !signerReady) {
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
      console.log("Starting transaction with:", {
        fromAddress,
        recipient,
        amount: amountValue,
        signatureType: sigType
      });
      
      // Double check we have the public key before proceeding
      if (!wallet.account?.publicKey) {
        throw new Error("Public key not available. Please reconnect your wallet.");
      }
      
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
    <Card className="bg-gradient-to-b from-background to-muted/20 border-muted">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Send ALPH</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          {sigType !== "unknown" 
            ? `Transfer using ${sigType === "schnorr" ? "Schnorr" : "ECDSA"} signatures (${pubKeyDisplay})` 
            : "Transfer to another address"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSend} className="space-y-3">
          <div className="grid gap-1.5">
            <Label htmlFor="recipient" className="text-xs font-normal text-muted-foreground">Recipient</Label>
            <Input
              id="recipient"
              placeholder="Enter Alephium address"
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
              required
              className="h-8 text-sm bg-background/50 border-muted"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="amount" className="text-xs font-normal text-muted-foreground">Amount</Label>
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
                className="h-8 text-sm bg-background/50 border-muted pr-12"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-xs text-muted-foreground">ALPH</span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Minimum transaction: 0.01 ALPH
            </p>
          </div>
          
          <Button 
            className="w-full mt-3 bg-primary/90 hover:bg-primary" 
            type="submit"
            size="sm" 
            disabled={isLoading || !signerReady}
          >
            {isLoading ? "Processing..." : (
              <>
                <Send className="mr-1 h-3.5 w-3.5" /> Send ALPH
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SendTransaction;
