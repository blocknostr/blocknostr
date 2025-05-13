import React from 'react';
import { NostrEvent } from '@/lib/nostr';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck } from 'lucide-react';

// Create a class to handle NIP compliance checks
export class NipCompliance {
  getComplianceLevel(event: NostrEvent): 'high' | 'medium' | 'low' | 'unknown' {
    if (!event) return 'unknown';
    
    // Basic validation check
    const hasRequiredFields = event.id && event.pubkey && event.created_at && event.kind !== undefined;
    if (!hasRequiredFields) return 'low';
    
    // Check for NIP-10 compliance (tags for replies)
    const hasNip10Tags = event.tags?.some(tag => tag[0] === 'e' || tag[0] === 'p');
    
    // Check for additional NIPs (simplified version)
    const implementedNips = this.getImplementedNips(event);
    
    if (implementedNips.length >= 3) return 'high';
    if (implementedNips.length >= 1) return 'medium';
    return 'low';
  }
  
  getImplementedNips(event: NostrEvent): string[] {
    if (!event) return [];
    
    const implementedNips = ['01']; // Base NIP for event structure
    
    // Check for NIP-10 (replies and threading)
    if (event.tags?.some(tag => tag[0] === 'e')) {
      implementedNips.push('10');
    }
    
    // Check for NIP-25 (reactions)
    if (event.kind === 7) {
      implementedNips.push('25');
    }
    
    // Check for NIP-08 (mentions)
    if (event.tags?.some(tag => tag[0] === 'p')) {
      implementedNips.push('08');
    }
    
    return implementedNips;
  }
}

// Also keep the original component for backward compatibility
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
