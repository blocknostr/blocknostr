
import React, { useState } from 'react';
import { NostrEvent } from '@/lib/nostr';
import { validateEvent } from '@/lib/nostr/utils/nip/validator';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose
} from '@/components/ui/dialog';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface NipComplianceProps {
  event: NostrEvent;
}

export function NipCompliance({ event }: NipComplianceProps) {
  const [open, setOpen] = useState(false);
  const results = validateEvent(event);
  
  // Count the issues
  const issues = Object.values(results).reduce((acc, result) => acc + (result.valid ? 0 : result.errors.length), 0);
  
  // Check if all validations passed
  const allValid = Object.values(results).every(result => result.valid);
  
  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        className="flex items-center gap-1 p-0 h-auto text-muted-foreground hover:text-primary hover:bg-transparent"
        onClick={() => setOpen(true)}
      >
        {allValid ? (
          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
        )}
        <span className="text-xs">NIP</span>
        {issues > 0 && (
          <Badge variant="destructive" className="h-4 min-w-4 p-0 text-[10px] flex items-center justify-center">
            {issues}
          </Badge>
        )}
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              NIP Compliance Check
              {allValid ? (
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                  Compliant
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                  Issues Found
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              This event has been checked against Nostr Implementation Possibilities (NIPs)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {Object.entries(results).map(([nip, result]) => (
              <div key={nip} className="border rounded-md p-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    {result.valid ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                    {nip}
                  </h3>
                  <Badge variant={result.valid ? "outline" : "destructive"} className="text-xs">
                    {result.valid ? "Valid" : `${result.errors.length} issues`}
                  </Badge>
                </div>
                
                {!result.valid && result.errors.length > 0 && (
                  <ul className="text-sm mt-2 space-y-1 text-muted-foreground">
                    {result.errors.map((error, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-amber-500 flex-shrink-0" />
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
          
          <div className="bg-muted/50 p-3 rounded-md mt-4">
            <div className="flex items-center gap-2 text-sm">
              <Info className="h-4 w-4 text-blue-500" />
              <span className="font-medium">Event ID:</span> 
              <code className="text-xs bg-muted p-1 rounded">{event.id}</code>
            </div>
          </div>
          
          <DialogClose asChild>
            <Button className="mt-4 w-full">Close</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </>
  );
}
