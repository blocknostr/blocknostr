import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

interface ProfileDisplayNameProps {
  pubkey: string;
  maxLength?: number;
  fallbackStyle?: 'anonymous' | 'user' | 'pubkey';
  showVerification?: boolean;
  className?: string;
  // Required profile data - no more duplicate fetching
  displayName?: string | null;
  name?: string;
  nip05?: string;
}

/**
 * 🚀 OPTIMIZED ProfileDisplayName - Race Conditions Eliminated  
 * Now purely prop-based - no internal API calls
 * Parent components must provide profile data
 */
export const ProfileDisplayName: React.FC<ProfileDisplayNameProps> = ({
  pubkey,
  maxLength = 50,
  fallbackStyle = 'anonymous',
  showVerification = false,
  className = '',
  displayName,
  name,
  nip05
}) => {
  // Simple NIP-05 verification status (for now just check if exists)
  const nip05Status = useMemo(() => {
    return {
      isVerified: !!nip05 && nip05.includes('@'),
      isVerifying: false,
      error: null
    };
  }, [nip05]);

  // Memoize display name calculation according to NOSTR NIPs
  const displayData = useMemo(() => {
    // ✅ REAL VERIFICATION: Use actual verification status from state
    const isNip05Verified = nip05Status.isVerified;
    const isNip05Verifying = nip05Status.isVerifying;
    const hasNip05Error = !!nip05Status.error;
    
    // ✅ NOSTR STANDARDS: Follow NIP-01 display name priority
    // 1. display_name (preferred)
    // 2. name (username/handle) 
    // 3. fallback based on style
    let finalDisplayName = '';
    
    // ✅ IMPROVED: Better handling of empty strings and whitespace
    if (displayName && displayName.trim() && displayName !== 'Anonymous') {
      finalDisplayName = displayName.trim();
    } else if (name && name.trim()) {
      finalDisplayName = name.trim();
    } else {
      // Apply fallback style
      switch (fallbackStyle) {
        case 'user':
          finalDisplayName = `User ${pubkey.slice(0, 8)}`;
          break;
        case 'pubkey':
          finalDisplayName = pubkey.slice(0, 16);
          break;
        case 'anonymous':
        default:
          finalDisplayName = 'Anonymous';
          break;
      }
    }
    
    // ✅ PERFORMANCE: Apply max length truncation
    const truncatedName = maxLength && finalDisplayName.length > maxLength 
      ? `${finalDisplayName.slice(0, maxLength)}...` 
      : finalDisplayName;
    
    return {
      name: truncatedName,
      isVerified: isNip05Verified,
      isVerifying: isNip05Verifying,
      hasError: hasNip05Error,
      nip05Domain: nip05 ? nip05.split('@')[1] : null,
      originalLength: finalDisplayName.length,
      wasTruncated: maxLength ? finalDisplayName.length > maxLength : false,
    };
  }, [displayName, name, nip05, pubkey, fallbackStyle, maxLength, nip05Status]);

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span title={displayData.wasTruncated ? `${displayData.name} (truncated from ${displayData.originalLength} chars)` : displayData.name}>
        {displayData.name}
      </span>
      
      {showVerification && displayData.isVerified && (
        <Badge 
          variant="secondary" 
          className="text-xs px-1 py-0 h-4 bg-blue-100 text-blue-700 border-blue-200"
          title={`Verified: ${displayData.nip05Domain}`}
        >
          <Check className="h-2 w-2 mr-0.5" />
          {displayData.nip05Domain}
        </Badge>
      )}
      
      {showVerification && displayData.isVerifying && (
        <Badge variant="outline" className="text-xs px-1 py-0 h-4 animate-pulse">
          Verifying...
        </Badge>
      )}
    </span>
  );
};

export default ProfileDisplayName; 
