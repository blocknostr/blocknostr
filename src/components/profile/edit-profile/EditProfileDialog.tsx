import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { ProfileFormValues } from './types';
import { nostrService } from '@/lib/nostr/service'; // Keep for currentPubkey, can be refactored later if app state provides it
import type { NostrProfileMetadata } from '@/lib/nostr';
import { toast } from 'sonner'; // Changed from "@/hooks/use-toast"
import { useUserProfile, useUpdateUserProfile } from '@/hooks/queries/useProfileQueries';
import { useQueryClient } from '@tanstack/react-query';
import { profileQueryKeys } from '@/hooks/queries/useProfileQueries';

interface EditProfileDialogProps {
    isOpen: boolean;
    onClose: () => void;
    profilePubkey: string;
}

export function EditProfileDialog({
    isOpen,
    onClose,
    profilePubkey,
}: EditProfileDialogProps) {
    const queryClient = useQueryClient();
    const { data: userProfile, isLoading: isLoadingProfile, error: profileError } = useUserProfile(profilePubkey);
    const { mutate: updateUserProfile, isPending: isSaving } = useUpdateUserProfile(profilePubkey);

    const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<ProfileFormValues>();

    useEffect(() => {
        if (userProfile) {
            reset({
                name: userProfile.name,
                displayName: userProfile.display_name,
                bio: userProfile.about,
                website: userProfile.website,
                nip05: userProfile.nip05?.split('@')[0] || '',
                picture: userProfile.picture,
                banner: userProfile.banner,
                lud16: userProfile.lud16,
            });
        }
    }, [userProfile, reset]);

    const pictureUrl = watch('picture');
    const bannerUrl = watch('banner');

    const canEdit = nostrService.publicKey && profilePubkey && nostrService.publicKey === profilePubkey;

    const onSubmit = (values: ProfileFormValues) => {
        if (!userProfile) {
            toast.error("Profile data not loaded yet. Please try again.");
            return;
        }

        const metadataToUpdate: NostrProfileMetadata = {};

        if (values.name !== undefined) metadataToUpdate.name = values.name;
        if (values.displayName !== undefined) metadataToUpdate.display_name = values.displayName;
        if (values.bio !== undefined) metadataToUpdate.about = values.bio;
        if (values.website !== undefined) metadataToUpdate.website = values.website;
        if (values.picture !== undefined) metadataToUpdate.picture = values.picture;
        if (values.banner !== undefined) metadataToUpdate.banner = values.banner;
        if (values.lud16 !== undefined) metadataToUpdate.lud16 = values.lud16;

        if (values.nip05 && values.nip05.trim() !== "") {
            metadataToUpdate.nip05 = `${values.nip05.trim()}@blocknostr.com`;
        } else {
            // Send undefined to clear the NIP-05 identifier
            metadataToUpdate.nip05 = undefined;
        }

        // Add other custom fields if they exist and are defined
        if (values.username !== undefined) metadataToUpdate.username = values.username;
        if (values.twitter !== undefined) metadataToUpdate.twitter = values.twitter;
        if (values.tweetUrl !== undefined) metadataToUpdate.tweetUrl = values.tweetUrl;

        updateUserProfile(metadataToUpdate, {
            onSuccess: () => {
                toast('Profile Updated', {
                    description: 'Your profile has been successfully updated.',
                });
                queryClient.invalidateQueries({ queryKey: profileQueryKeys.detail(profilePubkey) });
                onClose?.();
            },
            onError: (error: Error) => { // Added type for error
                toast.error('Update Failed', {
                    description: error.message || 'Could not update profile.',
                });
            },
        });
    };

    const handleClearCacheAndReload = () => {
        queryClient.invalidateQueries({ queryKey: profileQueryKeys.detail(profilePubkey) })
            .then(() => {
                toast('Cache Cleared', {
                    description: 'Profile cache has been cleared and data reloaded.',
                });
            })
            .catch((error: Error) => {
                toast.error('Error Clearing Cache', {
                    description: error.message || 'Could not clear cache.',
                });
            });
    };

    // Corrected: use isLoadingProfile and profileError
    if (isLoadingProfile) return <DialogDescription>Loading profile...</DialogDescription>;
    if (profileError) return <DialogDescription>Error loading profile: {profileError.message}</DialogDescription>;
    // Ensure userProfile exists before trying to render the form, even if not loading and no error
    if (!userProfile && !isLoadingProfile && !profileError) {
        return <DialogDescription>Profile data is not available. It might be a new or empty profile.</DialogDescription>;
    }


    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogTrigger asChild>
                <Button variant="outline" disabled={!canEdit}>Edit Profile</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                        Edit your profile including name, display name, bio, website, NIP-05 username (blocknostr.com), Lightning address, avatar, and banner.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" id="edit-profile-form">
                    {/* Show warning if not owner */}
                    {!canEdit && profilePubkey && (
                        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                            <p className="font-bold">Ownership Mismatch!</p>
                            <p>You are not the owner of this profile. Please switch to the correct account to edit.</p>
                            <p className="mt-2 text-xs">
                                Current active public key (first 10 chars): <code>{nostrService.publicKey?.substring(0, 10)}...</code><br />
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
                    {!canEdit && !profilePubkey && userProfile && (
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

                    <fieldset disabled={!canEdit || isSaving} className="space-y-6">
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
                </form>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                    </DialogClose>
                    <Button type="submit" form="edit-profile-form" disabled={!canEdit || isSaving}>
                        {isSaving ? 'Saving...' : 'Save Profile'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
