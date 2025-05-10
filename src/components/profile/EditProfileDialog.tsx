
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { nostrService } from '@/lib/nostr';
import { toast } from 'sonner';
import { Loader2, HelpCircle, Twitter } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { NostrProfileMetadata } from '@/lib/nostr/types';

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileData: any;
  onProfileUpdated: () => void;
}

const EditProfileDialog = ({ open, onOpenChange, profileData, onProfileUpdated }: EditProfileDialogProps) => {
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [about, setAbout] = useState('');
  const [picture, setPicture] = useState('');
  const [banner, setBanner] = useState('');
  const [website, setWebsite] = useState('');
  const [nip05, setNip05] = useState('');
  const [twitter, setTwitter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Load existing profile data when dialog opens
  useEffect(() => {
    if (profileData) {
      setName(profileData.name || '');
      setDisplayName(profileData.display_name || '');
      setAbout(profileData.about || '');
      setPicture(profileData.picture || '');
      setBanner(profileData.banner || '');
      setWebsite(profileData.website || '');
      setNip05(profileData.nip05 || '');
      setTwitter(profileData.twitter || '');
    }
  }, [profileData, open]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Prepare metadata object
      const metadata: NostrProfileMetadata = {
        name,
        display_name: displayName,
        about,
        picture,
        banner,
        website,
        nip05,
        twitter: twitter.replace('@', '') // Remove @ if present
      };
      
      // Publish metadata to Nostr network
      const success = await nostrService.publishProfileMetadata(metadata);
      
      if (success) {
        toast.success("Profile updated successfully");
        onOpenChange(false);
        onProfileUpdated();
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
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Username</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="username"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display Name"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="about">About</Label>
            <Textarea
              id="about"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="Tell us about yourself"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="picture">Profile Picture URL</Label>
            <Input
              id="picture"
              value={picture}
              onChange={(e) => setPicture(e.target.value)}
              placeholder="https://example.com/profile.jpg"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="banner">Banner Image URL</Label>
            <Input
              id="banner"
              value={banner}
              onChange={(e) => setBanner(e.target.value)}
              placeholder="https://example.com/banner.jpg"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yourwebsite.com"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="nip05">NIP-05 Identifier</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>NIP-05 identifiers provide verification of your identity.</p>
                      <p className="mt-2">Format: you@yourdomain.com</p>
                      <p className="mt-2">You need to set up a <code>.well-known/nostr.json</code> file on your domain to link your identifier to your public key.</p>
                      <a 
                        href="https://github.com/nostr-protocol/nips/blob/master/05.md" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline mt-2 block"
                      >
                        Learn more about NIP-05
                      </a>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="nip05"
                value={nip05}
                onChange={(e) => setNip05(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
          </div>

          {/* X (Twitter) Account Field */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="twitter">X (Twitter) Account</Label>
              <Twitter className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
              id="twitter"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              placeholder="@username"
              className="pl-8"
              style={{ 
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: '10px center',
                paddingLeft: '2rem'
              }}
            />
            <p className="text-xs text-muted-foreground">Enter your X (Twitter) username with or without the @ symbol</p>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
