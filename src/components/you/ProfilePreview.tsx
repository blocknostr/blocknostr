
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Globe, Twitter, Github, Zap } from 'lucide-react';
import { isValidNip05Format } from '@/lib/nostr/utils/nip/nip05';
import { checkXVerification } from '@/lib/nostr/utils/nip/nip39';

interface ProfilePreviewProps {
  profileData: any;
}

const ProfilePreview = ({ profileData }: ProfilePreviewProps) => {
  const { profileData: profile, loading, refreshProfile } = profileData;
  const [key, setKey] = useState(Date.now());
  
  // Force re-render when profile data changes
  useEffect(() => {
    if (profile) {
      setKey(Date.now());
    }
  }, [profile]);
  
  if (loading || !profile) {
    return (
      <Card className="border shadow">
        <CardHeader>
          <CardTitle>Profile Preview</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-32 bg-muted relative">
            <Skeleton className="h-full w-full" />
            <div className="absolute -bottom-10 left-6">
              <Skeleton className="h-20 w-20 rounded-full border-4 border-background" />
            </div>
          </div>
          
          <div className="mt-12 p-6 space-y-4">
            <div className="space-y-1">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-60" />
            </div>
            
            <Skeleton className="h-20 w-full" />
            
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check for verifications
  const nip05Identifier = profile.nip05;
  const hasValidNip05 = nip05Identifier && isValidNip05Format(nip05Identifier);
  
  // Use safe checking since checkXVerification might not be available
  const { xVerified, xVerifiedInfo } = typeof checkXVerification === 'function' 
    ? checkXVerification(profile) 
    : { xVerified: false, xVerifiedInfo: null };

  // Format created_at date if available
  const formattedDate = profile.created_at 
    ? new Date(profile.created_at * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : null;

  // Display name logic
  const displayName = profile.display_name || profile.name || "Unnamed";
  const username = profile.name || "";
  
  return (
    <Card className="border shadow" key={key}>
      <CardHeader>
        <CardTitle>Profile Preview</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Banner */}
        <div className="h-32 bg-muted relative">
          {profile.banner && (
            <img 
              src={profile.banner} 
              alt="Banner" 
              className="h-full w-full object-cover"
              key={`banner-${key}`}
            />
          )}
          <div className="absolute -bottom-10 left-6">
            {profile.picture ? (
              <img 
                src={profile.picture} 
                alt={displayName}
                className="h-20 w-20 rounded-full object-cover border-4 border-background"
                key={`avatar-${key}`}
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-medium border-4 border-background">
                {displayName[0]?.toUpperCase()}
              </div>
            )}
          </div>
        </div>
        
        {/* Profile content */}
        <div className="mt-12 p-6 space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">{displayName}</h2>
              {hasValidNip05 && (
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary">
                  ✓
                </Badge>
              )}
            </div>
            {username && <p className="text-muted-foreground">@{username}</p>}
          </div>
          
          {profile.about && (
            <p className="text-sm">{profile.about}</p>
          )}
          
          {/* Links and metadata */}
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            {formattedDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Joined {formattedDate}</span>
              </div>
            )}
            
            {profile.website && (
              <div className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                <a 
                  href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {profile.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
            
            {profile.twitter && (
              <div className="flex items-center gap-1">
                <Twitter className="h-3 w-3" />
                <a 
                  href={`https://twitter.com/${profile.twitter}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  @{profile.twitter}
                </a>
                {xVerified && (
                  <Badge variant="outline" className="text-xs h-4 bg-blue-500/10 text-blue-500 ml-0.5">✓</Badge>
                )}
              </div>
            )}
            
            {profile.github && (
              <div className="flex items-center gap-1">
                <Github className="h-3 w-3" />
                <a 
                  href={`https://github.com/${profile.github}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {profile.github}
                </a>
              </div>
            )}
            
            {profile.lud16 && (
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                <span>{profile.lud16}</span>
              </div>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-2">
            <Button variant="default" size="sm" disabled className="opacity-50">
              Follow
            </Button>
            <Button variant="outline" size="sm" disabled className="opacity-50">
              Message
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => profileData.refreshProfile?.()}
              className="ml-auto"
            >
              Refresh
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfilePreview;
