import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { ProfileFormValues } from './types';
import { nostrService } from '@/lib/nostr/service';
import type { NostrProfileMetadata } from '@/lib/nostr';
import { toast } from 'sonner';

interface EditProfileDialogProps {
    profile: NostrProfileMetadata | null;
}

const EditProfileDialog = ({ profile }: EditProfileDialogProps) => {
    // Uncontrolled dialog
    const defaultUsername = profile?.nip05?.split('@')[0] || '';
    const { register, handleSubmit, formState: { isSubmitting, errors }, reset, watch } = useForm<ProfileFormValues>({
        defaultValues: {
            name: profile?.name,
            displayName: profile?.display_name,
            bio: profile?.about,
            website: profile?.website,
            nip05: defaultUsername,
            picture: profile?.picture,
            banner: profile?.banner,
            lud16: profile?.lud16,
        }
    });

    // Reset form when profile metadata loads or changes
    useEffect(() => {
        if (profile) {
            console.log('[EditProfileDialog] Profile prop received:', JSON.stringify(profile, null, 2));
            const defaultUsername = profile.nip05?.split('@')[0] || '';
            reset({
                name: profile.name,
                displayName: profile.display_name,
                bio: profile.about,
                website: profile.website,
                nip05: defaultUsername,
                picture: profile.picture,
                banner: profile.banner,
                lud16: profile.lud16,
            });
        } else {
            console.warn('[EditProfileDialog] Profile prop is null or undefined');
        }
    }, [profile, reset]);

    // Watch fields for live previews
    const pictureUrl = watch('picture');
    const bannerUrl = watch('banner');

    const currentPubkey = nostrService.publicKey;
    const profilePubkey = profile && typeof profile === 'object' && 'pubkey' in profile ? (profile as { pubkey: string }).pubkey : '';
    const canEdit = currentPubkey && profilePubkey && currentPubkey === profilePubkey;

    console.log('[EditProfileDialog] currentPubkey:', currentPubkey);
    console.log('[EditProfileDialog] profilePubkey derived:', profilePubkey);
    console.log('[EditProfileDialog] canEdit:', canEdit);

    // Add detailed logging to debug why editing is blocked
    console.log('[EditProfileDialog] Debugging canEdit logic:', {
        currentPubkey,
        profilePubkey,
        canEdit,
        profile,
    });

    const handleClearCacheAndReload = () => {
        localStorage.clear();
        sessionStorage.clear();
        toast.info("Cache cleared. Reloading page...");
        window.location.reload();
    };

    const onSubmit = async (values: ProfileFormValues) => {
        // Construct full NIP-05 identifier with our domain
        const fullNip05 = values.nip05 ? `${values.nip05}@blocknostr.com` : '';
        const metadata: NostrProfileMetadata = {
            name: values.name,
            display_name: values.displayName,
            about: values.bio,
            picture: values.picture,
            banner: values.banner,
            website: values.website,
            nip05: fullNip05,
            lud16: values.lud16,
        };
        const success = await nostrService.publishProfileMetadata(metadata);
        if (success) {
            toast.success('Profile updated');
            window.location.reload();
        } else {
            toast.error('Failed to update profile');
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline">Edit Profile</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogDescription>
                    Edit your profile including name, display name, bio, website, NIP-05 username (blocknostr.com), Lightning address, avatar, and banner.
                </DialogDescription>
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Show warning if not owner */}
                    {!canEdit && profilePubkey && (
                        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                            <p className="font-bold">Ownership Mismatch!</p>
                            <p>You are not the owner of this profile. Please switch to the correct account to edit.</p>
                            <p className="mt-2 text-xs">
                                Current active public key (first 10 chars): <code>{currentPubkey?.substring(0, 10)}...</code><br />
                                Profile's public key (first 10 chars): <code>{profilePubkey?.substring(0, 10)}...</code>
                            </p>
                            <p className="mt-2 text-xs">
                                If you believe this is an error, your browser might have outdated cached data.
                            </p>
                            <Button
                                variant="destructive"
                                size="sm"
                                className="mt-2"
                                onClick={handleClearCacheAndReload}
                                type="button"
                            >
                                Clear Cache & Reload
                            </Button>
                        </div>
                    )}
                    {!canEdit && !profilePubkey && profile && (
                        <div className="p-4 mb-4 text-sm text-yellow-700 bg-yellow-100 rounded-lg" role="alert">
                            <p className="font-bold">Profile data incomplete</p>
                            <p>The public key for this profile is not available, so ownership cannot be verified. Editing is disabled.</p>
                            <p className="mt-2 text-xs">
                                If you believe this is an error, your browser might have outdated cached data.
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={handleClearCacheAndReload}
                                type="button"
                            >
                                Clear Cache & Reload
                            </Button>
                        </div>
                    )}

                    <fieldset disabled={!canEdit} className="space-y-6">
                        {/* Live previews */}
                        {bannerUrl && (
                            <div className="h-24 w-full bg-cover bg-center rounded" style={{ backgroundImage: `url(${bannerUrl})` }} />
                        )}
                        {pictureUrl && (
                            <img src={pictureUrl} alt="Avatar Preview" className="h-20 w-20 rounded-full object-cover mx-auto" />
                        )}

                        {/* Name */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <label htmlFor="name" className="text-sm font-medium">Name</label>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span><Info className="h-4 w-4 text-muted-foreground" /></span>
                                    </TooltipTrigger>
                                    <TooltipContent>Name displayed on your profile.</TooltipContent>
                                </Tooltip>
                            </div>
                            <Input
                                id="name"
                                {...register('name', { required: 'Name is required' })}
                                placeholder="Enter your name"
                            />
                            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                        </div>

                        {/* Display Name */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <label htmlFor="displayName" className="text-sm font-medium">Display Name</label>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span><Info className="h-4 w-4 text-muted-foreground" /></span>
                                    </TooltipTrigger>
                                    <TooltipContent>Alternate name or nickname.</TooltipContent>
                                </Tooltip>
                            </div>
                            <Input
                                id="displayName"
                                {...register('displayName')}
                                placeholder="Enter display name"
                            />
                        </div>

                        {/* Bio */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <label htmlFor="bio" className="text-sm font-medium">Bio</label>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span><Info className="h-4 w-4 text-muted-foreground" /></span>
                                    </TooltipTrigger>
                                    <TooltipContent>Short description about yourself.</TooltipContent>
                                </Tooltip>
                            </div>
                            <Textarea id="bio" {...register('bio')} placeholder="Tell us about yourself" rows={3} />
                        </div>

                        {/* Website */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <label htmlFor="website" className="text-sm font-medium">Website</label>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span><Info className="h-4 w-4 text-muted-foreground" /></span>
                                    </TooltipTrigger>
                                    <TooltipContent>Your personal or company website URL.</TooltipContent>
                                </Tooltip>
                            </div>
                            <Input
                                id="website"
                                {...register('website', {
                                    pattern: {
                                        value: /^(https?:\/\/)?\S+$/i,
                                        message: 'Invalid URL',
                                    },
                                })}
                                placeholder="https://example.com"
                            />
                            {errors.website && <p className="text-sm text-red-500">{errors.website.message}</p>}
                        </div>

                        {/* NIP-05 Username */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <label htmlFor="nip05" className="text-sm font-medium">NIP-05 Username</label>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span><Info className="h-4 w-4 text-muted-foreground" /></span>
                                    </TooltipTrigger>
                                    <TooltipContent>Username for nostr verification (blocknostr.com).</TooltipContent>
                                </Tooltip>
                            </div>
                            <div className="flex items-center gap-2">
                                <Input id="nip05" {...register('nip05')} placeholder="username" />
                                <span className="text-sm">@blocknostr.com</span>
                            </div>
                        </div>

                        {/* Lightning Address */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <label htmlFor="lud16" className="text-sm font-medium">Lightning Address</label>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span><Info className="h-4 w-4 text-muted-foreground" /></span>
                                    </TooltipTrigger>
                                    <TooltipContent>LNURL or @username@domain for payments.</TooltipContent>
                                </Tooltip>
                            </div>
                            <Input id="lud16" {...register('lud16')} placeholder="e.g. user@blocknostr.com" />
                        </div>

                        {/* Picture & Banner */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label htmlFor="picture" className="text-sm font-medium">Avatar URL</label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span><Info className="h-4 w-4 text-muted-foreground" /></span>
                                        </TooltipTrigger>
                                        <TooltipContent>URL for your avatar image (e.g., .png, .jpg, .gif).</TooltipContent>
                                    </Tooltip>
                                </div>
                                <Input
                                    id="picture"
                                    {...register('picture', {
                                        pattern: {
                                            value: /^(https?:\/\/)?\S+\.(?:png|jpg|jpeg|gif|svg)$/i,
                                            message: 'Invalid image URL. Must end with .png, .jpg, .jpeg, .gif, or .svg',
                                        },
                                    })}
                                    placeholder="URL for avatar image"
                                />
                                {errors.picture && <p className="text-sm text-red-500">{errors.picture.message}</p>}
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label htmlFor="banner" className="text-sm font-medium">Banner URL</label>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span><Info className="h-4 w-4 text-muted-foreground" /></span>
                                        </TooltipTrigger>
                                        <TooltipContent>URL for your profile banner image (e.g., .png, .jpg, .gif).</TooltipContent>
                                    </Tooltip>
                                </div>
                                <Input
                                    id="banner"
                                    {...register('banner', {
                                        pattern: {
                                            value: /^(https?:\/\/)?\S+\.(?:png|jpg|jpeg|gif|svg)$/i,
                                            message: 'Invalid image URL. Must end with .png, .jpg, .jpeg, .gif, or .svg',
                                        },
                                    })}
                                    placeholder="URL for banner image"
                                />
                                {errors.banner && <p className="text-sm text-red-500">{errors.banner.message}</p>}
                            </div>
                        </div>
                    </fieldset>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" type="button" className="mr-2">Cancel</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isSubmitting || !canEdit}>Save Profile</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default EditProfileDialog;
