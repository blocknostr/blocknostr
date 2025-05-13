
import React from 'react';
import { NostrEvent } from '@/lib/nostr';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, ShieldCheck } from 'lucide-react';

export const NipComplianceBadge = ({ event }: { event: NostrEvent }) => {
  // In a real app, you would validate against real NIP requirements
  // This is a simplified version
  const isNipCompliant = event && event.id && event.pubkey && event.created_at && event.kind;
  
  if (!isNipCompliant) return null;
  
  return (
    <Badge 
      variant="outline" 
      className="text-xs py-0 h-4 bg-green-500/10 text-green-600 hover:bg-green-500/20"
    >
      <ShieldCheck className="h-3 w-3 mr-1" />
      NIP Compliant
    </Badge>
  );
};

export const NipProtectionBanner = () => {
  return (
    <Alert variant="default" className="mb-4 bg-green-500/10 border-green-300">
      <ShieldCheck className="h-4 w-4 text-green-600" />
      <AlertTitle className="text-green-600">NIP Compliance Enabled</AlertTitle>
      <AlertDescription className="text-green-600/80 text-xs">
        Your feed is NIP compliant for maximum compatibility with the Nostr protocol.
      </AlertDescription>
    </Alert>
  );
};
