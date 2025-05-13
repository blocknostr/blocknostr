
import React from 'react';
import { NostrEvent } from '@/lib/nostr';
import { NipCompliance } from './NipCompliance';
import { Shield, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export const NipComplianceBadge: React.FC<{ event: NostrEvent }> = ({ event }) => {
  const compliance = new NipCompliance(event);
  const complianceLevel = compliance.getComplianceLevel();
  
  if (!complianceLevel || complianceLevel === 'unknown') return null;
  
  const colorMap = {
    high: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800/30",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/30",
    low: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800/30"
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`text-[10px] py-0 px-2 font-medium ${colorMap[complianceLevel]}`}>
            <Shield className="h-2.5 w-2.5 mr-1" />
            NIP {compliance.getImplementedNips().join(', ')}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            This post follows Nostr Implementation Possibilities (NIPs): {compliance.getImplementedNips().join(', ')}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const NipProtectionBanner: React.FC = () => {
  return (
    <Alert className="mb-4 bg-primary/5 border-primary/20">
      <div className="flex items-center">
        <Shield className="h-4 w-4 text-primary mr-2" />
        <div>
          <AlertTitle className="text-sm font-medium">NIP Compliance Protection</AlertTitle>
          <AlertDescription className="text-xs">
            Posts in this feed are verified for compliance with Nostr Implementation Possibilities (NIPs)
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
};
