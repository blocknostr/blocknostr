
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const CommunityNotFound = () => {
  const navigate = useNavigate();
  
  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      <div className="flex items-center mb-6">
        <Button 
          onClick={() => navigate('/communities')}
          variant="ghost"
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Communities
        </Button>
      </div>
      
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Community not found</h2>
        <p className="text-muted-foreground mb-6">The community you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => navigate('/communities')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Communities
        </Button>
      </div>
    </div>
  );
};

export default CommunityNotFound;

