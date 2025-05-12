
import Communities from "@/components/Communities";
import { Toaster } from "@/components/ui/sonner";

export const CommunitiesPage = () => {
  return (
    <div className="flex-1 overflow-hidden">
      <div className="h-[calc(100vh-3.5rem)] overflow-auto">
        <Communities />
        <Toaster position="bottom-right" />
      </div>
    </div>
  );
};

export default CommunitiesPage;
