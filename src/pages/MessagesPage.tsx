
import React, { useState } from "react";
import MessagingSystem from "@/components/MessagingSystem";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/navigation/PageHeader";

const MessagesPage = () => {
  const [encryptionInfoShown, setEncryptionInfoShown] = useState(true);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
      <PageHeader 
        title="Messages" 
        showBackButton={false}
        className="border-b shadow-sm"
      />
      
      {encryptionInfoShown && (
        <div className="relative z-10 px-4 py-2">
          <Alert className="border-primary/20 bg-primary/5 max-w-full overflow-hidden">
            <InfoIcon className="h-4 w-4 text-primary" />
            <AlertTitle className="text-sm font-medium">End-to-End Encrypted</AlertTitle>
            <AlertDescription className="text-xs text-muted-foreground flex items-center justify-between">
              <span className="truncate mr-2">
                Messages are encrypted using NIP-44 for maximum security. Only you and your recipient can read them.
              </span>
              <Button 
                variant="link" 
                className="p-0 h-auto text-xs whitespace-nowrap text-primary shrink-0"
                onClick={() => setEncryptionInfoShown(false)}
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      <div className="flex-1 overflow-hidden">
        <MessagingSystem />
      </div>
    </div>
  );
};

export default MessagesPage;
