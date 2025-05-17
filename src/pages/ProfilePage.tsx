
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

/**
 * @deprecated This page has been deprecated in favor of ProfileViewPage.
 * Please use /profile/:npub instead of /profile-deprecated/:npub
 */
const ProfilePage = () => {
  const { npub } = useParams<{ npub: string }>();
  const navigate = useNavigate();
  
  // Redirect to the new profile page
  const handleRedirect = () => {
    navigate(`/profile/${npub}`);
  };
  
  return (
    <div className="container max-w-3xl mx-auto px-4 py-12">
      <Alert variant="destructive" className="mb-6">
        <AlertTitle className="text-lg font-semibold">Deprecated Page</AlertTitle>
        <AlertDescription>
          <p className="mb-4">This profile page has been deprecated and will be removed in a future update.</p>
          <Button onClick={handleRedirect} variant="outline">
            Go to New Profile Page
          </Button>
        </AlertDescription>
      </Alert>
      
      <div className="text-center py-8">
        <p className="mb-2 text-xl">This page is no longer maintained</p>
        <p className="text-muted-foreground">Please use the new profile page for an improved experience.</p>
      </div>
    </div>
  );
};

export default ProfilePage;
