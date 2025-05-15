
import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { nostrService } from "@/lib/nostr";
import { useNavigate } from "react-router-dom";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

interface CreateCommunityDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onCreateCommunity?: (name: string, description: string) => Promise<void>;
  title?: string;
  description?: string;
  walletSigningRequired?: boolean;
  walletAddress?: string | null;
  signWithWallet?: (data: any) => Promise<string | null>;
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
});

const CreateCommunityDialog = ({ 
  isOpen, 
  setIsOpen, 
  onCreateCommunity, 
  title = "Create a new community", 
  description,
  walletSigningRequired = false,
  walletAddress,
  signWithWallet
}: CreateCommunityDialogProps) => {
  const navigate = useNavigate();
  const [isCreatingCommunity, setIsCreatingCommunity] = useState(false);
  const [isSigningWithWallet, setIsSigningWithWallet] = useState(false);
  
  const currentUserPubkey = nostrService.publicKey;

  // Setup form with validation
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });
  
  const handleCreateCommunity = async (values: z.infer<typeof formSchema>) => {
    if (!currentUserPubkey) {
      toast.error("You must be logged in to create a community");
      return;
    }
    
    if (walletSigningRequired && !walletAddress) {
      toast.error("You must connect your Alephium wallet to create a DAO");
      return;
    }
    
    setIsCreatingCommunity(true);
    
    try {
      // Prepare data for blockchain registration
      const communityData = {
        name: values.name.trim(),
        description: values.description.trim(),
        creator: currentUserPubkey,
        timestamp: Math.floor(Date.now() / 1000)
      };
      
      // If wallet signing is required, sign the data
      let signature = null;
      if (walletSigningRequired && signWithWallet) {
        setIsSigningWithWallet(true);
        signature = await signWithWallet(communityData);
        setIsSigningWithWallet(false);
        
        if (!signature) {
          toast.error("Failed to sign with wallet", {
            description: "Please try again or check your wallet connection."
          });
          setIsCreatingCommunity(false);
          return;
        }
        
        // Add the signature to community data
        Object.assign(communityData, { signature });
      }
      
      // If custom handler is provided, use it
      if (onCreateCommunity) {
        await onCreateCommunity(values.name.trim(), values.description.trim());
        form.reset();
        setIsOpen(false);
        return;
      }
      
      // Default Nostr community creation
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <p className="text-sm text-muted-foreground mt-2">{description}</p>}
        </DialogHeader>
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
            {walletSigningRequired && (
              <div className="rounded-md bg-primary/5 p-3 text-sm">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <line x1="2" x2="22" y1="10" y2="10" />
                  </svg>
                  <span className="font-medium">Blockchain Registration Required</span>
                </div>
                <p className="text-muted-foreground">
                  This DAO will be registered on the Alephium blockchain using your connected wallet
                  {walletAddress ? ` (${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)})` : ''}.
                </p>
              </div>
            )}
            <Button 
              type="submit"
              disabled={isCreatingCommunity || isSigningWithWallet}
              className="w-full"
            >
              {isCreatingCommunity ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isSigningWithWallet ? "Signing with Wallet..." : "Creating DAO..."}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create DAO
                </>
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCommunityDialog;
