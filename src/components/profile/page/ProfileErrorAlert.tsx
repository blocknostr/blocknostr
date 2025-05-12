
import React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ProfileErrorAlertProps {
  error: string;
  handleRefresh: () => void;
}

const ProfileErrorAlert: React.FC<ProfileErrorAlertProps> = ({ error, handleRefresh }) => {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        {error}
        <Button
          variant="link"
          className="p-0 h-auto ml-2"
          onClick={handleRefresh}
        >
          Try again
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default ProfileErrorAlert;
