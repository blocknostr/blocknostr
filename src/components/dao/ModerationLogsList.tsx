import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Activity, Clock, Shield, Ban, CheckCircle, X, Flag, UserMinus } from "lucide-react";
import { ModerationLogEntry } from "@/api/types/dao";

interface ModerationLogsListProps {
  logs: ModerationLogEntry[];
  isLoading?: boolean;
}

const ModerationLogsList: React.FC<ModerationLogsListProps> = ({ 
  logs, 
  isLoading = false 
}) => {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'approve_post': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'reject_post': return <X className="h-4 w-4 text-red-600" />;
      case 'ban': return <Ban className="h-4 w-4 text-red-600" />;
      case 'unban': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'kick': return <UserMinus className="h-4 w-4 text-orange-600" />;
      case 'review_report': return <Flag className="h-4 w-4 text-blue-600" />;
      default: return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'approve_post': return 'bg-green-100 text-green-800 border-green-300';
      case 'reject_post': return 'bg-red-100 text-red-800 border-red-300';
      case 'ban': return 'bg-red-100 text-red-800 border-red-300';
      case 'unban': return 'bg-green-100 text-green-800 border-green-300';
      case 'kick': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'review_report': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatActionText = (action: string) => {
    switch (action) {
      case 'approve_post': return 'Approved Post';
      case 'reject_post': return 'Rejected Post';
      case 'ban': return 'Banned Member';
      case 'unban': return 'Unbanned Member';
      case 'kick': return 'Kicked Member';
      case 'review_report': return 'Reviewed Report';
      default: return action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="py-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="w-3/4 h-4 bg-muted rounded" />
                  <div className="w-1/2 h-3 bg-muted rounded" />
                </div>
                <div className="w-16 h-6 bg-muted rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No moderation activity</h3>
          <p className="text-muted-foreground">
            No moderation actions have been recorded yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Moderation Activity</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Activity className="h-4 w-4" />
          <span>{logs.length} action{logs.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="space-y-3">
        {logs.map((log) => (
          <Card key={log.id} className="border-l-4 border-l-blue-500">
            <CardContent className="py-4">
              <div className="flex items-start space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {log.moderator.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-sm font-medium">
                      {log.moderator.substring(0, 8)}...
                    </p>
                    <Badge variant="outline" className={`text-xs ${getActionColor(log.action)}`}>
                      <span className="mr-1">{getActionIcon(log.action)}</span>
                      {formatActionText(log.action)}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      <strong>Target:</strong> {log.target.substring(0, 16)}...
                    </p>
                    
                    {log.reason && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Reason:</strong> {log.reason}
                      </p>
                    )}
                    
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        <strong>Details:</strong>
                        <ul className="list-disc list-inside ml-2 mt-1">
                          {Object.entries(log.metadata).map(([key, value]) => (
                            <li key={key}>
                              {key}: {String(value)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    {formatDistanceToNow(new Date(log.timestamp * 1000), { 
                      addSuffix: true 
                    })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>
              All moderation actions are logged for transparency and accountability.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModerationLogsList; 

