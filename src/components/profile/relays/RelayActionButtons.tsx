
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface RelayActionButtonsProps {
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
}

export function RelayActionButtons({ onRefresh, isRefreshing }: RelayActionButtonsProps) {
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={onRefresh}
      disabled={isRefreshing}
      className="ml-2 h-7 px-2"
    >
      <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
      Refresh
    </Button>
  );
}
