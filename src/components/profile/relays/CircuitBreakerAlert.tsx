
import { AlertTriangle } from "lucide-react";

interface CircuitBreakerAlertProps {
  hasBlockedRelays: boolean;
}

export function CircuitBreakerAlert({ hasBlockedRelays }: CircuitBreakerAlertProps) {
  if (!hasBlockedRelays) return null;
  
  return (
    <div className="flex items-center gap-2 p-2 rounded bg-yellow-50 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 text-xs">
      <AlertTriangle className="h-3 w-3" />
      <span>Some relays are temporarily disabled due to connection issues</span>
    </div>
  );
}
