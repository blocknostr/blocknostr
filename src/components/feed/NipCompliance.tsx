
import React from 'react';
import { NostrEvent } from '@/lib/nostr';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck } from 'lucide-react';

export const NipCompliance = ({ event }: { event: NostrEvent }) => {
  // Simple check for NIP compliance
  const isNipCompliant = event && event.id && event.pubkey && event.created_at && event.kind;
  
  if (!isNipCompliant) return null;
  
  return (
    <Badge 
      variant="outline" 
      className="text-xs py-0 h-5 bg-green-500/10 text-green-600 hover:bg-green-500/20"
    >
      <ShieldCheck className="h-3 w-3 mr-1" />
      NIP
    </Badge>
  );
};

export default NipCompliance;
