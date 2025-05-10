
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { nostrService } from '@/lib/nostr';
import { toast } from 'sonner';
import { Loader2, HelpCircle, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nip05ValidationMessage, setNip05ValidationMessage] = useState('');
  
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
    }
  }, [profileData, open]);
  
  // Validate NIP-05 format
  const validateNip05 = (value: string) => {
    if (!value) {
      setNip05ValidationMessage('');
      return;
    }
    
    if (!value.includes('@')) {
      setNip05ValidationMessage('NIP-05 must be in format: name@domain.com');
      return;
    }
    
    setNip05ValidationMessage('');
  };
  
  const handleNip05Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNip05(value);
    validateNip05(value);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate NIP-05 format if provided
    if (nip05 && !nip05.includes('@')) {
      toast.error("Invalid NIP-05 format. Must be in format: name@domain.com");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare metadata object
      const metadata = {
        name,
        display_name: displayName,
        about,
        picture,
        banner,
        website,
        nip05
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
              <div className="relative">
                <Input
                  id="nip05"
                  value={nip05}
                  onChange={handleNip05Change}
                  placeholder="you@example.com"
                  className={nip05ValidationMessage ? "border-red-300 pr-10" : ""}
                />
                {nip05ValidationMessage && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  </div>
                )}
              </div>
              {nip05ValidationMessage && (
                <p className="text-xs text-red-500 mt-1">{nip05ValidationMessage}</p>
              )}
            </div>
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
            <Button type="submit" disabled={isSubmitting || !!nip05ValidationMessage}>
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
