
import React, { useState } from "react";
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

// Validation schema using zod
const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  duration: z.string().default("7"),
  category: z.string().default("other"),
});

interface CreateProposalFormProps {
  communityId: string;
  onProposalCreated: () => void;
}

const CreateProposalForm = ({ communityId, onProposalCreated }: CreateProposalFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [options, setOptions] = useState<string[]>(["Yes", "No"]);
  const isLoggedIn = !!nostrService.publicKey;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      duration: "7",
      category: "other",
    },
  });

  const addOption = () => {
    if (options.length >= 10) {
      toast.warning("Maximum of 10 options allowed");
      return;
    }
    setOptions([...options, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) {
      toast.warning("At least two options are required");
      return;
    }
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!isLoggedIn) {
      toast.error("You must be logged in to create a proposal", {
        description: "Click the login button in the top right corner"
      });
      return;
    }
    
    if (!communityId) {
      toast.error("Invalid community ID", {
        description: "Please make sure you're viewing a valid community"
      });
      return;
    }
    
    if (options.length < 2) {
      toast.error("You need at least two options");
      return;
    }
    
    // Check for empty options
    if (options.some(option => !option.trim())) {
      toast.error("All options must have content");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Log authentication status
      console.log("Creating proposal with auth status:", { 
        isLoggedIn: !!nostrService.publicKey,
        publicKey: nostrService.publicKey,
        communityId
      });
      
      // Calculate the end date based on duration
      const durationDays = parseInt(data.duration);
      
      // Fixed: Update to match the expected number of parameters (5 instead of 7)
      // The expected parameters are: communityId, title, description, options, category
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
          description: "Please make sure you're logged in and have selected a valid community."
        });
      }
    } catch (error) {
      console.error("Error creating proposal:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create proposal");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Authentication Required</AlertTitle>
        <AlertDescription>
          You need to be logged in to create proposals. Please click the login button in the top right corner.
        </AlertDescription>
      </Alert>
    );
  }

  if (!communityId) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Invalid Community</AlertTitle>
        <AlertDescription>
          Could not determine which community this proposal is for. Please make sure you're viewing a valid community.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe your proposal in detail..." 
                  className="min-h-[120px]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
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

        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration (days)</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                </FormControl>
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

        <div className="space-y-2">
          <FormLabel>Options</FormLabel>
          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="flex-1"
                />
                {options.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addOption}
            className="mt-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Option
          </Button>
        </div>

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
