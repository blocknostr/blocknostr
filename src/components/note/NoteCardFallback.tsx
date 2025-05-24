
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NoteCardFallbackProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

const NoteCardFallback: React.FC<NoteCardFallbackProps> = ({ 
  message = "Something went wrong loading this post", 
  onRetry,
  className
}) => {
  return (
    <Card className={cn(
      "mb-4 border-accent/10 shadow-sm overflow-hidden bg-muted/20",
      className
    )}>
      <CardContent className="p-4 flex flex-col items-center text-center">
        <AlertTriangle className="h-8 w-8 text-amber-500 mb-2" />
        <p className="text-sm text-muted-foreground mb-2">{message}</p>
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="mt-2"
          >
            Try again
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default NoteCardFallback;
