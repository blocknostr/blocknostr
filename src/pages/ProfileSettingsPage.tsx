
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Save, AlertCircle } from 'lucide-react';

import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { nostrService } from '@/lib/nostr';
import { verifyNip05 } from '@/lib/nostr/nip05';

// Define form schema that follows NIP-01 metadata format
const profileFormSchema = z.object({
  name: z.string().optional(),
  display_name: z.string().optional(),
  about: z.string().optional(),
  picture: z.string().url().optional().or(z.string().length(0)),
  banner: z.string().url().optional().or(z.string().length(0)),
  website: z.string().url().optional().or(z.string().length(0)),
  nip05: z.string().optional(),
  lud16: z.string().optional(), // Lightning address
  twitter: z.string().optional(),
  github: z.string().optional(),
  mastodon: z.string().optional(),
  nostr: z.string().optional()
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const ProfileSettingsPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isNip05Verified, setIsNip05Verified] = useState<boolean | null>(null);
  const [isNip05Verifying, setIsNip05Verifying] = useState(false);
  
  // Setup form with react-hook-form + zod
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
      lud16: '',
      twitter: '',
      github: '',
      mastodon: '',
      nostr: ''
    }
  });
  
  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      const publicKey = nostrService.publicKey;
      
      if (!publicKey) {
        toast.error("You must be logged in to access profile settings");
        navigate('/');
        return;
      }
      
      try {
        // Load existing profile data
        const profileData = await nostrService.getUserProfile(publicKey);
        
        if (profileData) {
          // Reset form with existing profile data
          form.reset({
            name: profileData.name || '',
            display_name: profileData.display_name || '',
            about: profileData.about || '',
            picture: profileData.picture || '',
            banner: profileData.banner || '',
            website: profileData.website || '',
            nip05: profileData.nip05 || '',
            lud16: profileData.lud16 || '',
            twitter: profileData.twitter || '',
            github: profileData.github || '',
            mastodon: profileData.mastodon || '',
            nostr: profileData.nostr || ''
          });
          
          // If there's a NIP-05 identifier, check its verification status
          if (profileData.nip05) {
            verifyNip05Identifier(profileData.nip05, publicKey);
          }
        }
      } catch (error) {
        console.error("Error loading profile data:", error);
        toast.error("Could not load profile data");
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate, form]);
  
  // Verify NIP-05 identifier
  const verifyNip05Identifier = async (identifier: string, pubkey: string) => {
    if (!identifier || !pubkey) return;
    
    setIsNip05Verifying(true);
    setIsNip05Verified(null);
    
    try {
      const isValid = await verifyNip05(identifier, pubkey);
      setIsNip05Verified(isValid);
    } catch (error) {
      console.error("Error verifying NIP-05:", error);
      setIsNip05Verified(false);
    } finally {
      setIsNip05Verifying(false);
    }
  };
  
  // Watch NIP-05 value changes
  const nip05Value = form.watch('nip05');
  
  // Verify NIP-05 when it changes
  useEffect(() => {
    if (nip05Value && nostrService.publicKey) {
      const timeoutId = setTimeout(() => {
        verifyNip05Identifier(nip05Value, nostrService.publicKey!);
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [nip05Value]);
  
  // Handle form submission
  const onSubmit = async (values: ProfileFormValues) => {
    if (!nostrService.publicKey) {
      toast.error("You must be logged in to update your profile");
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Clean up values by removing empty strings
      const cleanValues: Record<string, any> = {};
      
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          cleanValues[key] = value;
        }
      });
      
      // Create the event object - follows NIP-01 metadata event format
      const eventToPublish = {
        kind: 0, // Metadata event
        content: JSON.stringify(cleanValues),
        tags: [] // No tags needed for basic metadata
      };
      
      // Publish the event
      const success = await nostrService.publishEvent(eventToPublish);
      
      if (success) {
        toast.success("Profile updated successfully");
        
        // Force refresh cached profile data
        await nostrService.getUserProfile(nostrService.publicKey, true);
        
        // Refresh the main profile page
        const event = new CustomEvent('refetchProfile');
        window.dispatchEvent(event);
      } else {
        toast.error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("An error occurred while updating profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left sidebar */}
      <Sidebar />
      
      {/* Main content */}
      <div className="flex-1 ml-0 md:ml-64">
        <header className="border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
          <div className="flex items-center h-14 px-4">
            <h1 className="font-semibold">Profile Settings</h1>
          </div>
        </header>
        
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Edit Your Profile</CardTitle>
              <CardDescription>
                Update your profile information visible on the Nostr network
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Basic Information</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="username" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="display_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Display Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Display Name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="about"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>About</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Tell us about yourself"
                                rows={4}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Profile Images</h3>
                      
                      <FormField
                        control={form.control}
                        name="picture"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Profile Picture URL</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://example.com/your-image.jpg" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="banner"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Banner Image URL</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="https://example.com/your-banner.jpg" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Verification & Payments</h3>
                      
                      <FormField
                        control={form.control}
                        name="nip05"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                              <FormLabel>NIP-05 Identifier</FormLabel>
                              {isNip05Verifying && (
                                <span className="text-xs text-muted-foreground">Verifying...</span>
                              )}
                              {isNip05Verified === true && (
                                <span className="text-xs text-green-500 flex items-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  Verified
                                </span>
                              )}
                              {isNip05Verified === false && (
                                <span className="text-xs text-red-500 flex items-center">
                                  <AlertCircle className="h-4 w-4 mr-1" />
                                  Not verified
                                </span>
                              )}
                            </div>
                            <FormControl>
                              <Input 
                                placeholder="you@example.com" 
                                {...field}
                              />
                            </FormControl>
                            <p className="text-xs text-muted-foreground mt-1">
                              A NIP-05 identifier allows others to verify your identity.
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="lud16"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lightning Address</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="you@walletorlnaddress.com" 
                                {...field}
                              />
                            </FormControl>
                            <p className="text-xs text-muted-foreground mt-1">
                              Your Lightning address for receiving payments.
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Social Media Links</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="website"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Website</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="https://example.com" 
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="twitter"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Twitter</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="username" 
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="github"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>GitHub</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="username" 
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="mastodon"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mastodon</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="username@instance" 
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    {form.formState.errors && Object.keys(form.formState.errors).length > 0 && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Please fix the errors above before saving.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="flex justify-end">
                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Profile
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;
