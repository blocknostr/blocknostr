import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, Clock, Wifi, AlertTriangle, CheckCircle } from 'lucide-react';

interface RateLimitNotificationProps {
  rateLimitInfo?: any;
  isOnline: boolean;
  className?: string;
}

const RateLimitNotification: React.FC<RateLimitNotificationProps> = ({
  rateLimitInfo,
  isOnline,
  className = ""
}) => {
  if (!rateLimitInfo) return null;

  // Check if any endpoint is rate limited
  const hasRateLimits = Object.values(rateLimitInfo.endpoints || {}).some((info: any) => 
    info.backoffUntil > Date.now()
  );

  // Check if any endpoint is near limits
  const nearLimits = Object.values(rateLimitInfo.endpoints || {}).some((info: any) => 
    (info.requestsInWindow / info.maxRequests) > 0.8
  );

  // Don't show notification if everything is fine
  if (!hasRateLimits && !nearLimits && isOnline) return null;

  const getIcon = () => {
    if (!isOnline) return <Wifi className="h-4 w-4" />;
    if (hasRateLimits) return <AlertTriangle className="h-4 w-4" />;
    if (nearLimits) return <Clock className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const getVariant = (): "default" | "destructive" => {
    if (hasRateLimits) return "destructive";
    return "default";
  };

  const getTitle = () => {
    if (!isOnline) return "Offline Mode";
    if (hasRateLimits) return "Rate Limited";
    if (nearLimits) return "Approaching Rate Limits";
    return "Connected";
  };

  const getDescription = () => {
    if (!isOnline) {
      return "Using cached data. Connect to internet for live updates.";
    }
    if (hasRateLimits) {
      return "API requests are temporarily limited. Using cached data when available.";
    }
    if (nearLimits) {
      return "Approaching API rate limits. Some requests may be delayed to prevent blocking.";
    }
    return "";
  };

  const getStatusBadges = () => {
    if (!rateLimitInfo.endpoints) return null;

    const badges = Object.entries(rateLimitInfo.endpoints).map(([endpoint, info]: [string, any]) => {
      const usage = (info.requestsInWindow / info.maxRequests) * 100;
      const isBackedOff = info.backoffUntil > Date.now();
      
      let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
      let status = "OK";
      
      if (isBackedOff) {
        variant = "destructive";
        status = "WAIT";
      } else if (usage >= 80) {
        variant = "outline";
        status = "HIGH";
      } else if (usage >= 50) {
        variant = "default";
        status = "MID";
      }

      return (
        <Badge key={endpoint} variant={variant} className="text-xs">
          {endpoint.toUpperCase()}: {status}
        </Badge>
      );
    });

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {badges}
      </div>
    );
  };

  return (
    <Alert variant={getVariant()} className={className}>
      <div className="flex items-start gap-2">
        {getIcon()}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{getTitle()}</span>
            <Badge variant="outline" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              Smart Caching Active
            </Badge>
          </div>
          <AlertDescription className="mt-1">
            {getDescription()}
          </AlertDescription>
          {getStatusBadges()}
        </div>
      </div>
    </Alert>
  );
};

export default RateLimitNotification; 

