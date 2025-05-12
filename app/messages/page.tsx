
'use client';

import MessagingSystem from "@/components/MessagingSystem";
import { InfoIcon } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/navigation/PageHeader";

export default function MessagesPage() {
  const [encryptionInfoShown, setEncryptionInfoShown] = useState(true);

  return (
    <>
      <PageHeader 
        title="Messages" 
        showBackButton={true}
      />
      
      <div className="flex-1 flex flex-col">
        {encryptionInfoShown && (
          <Alert className="mx-2 mt-1 mb-1 py-1.5">
            <InfoIcon className="h-3.5 w-3.5" />
            <AlertTitle className="text-sm">End-to-End Encrypted</AlertTitle>
            <AlertDescription className="text-xs">
              Messages are encrypted using NIP-44 (updated from NIP-04) for maximum security.
              <Button 
                variant="link" 
                className="p-0 h-auto text-xs ml-1"
                onClick={() => setEncryptionInfoShown(false)}
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex-1 overflow-hidden">
          <MessagingSystem />
        </div>
      </div>
    </>
  );
}
