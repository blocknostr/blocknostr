
import React, { useState } from "react";
import { useWallet } from "@alephium/web3-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Send, AlertCircle } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  address: z
    .string()
    .min(1, "Destination address is required")
    .refine(
      (address) => /^[a-zA-Z0-9]{50,60}$/.test(address),
      "Please enter a valid Alephium address"
    ),
  amount: z.coerce
    .number()
    .min(0.000000000000000001, "Amount must be greater than 0")
    .max(100000, "Amount too large"),
});

interface SendTransactionFormProps {
  onCancel: () => void;
  fixedAmount?: number;
}

const SendTransactionForm = ({ onCancel, fixedAmount }: SendTransactionFormProps) => {
  const wallet = useWallet();
  const [isSending, setIsSending] = useState(false);
  const connected = wallet.connectionStatus === 'connected';

  // Use the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: "",
      amount: fixedAmount || 0.1,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!wallet.signer || !wallet.account) {
      toast.error("Wallet not connected");
      return;
    }

    setIsSending(true);
    try {
      // Convert ALPH to alphAmount (1 ALPH = 10^18 alphAmount)
      const alphAmount = BigInt(Math.floor(values.amount * 10**18));
      
      // Call the signer's transfer method
      const result = await wallet.signer.signAndSubmitTransferTx({
        signerAddress: wallet.account.address,
        destinations: [{
          address: values.address,
          attoAlphAmount: alphAmount
        }]
      });

      toast.success("Transaction submitted successfully", {
        description: "Your transaction is being processed",
      });

      // Reset form and close
      form.reset();
      onCancel();

    } catch (error) {
      console.error("Transaction error:", error);
      toast.error("Failed to send transaction", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsSending(false);
    }
  };

  // Disable form if wallet isn't connected
  if (!connected) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Send ALPH</CardTitle>
          <CardDescription>Connect your wallet to send ALPH</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center p-4 text-center space-y-2 border border-dashed rounded-lg">
            <div className="flex flex-col items-center gap-3">
              <AlertCircle className="h-8 w-8 text-amber-500" />
              <p className="text-sm text-muted-foreground">Please connect your wallet to send transactions</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>Close</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Send ALPH</CardTitle>
        <CardDescription>Transfer ALPH to another address</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destination Address</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter recipient address" 
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter a valid Alephium address
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (ALPH)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.0000001"
                      disabled={fixedAmount !== undefined}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Amount of ALPH to send
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-lg bg-muted p-3 mt-2">
              <div className="flex justify-between text-sm">
                <span>Network Fee:</span>
                <span>~0.0001 ALPH</span>
              </div>
            </div>

          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSending}>
              {isSending ? (
                <>Sending...</>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send {fixedAmount ?? form.getValues("amount")} ALPH
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default SendTransactionForm;
