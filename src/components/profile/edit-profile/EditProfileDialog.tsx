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
        }
    }, [profile, reset]);

    // Watch fields for live previews
    const pictureUrl = watch('picture');
    const bannerUrl = watch('banner');

    const currentPubkey = nostrService.publicKey;
    // Type-safe check for pubkey property
    const profilePubkey = profile && typeof profile === 'object' && 'pubkey' in profile ? (profile as { pubkey: string }).pubkey : '';
    const canEdit = currentPubkey && profilePubkey && currentPubkey === profilePubkey;

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
                    {!canEdit && (
                        <div className="text-red-500 text-sm mb-2">
                            You are not the owner of this profile. Please switch to the correct account to edit.
                        </div>
                    )}

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
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label htmlFor="picture" className="text-sm font-medium">Avatar URL</label>
                            <Input
                                id="picture"
                                {...register('picture', {
                                    pattern: {
                                        value: /^(https?:\/\/)?\S+\.(?:png|jpg|jpeg|gif|svg)$/i,
                                        message: 'Invalid image URL',
                                    },
                                })}
                                placeholder="URL for avatar image"
                            />
                            {errors.picture && <p className="text-sm text-red-500">{errors.picture.message}</p>}
                        </div>
                        <div className="space-y-1">
                            <label htmlFor="banner" className="text-sm font-medium">Banner URL</label>
                            <Input
                                id="banner"
                                {...register('banner', {
                                    pattern: {
                                        value: /^(https?:\/\/)?\S+\.(?:png|jpg|jpeg|gif|svg)$/i,
                                        message: 'Invalid image URL',
                                    },
                                })}
                                placeholder="URL for banner image"
                            />
                            {errors.banner && <p className="text-sm text-red-500">{errors.banner.message}</p>}
                        </div>
                    </div>

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
