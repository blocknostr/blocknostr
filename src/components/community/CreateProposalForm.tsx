
// src/components/community/CreateProposalForm.tsx

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { nostrService } from "@/lib/nostr";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2, AlertCircle } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import type { ProposalCategory } from "@/types/community";
import { useNostrAuth } from "@/hooks/useNostrAuth";
import { useNostrRelays } from "@/hooks/useNostrRelays";

// ─── Validation schema ─────────────────────────────────────────
const formSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters"),
  duration: z.string().default("7"),
  category: z.string().default("other"),
});

type FormData = z.infer<typeof formSchema>;

interface CreateProposalFormProps {
  communityId: string;
  onProposalCreated: () => void;
}

const CreateProposalForm: React.FC<CreateProposalFormProps> = ({
  communityId,
  onProposalCreated,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [options, setOptions] = useState<string[]>(["Yes", "No"]);
  
  // Use the enhanced auth and relay hooks
  const { isLoggedIn, currentUserPubkey } = useNostrAuth();
  const { isConnected, connectToRelays } = useNostrRelays();
  
  // Additional state to track auth readiness
  const [authChecked, setAuthChecked] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      duration: "7",
      category: "other",
    },
  });

  // Verify auth status when component mounts
  useEffect(() => {
    const checkAuth = async () => {
      console.log("[CreateProposalForm] Checking auth status:", { 
        isLoggedIn, 
        isConnected,
        pubkey: currentUserPubkey ? currentUserPubkey.substring(0, 8) + '...' : null 
      });
      
      if (isLoggedIn && !isConnected) {
        console.log("[CreateProposalForm] Logged in but not connected to relays, connecting...");
        await connectToRelays({
          showToast: true,
          fallbackRelays: ["wss://relay.damus.io", "wss://nos.lol", "wss://relay.nostr.band"]
        });
      }
      
      setAuthChecked(true);
    };
    
    checkAuth();
  }, [isLoggedIn, isConnected, currentUserPubkey, connectToRelays]);

  const addOption = () => {
    if (options.length >= 10) {
      toast.warning("Maximum of 10 options allowed");
      return;
    }
    setOptions((prev) => [...prev, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) {
      toast.warning("At least two options are required");
      return;
    }
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    setOptions((prev) =>
      prev.map((opt, i) => (i === index ? value : opt))
    );
  };

  const onSubmit = async (data: FormData) => {
    // Enhanced validation before submitting
    if (!isLoggedIn || !currentUserPubkey) {
      toast.error("You must be logged in to create a proposal", {
        description: "Click the login button in the top right corner",
      });
      return;
    }

    if (!isConnected) {
      toast.error("No relay connections available", {
        description: "Connecting to relays...",
      });
      
      const connected = await connectToRelays();
      if (!connected) {
        toast.error("Failed to connect to relays", {
          description: "Please check your network connection and try again",
        });
        return;
      }
    }

    if (!communityId) {
      toast.error("Invalid community ID", {
        description: "Please make sure you're viewing a valid community",
      });
      return;
    }

    if (options.length < 2) {
      toast.error("You need at least two options");
      return;
    }

    if (options.some((opt) => !opt.trim())) {
      toast.error("All options must have content");
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("[CreateProposalForm] Creating proposal with:", {
        communityId,
        title: data.title,
        description: data.description,
        options,
        category: data.category,
        pubkey: currentUserPubkey.substring(0, 8) + '...',
      });

      // Pass exactly 5 arguments as expected by the service signature
      const result = await nostrService.createProposal(
        communityId,
        data.title,
        data.description,
        options,
        data.category as ProposalCategory
      );

      if (result) {
        toast.success("Proposal created successfully!");
        form.reset();
        setOptions(["Yes", "No"]);
        onProposalCreated();
      } else {
        toast.error("Failed to create proposal", {
          description:
            "Please make sure you're logged in and connected to relays.",
        });
      }
    } catch (err) {
      console.error("[CreateProposalForm] Error creating proposal:", err);
      toast.error(
        err instanceof Error ? err.message : "Unexpected error creating proposal"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Improved authentication check with specific messaging
  if (!authChecked) {
    return (
      <div className="py-4 text-center">
        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground mt-2">
          Checking authentication status...
        </p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Authentication Required</AlertTitle>
        <AlertDescription>
          You need to be logged in to create proposals. Please click the login
          button in the navigation bar.
        </AlertDescription>
      </Alert>
    );
  }

  if (!isConnected) {
    return (
      <Alert variant="warning" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Relay Connections</AlertTitle>
        <AlertDescription>
          Your client is not connected to any Nostr relays. Please check your connection
          or try again later.
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => connectToRelays()} 
            className="mt-2"
          >
            <Loader2 className={`h-4 w-4 mr-2 ${isSubmitting ? 'animate-spin' : ''}`} />
            Connect to Relays
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter proposal title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your proposal"
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="governance">Governance</SelectItem>
                  <SelectItem value="feature">Feature Request</SelectItem>
                  <SelectItem value="poll">Community Poll</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Duration */}
        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration (days)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="7">1 week</SelectItem>
                  <SelectItem value="14">2 weeks</SelectItem>
                  <SelectItem value="30">1 month</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                How long this proposal will be open for voting
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Options */}
        <div className="space-y-2">
          <FormLabel>Options</FormLabel>
          {options.map((opt, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <Input
                value={opt}
                onChange={(e) => handleOptionChange(idx, e.target.value)}
                placeholder={`Option #${idx + 1}`}
                className="flex-1"
              />
              {options.length > 2 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeOption(idx)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addOption}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Option
          </Button>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Proposal"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CreateProposalForm;
