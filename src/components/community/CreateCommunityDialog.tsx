
import { useState } from "react";
import { Loader2, Plus, CoinIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import { nostrService } from "@/lib/nostr";
import { useNavigate } from "react-router-dom";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Switch } from "@/components/ui/switch";
import { useWallet } from "@alephium/web3-react";
import { alephiumCommunityService } from "@/lib/alephium/communityService";
import WalletConnectButton from "@/components/wallet/WalletConnectButton";

interface CreateCommunityDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

// Form validation schema with stricter requirements
const formSchema = z.object({
  name: z.string().min(3, {
    message: "Community name must be at least 3 characters.",
  }).refine(name => name.trim() !== '', {
    message: "Community name cannot be empty.",
  }).refine(name => name !== 'Unnamed Community', {
    message: "Community name cannot be 'Unnamed Community'.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }).refine(desc => desc.trim() !== '', {
    message: "Community description cannot be empty.",
  }),
  isPrivate: z.boolean().default(false),
  blockchainEnabled: z.boolean().default(true),
  initialTreasury: z.number().min(0).optional(),
  minQuorum: z.number().min(0).max(100).default(50),
  votingDuration: z.number().min(3600).default(86400), // minimum 1 hour, default 1 day
});

const CreateCommunityDialog = ({ isOpen, setIsOpen }: CreateCommunityDialogProps) => {
  const navigate = useNavigate();
  const [isCreatingCommunity, setIsCreatingCommunity] = useState(false);
  const currentUserPubkey = nostrService.publicKey;
  const wallet = useWallet();
  
  // Setup form with validation
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      isPrivate: false,
      blockchainEnabled: true,
      initialTreasury: 0,
      minQuorum: 50,
      votingDuration: 86400,
    },
  });
  
  // Watch the blockchain enabled field to conditionally render fields
  const blockchainEnabled = form.watch("blockchainEnabled");
  
  const handleCreateCommunity = async (values: z.infer<typeof formSchema>) => {
    if (!currentUserPubkey) {
      toast.error("You must be logged in to create a community");
      return;
    }
    
    setIsCreatingCommunity(true);
    
    try {
      if (blockchainEnabled) {
        // Create on-chain community
        if (wallet.connectionStatus !== 'connected') {
          toast.error("You must connect your wallet to create an on-chain community");
          setIsCreatingCommunity(false);
          return;
        }
        
        const txId = await alephiumCommunityService.createCommunity({
          name: values.name.trim(),
          description: values.description.trim(),
          isPrivate: values.isPrivate,
          initialTreasury: values.initialTreasury,
          minQuorum: values.minQuorum,
          votingDuration: values.votingDuration
        });
        
        if (txId) {
          // Store the transaction ID for future reference
          // Also create normal Nostr community for compatibility
          const communityId = await nostrService.createCommunity(
            values.name.trim(),
            values.description.trim()
          );
          
          if (communityId) {
            toast.success("Community created successfully!", {
              description: "Your community is now being created on the blockchain. You'll be redirected shortly.",
              action: {
                label: "View now",
                onClick: () => navigate(`/communities/${communityId}`),
              }
            });
            
            form.reset();
            setIsOpen(false);
            
            // Navigate to the new community
            setTimeout(() => {
              navigate(`/communities/${communityId}`);
            }, 1000);
          }
        }
      } else {
        // Create traditional Nostr community
        const communityId = await nostrService.createCommunity(
          values.name.trim(),
          values.description.trim()
        );
        
        if (communityId) {
          toast.success("Community created successfully!", {
            description: "You'll be redirected to your new community shortly.",
            action: {
              label: "View now",
              onClick: () => navigate(`/communities/${communityId}`),
            }
          });
          
          form.reset();
          setIsOpen(false);
          
          // Navigate to the new community
          setTimeout(() => {
            navigate(`/communities/${communityId}`);
          }, 1000);
        }
      }
    } catch (error) {
      console.error("Error creating community:", error);
      toast.error("Failed to create community", {
        description: "Please try again or check your connection."
      });
    } finally {
      setIsCreatingCommunity(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Community
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create a new community</DialogTitle>
        </DialogHeader>
        
        {blockchainEnabled && wallet.connectionStatus !== 'connected' ? (
          <div className="flex flex-col items-center py-4">
            <p className="text-center mb-4">
              Connect your Alephium wallet to create an on-chain community
            </p>
            <WalletConnectButton />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateCommunity)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Community Name <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Enter community name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your community..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="blockchainEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Blockchain Enabled</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Create this community on Alephium blockchain
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isPrivate"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Private Community</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Only invited members can join
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {blockchainEnabled && (
                <>
                  <FormField
                    control={form.control}
                    name="initialTreasury"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Initial Treasury (ALPH)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type="number" 
                              min="0"
                              step="0.1"
                              onChange={e => field.onChange(parseFloat(e.target.value))} 
                              value={field.value}
                            />
                            <CoinIcon className="h-4 w-4 absolute top-3 right-3 text-muted-foreground" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="minQuorum"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Quorum (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0"
                            max="100"
                            step="1"
                            onChange={e => field.onChange(parseInt(e.target.value))} 
                            value={field.value}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              
              <Button 
                type="submit"
                disabled={isCreatingCommunity || (blockchainEnabled && wallet.connectionStatus !== 'connected')}
                className="w-full"
              >
                {isCreatingCommunity ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : blockchainEnabled ? (
                  <CoinIcon className="h-4 w-4 mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Create {blockchainEnabled ? 'On-chain Community' : 'Community'}
              </Button>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateCommunityDialog;
