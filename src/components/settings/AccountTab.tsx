
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { nostrService } from "@/lib/nostr";

const AccountTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Settings</CardTitle>
        <CardDescription>
          Manage your account settings and preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="pubkey">Your Public Key (NPUB)</Label>
          <div className="flex items-center mt-1.5 gap-2">
            <Input 
              id="pubkey" 
              readOnly 
              value={nostrService.publicKey ? nostrService.formatPubkey(nostrService.publicKey) : ''}
            />
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(
                  nostrService.publicKey ? nostrService.formatPubkey(nostrService.publicKey) : ''
                );
                toast.success("Public key copied to clipboard");
              }}
            >
              Copy
            </Button>
          </div>
        </div>
        
        <div>
          <Label>Profile Information</Label>
          <p className="text-sm text-muted-foreground mt-1">
            To update your profile information, post a kind 0 event with your metadata.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountTab;
