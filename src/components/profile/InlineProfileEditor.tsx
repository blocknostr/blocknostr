
import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Check, X, User, Link2, Globe, Twitter, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { NostrProfileMetadata, NostrEvent } from '@/lib/nostr/types';
import { nostrService } from '@/lib/nostr';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { profileFormSchema, ProfileFormValues } from './edit-profile/types';
import XVerificationSection from './edit-profile/XVerificationSection';

interface InlineProfileEditorProps {
  profileData: any;
  npub: string;
  onCancel: () => void;
  onSave: () => void;
}

const InlineProfileEditor = ({ profileData, npub, onCancel, onSave }: InlineProfileEditorProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [twitterVerified, setTwitterVerified] = useState(false);
  const [tweetId, setTweetId] = useState<string | null>(null);
  const [xUsername, setXUsername] = useState<string | null>(null);

  // Initialize form with react-hook-form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      display_name: '',
      about: '',
      picture: '',
      banner: '',
      website: '',
      nip05: '',
      twitter: '',
      tweetUrl: ''
    }
  });
  
  // Load existing profile data
  useEffect(() => {
    if (profileData) {
      // Fill form with existing data
      form.reset({
        name: profileData.name || '',
        display_name: profileData.display_name || '',
        about: profileData.about || '',
        picture: profileData.picture || '',
        banner: profileData.banner || '',
        website: profileData.website || '',
        nip05: profileData.nip05 || '',
        twitter: profileData.twitter || '',
        tweetUrl: ''
      });
      
      // Check if Twitter is already verified via NIP-39 "i" tag
      if (Array.isArray(profileData.tags)) {
        const twitterTag = profileData.tags.find(tag => 
          tag.length >= 3 && tag[0] === 'i' && tag[1].startsWith('twitter:')
        );
        
        if (twitterTag) {
          setTwitterVerified(true);
          setTweetId(twitterTag[2]); // Tweet ID is in position 2
          const username = twitterTag[1].split(':')[1]; // Extract username from "twitter:username"
          setXUsername(username);
          form.setValue('twitter', username);
        } else if (profileData.twitter_verified) {
          // Legacy verification
          setTwitterVerified(!!profileData.twitter_verified);
          if (profileData.twitter_proof) {
            setTweetId(profileData.twitter_proof);
          }
        }
      }
    }
  }, [profileData, form]);

  const handleSubmit = async (values: ProfileFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Prepare metadata object
      const metadata: NostrProfileMetadata = {
        name: values.name,
        display_name: values.display_name,
        about: values.about,
        picture: values.picture,
        banner: values.banner,
        website: values.website,
        nip05: values.nip05,
        twitter: values.twitter.replace('@', '') // Remove @ if present
      };
      
      // Create the event object to publish
      const eventToPublish: Partial<NostrEvent> = {
        kind: 0,
        content: JSON.stringify(metadata),
        tags: []
      };
      
      // Add NIP-39 "i" tag for Twitter verification if verified
      if (twitterVerified && tweetId && xUsername) {
        const cleanUsername = xUsername.replace('@', '');
        eventToPublish.tags = [
          // NIP-39 compliant format: ["i", "twitter:username", "tweetId"]
          ["i", `twitter:${cleanUsername}`, tweetId]
        ];
      }
      
      // Publish metadata to Nostr network
      const success = await nostrService.publishEvent(eventToPublish);
      
      if (success) {
        toast.success("Profile updated successfully");
        onSave();
      } else {
        toast.error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("An error occurred while updating profile");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const avatarFallback = form.watch('display_name')?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="space-y-4">
      {/* Banner & Profile Picture */}
      <div className="relative">
        <div 
          className="h-48 md:h-64 bg-gradient-to-r from-violet-500 to-fuchsia-500 w-full rounded-t-lg relative overflow-hidden"
        >
          {form.watch('banner') && (
            <img 
              src={form.watch('banner')} 
              alt="Banner" 
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="bg-background/80 backdrop-blur-sm p-2 rounded-md shadow-lg">
              <Input
                {...form.register('banner')}
                placeholder="Banner URL"
                className="w-full md:w-72"
              />
            </div>
          </div>
        </div>
        
        <div className="absolute -bottom-16 left-4 rounded-full border-4 border-background shadow-xl overflow-hidden">
          <Avatar className="h-24 w-24 md:h-32 md:w-32 relative group">
            <AvatarImage src={form.watch('picture')} />
            <AvatarFallback className="text-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
              {avatarFallback}
            </AvatarFallback>
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Camera className="text-white h-8 w-8" />
            </div>
          </Avatar>
          <Input
            {...form.register('picture')}
            placeholder="Profile picture URL"
            className="w-full mt-1 text-sm"
          />
        </div>
      </div>
      
      {/* Profile Info Form */}
      <div className="mt-20 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              {...form.register('display_name')}
              placeholder="Display Name"
              className="text-lg font-bold bg-background/60 border-dashed focus:border-solid"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">@</span>
              <Input
                {...form.register('name')}
                placeholder="Username"
                className="bg-background/60 border-dashed focus:border-solid"
              />
            </div>
          </div>
        </div>
        
        <Textarea
          {...form.register('about')}
          placeholder="Tell others about yourself..."
          className="min-h-[100px] bg-background/60 border-dashed focus:border-solid"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Input
              {...form.register('website')}
              placeholder="Website URL"
              className="bg-background/60 border-dashed focus:border-solid"
            />
          </div>
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Input
              {...form.register('nip05')}
              placeholder="NIP-05 Identifier (you@domain.com)"
              className="bg-background/60 border-dashed focus:border-solid"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2 max-w-sm">
          <Twitter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <Input
            {...form.register('twitter')}
            placeholder="Twitter/X username"
            className="bg-background/60 border-dashed focus:border-solid"
          />
        </div>
        
        {/* X Verification (can be toggled) */}
        <div className="pt-2 border-t">
          <XVerificationSection 
            form={form}
            twitterVerified={twitterVerified}
            setTwitterVerified={setTwitterVerified}
            setTweetId={setTweetId}
            setXUsername={setXUsername}
          />
        </div>
        
        {/* Action buttons */}
        <div className="flex justify-end gap-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button 
            onClick={form.handleSubmit(handleSubmit)} 
            disabled={isSubmitting}
          >
            <Check className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InlineProfileEditor;
