
import React from "react";
import { Button } from "@/components/ui/button";

const ProfileNotFound = () => {
  return (
    <div className="py-10 text-center">
      <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
      <p className="text-muted-foreground">
        We couldn't find this profile. It might not exist or might not be available on the connected relays.
      </p>
      <Button 
        variant="outline" 
        className="mt-4"
        onClick={() => window.location.reload()}
      >
        Retry
      </Button>
    </div>
  );
};

export default ProfileNotFound;
