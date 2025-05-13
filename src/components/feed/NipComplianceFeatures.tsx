
import React from 'react';
import { NostrEvent } from '@/lib/nostr';
import { validateEvent, isEventCompliant } from '@/lib/nostr/utils/nip/validator';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

export function NipComplianceBadge({ event }: { event: NostrEvent }) {
  const { compliant, results } = isEventCompliant(event);
  
  const issuesCount = Object.values(results).reduce(
    (count, result) => count + (result.valid ? 0 : result.errors.length),
    0
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center">
            {compliant ? (
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 gap-1 h-5">
                <CheckCircle className="h-3 w-3" />
                <span>NIP Compliant</span>
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1 h-5">
                <AlertTriangle className="h-3 w-3" />
                <span>{issuesCount} {issuesCount === 1 ? 'issue' : 'issues'}</span>
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="w-64">
          <div className="text-xs">
            <p className="font-semibold mb-1">NIP Compliance Check</p>
            <ul className="space-y-1">
              {Object.entries(results).map(([nip, result]) => (
                <li key={nip} className="flex items-center gap-1">
                  {result.valid ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                  )}
                  <span>{nip}: {result.valid ? 'Valid' : `${result.errors.length} issues`}</span>
                </li>
              ))}
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function NipProtectionBanner() {
  return (
    <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-3 mb-4 flex items-center gap-3">
      <Shield className="h-5 w-5 text-blue-500" />
      <div>
        <h4 className="font-medium text-sm">NIP Compliance Protection</h4>
        <p className="text-xs text-muted-foreground">
          This feed is protected by NIP compliance checks to ensure a reliable and interoperable Nostr experience.
        </p>
      </div>
    </div>
  );
}
