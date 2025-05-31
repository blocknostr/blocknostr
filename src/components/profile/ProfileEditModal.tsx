import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Loader2, Upload, X, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ProfileData } from '@/lib/services/profile/types';
import { toast } from '@/lib/toast';
import { nostrService } from '@/lib/nostr';
import { useAppDispatch } from '@/hooks/redux';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ProfileData | null;
  onProfileUpdate: (updates: Partial<ProfileData>) => Promise<void>;
}

interface ProfileFormData {
  name: string;
  displayName: string;
  about: string;
  picture: string;
  banner: string;
  website: string;
  lud16: string;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  profile,
  onProfileUpdate
}) => {
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    displayName: '',
    about: '',
    picture: '',
    banner: '',
    website: '',
    lud16: ''
  });

  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewMode, setPreviewMode] = useState(false);
  
  // Track if the form has been edited to prevent unwanted resets
  const [hasBeenEdited, setHasBeenEdited] = useState(false);
  const initializedRef = useRef(false);

  const dispatch = useAppDispatch();

  // Initialize form data when modal opens with profile data
  // Only reset if modal is opening fresh or if form hasn't been edited
  useEffect(() => {
    if (isOpen && profile && (!hasBeenEdited || !initializedRef.current)) {
      console.log('[ProfileEditModal] Initializing form data:', {
        hasBeenEdited,
        initializedBefore: initializedRef.current,
        profileData: {
          name: profile.name,
          displayName: profile.displayName,
          about: profile.about?.slice(0, 50) + (profile.about?.length > 50 ? '...' : ''),
        }
      });
      
      setFormData({
        name: profile.name || '',
        displayName: profile.displayName || '',
        about: profile.about || '',
        picture: profile.picture || '',
        banner: profile.banner || '',
        website: profile.website || '',
        lud16: profile.lud16 || ''
      });
      
      // Mark as initialized but not edited yet
      initializedRef.current = true;
      setHasBeenEdited(false);
    }
  }, [isOpen, profile, hasBeenEdited]);

  // Reset form state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setErrors({});
      setPreviewMode(false);
      setHasBeenEdited(false);
      initializedRef.current = false;
    }
  }, [isOpen]);

  // Validate URLs
  const isValidUrl = (url: string): boolean => {
    if (!url) return true; // Empty is valid
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Validate LUD-16 (Lightning Address) format
  const isValidLud16Format = (lud16: string): boolean => {
    if (!lud16) return true; // Empty is valid
    // LUD-16 is essentially an email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(lud16);
  };

  // Enhanced input change handler that tracks editing state
  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    console.log('[ProfileEditModal] Input change:', { field, value: value.slice(0, 20) + (value.length > 20 ? '...' : '') });
    
    // Mark form as edited on first change
    if (!hasBeenEdited) {
      setHasBeenEdited(true);
      console.log('[ProfileEditModal] Form marked as edited');
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate required fields
    if (!formData.displayName.trim() && !formData.name.trim()) {
      newErrors.displayName = 'Either Display Name or Username is required';
    }

    // Validate URLs
    if (formData.picture && !isValidUrl(formData.picture)) {
      newErrors.picture = 'Invalid picture URL';
    }
    if (formData.banner && !isValidUrl(formData.banner)) {
      newErrors.banner = 'Invalid banner URL';
    }
    if (formData.website && !isValidUrl(formData.website)) {
      newErrors.website = 'Invalid website URL';
    }

    // Validate LUD-16
    if (formData.lud16 && !isValidLud16Format(formData.lud16)) {
      newErrors.lud16 = 'Invalid Lightning Address format';
    }

    // Validate content length (NIP-01 doesn't specify limits, but reasonable ones)
    if (formData.about.length > 500) {
      newErrors.about = 'Bio is too long (max 500 characters)';
    }
    if (formData.displayName.length > 50) {
      newErrors.displayName = 'Display name is too long (max 50 characters)';
    }
    if (formData.name.length > 30) {
      newErrors.name = 'Username is too long (max 30 characters)';
    }

    // NIP-01 compliance: Validate field names don't contain invalid characters
    if (formData.name && !/^[a-zA-Z0-9_-]*$/.test(formData.name)) {
      newErrors.name = 'Username can only contain letters, numbers, underscores, and hyphens';
    }

    // Validate JSON serialization (NIP-01 requirement)
    try {
      const testMetadata = {
        name: formData.name.trim() || undefined,
        display_name: formData.displayName.trim() || undefined,
        about: formData.about.trim() || undefined,
        picture: formData.picture.trim() || undefined,
        banner: formData.banner.trim() || undefined,
        website: formData.website.trim() || undefined,
        lud16: formData.lud16.trim() || undefined
      };
      
      // Remove undefined values
      Object.keys(testMetadata).forEach(key => {
        if (testMetadata[key as keyof typeof testMetadata] === undefined) {
          delete testMetadata[key as keyof typeof testMetadata];
        }
      });
      
      const jsonString = JSON.stringify(testMetadata);
      if (jsonString.length > 8192) { // Reasonable limit for event content
        newErrors.displayName = 'Profile data is too large. Please reduce content length.';
      }
    } catch (error) {
      newErrors.displayName = 'Profile data contains invalid characters for Nostr protocol';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the form errors before saving');
      return;
    }

    setLoading(true);
    try {
      // Create updates object following NIP-01 metadata event structure
      const updates: Partial<ProfileData> = {
        name: formData.name.trim() || undefined,
        displayName: formData.displayName.trim() || undefined,
        about: formData.about.trim() || undefined,
        picture: formData.picture.trim() || undefined,
        banner: formData.banner.trim() || undefined,
        website: formData.website.trim() || undefined,
        lud16: formData.lud16.trim() || undefined
      };

      // Remove undefined values to keep the update clean
      Object.keys(updates).forEach(key => {
        if (updates[key as keyof ProfileData] === undefined) {
          delete updates[key as keyof ProfileData];
        }
      });

      // Validate that we have at least one field to update
      if (Object.keys(updates).length === 0) {
        toast.error('No changes to save');
        return;
      }

      console.log('[ProfileEditModal] Submitting profile updates:', updates);
      console.log('[ProfileEditModal] NIP-01 compliance check: Creating kind 0 event with metadata');
      
      await onProfileUpdate(updates);
      
      toast.success('Profile updated successfully! Changes will propagate across the Nostr network.');
      onClose();
      
    } catch (error) {
      console.error('Profile update error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = 'Update timed out. Please check your relay connections and try again.';
        } else if (error.message.includes('relay')) {
          errorMessage = 'Failed to connect to relays. Please check your internet connection.';
        } else if (error.message.includes('sign')) {
          errorMessage = 'Failed to sign the update. Please check your Nostr extension.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(`Failed to update profile: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit Profile
            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
              >
                {previewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {previewMode ? 'Edit' : 'Preview'}
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {previewMode ? (
          // Preview Mode
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={formData.picture} />
                    <AvatarFallback>
                      {(formData.displayName || formData.name || 'U')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold">
                        {formData.displayName || formData.name || `User ${profile?.pubkey?.slice(0, 8) || 'Unknown'}`}
                      </h3>
                    </div>
                    {formData.name && formData.displayName !== formData.name && (
                      <p className="text-muted-foreground">@{formData.name}</p>
                    )}
                    {formData.about && (
                      <p className="text-sm leading-relaxed">{formData.about}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      {formData.website && (
                        <span>🌐 {new URL(formData.website).hostname}</span>
                      )}
                      {formData.lud16 && (
                        <span>⚡ {formData.lud16}</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Edit Mode
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                    placeholder="Your display name"
                    maxLength={50}
                  />
                  {errors.displayName && (
                    <p className="text-sm text-red-500">{errors.displayName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Username</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="username"
                    maxLength={30}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="about">Bio</Label>
                <Textarea
                  id="about"
                  value={formData.about}
                  onChange={(e) => handleInputChange('about', e.target.value)}
                  placeholder="Tell people about yourself..."
                  rows={4}
                  maxLength={500}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{errors.about && <span className="text-red-500">{errors.about}</span>}</span>
                  <span>{formData.about.length}/500</span>
                </div>
              </div>
            </div>

            {/* Profile Images */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Profile Images</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="picture">Profile Picture URL</Label>
                  <Input
                    id="picture"
                    value={formData.picture}
                    onChange={(e) => handleInputChange('picture', e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                  />
                  {errors.picture && (
                    <p className="text-sm text-red-500">{errors.picture}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="banner">Banner Image URL</Label>
                  <Input
                    id="banner"
                    value={formData.banner}
                    onChange={(e) => handleInputChange('banner', e.target.value)}
                    placeholder="https://example.com/banner.jpg"
                  />
                  {errors.banner && (
                    <p className="text-sm text-red-500">{errors.banner}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Contact & Verification</h3>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="advanced" className="text-sm">Show Advanced</Label>
                  <Switch
                    id="advanced"
                    checked={showAdvanced}
                    onCheckedChange={setShowAdvanced}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://your-website.com"
                />
                {errors.website && (
                  <p className="text-sm text-red-500">{errors.website}</p>
                )}
              </div>

              {showAdvanced && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="lud16">Lightning Address (LUD-16)</Label>
                    <Input
                      id="lud16"
                      value={formData.lud16}
                      onChange={(e) => handleInputChange('lud16', e.target.value)}
                      placeholder="satoshi@lightning.network"
                    />
                    {errors.lud16 && (
                      <p className="text-sm text-red-500">{errors.lud16}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Lightning Address for receiving Bitcoin payments.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* NIP Compliance Info */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>NIP-01 Compliance:</strong> Your profile will be published as a kind-0 metadata event 
                to Nostr relays. This is a replaceable event, meaning newer updates will override older ones. 
                Your information may be cached by clients and relay operators across the decentralized network.
              </AlertDescription>
            </Alert>
          </div>
        )}

        <DialogFooter>
          <div className="flex w-full justify-between">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <div className="flex gap-2">
              {!previewMode && (
                <Button 
                  onClick={handleSubmit} 
                  disabled={loading}
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Profile
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileEditModal; 


