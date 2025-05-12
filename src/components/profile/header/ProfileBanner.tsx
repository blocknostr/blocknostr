
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface ProfileBannerProps {
  bannerUrl?: string;
  isLoading?: boolean;
}

const ProfileBanner = ({ bannerUrl, isLoading = false }: ProfileBannerProps) => {
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState(false);
  
  // Reset states when bannerUrl changes
  React.useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [bannerUrl]);
  
  const defaultGradient = "bg-gradient-to-r from-violet-500 to-fuchsia-500";
  
  if (isLoading) {
    return <Skeleton className="h-48 md:h-64 w-full rounded-t-lg" />;
  }
  
  if (!bannerUrl || error) {
    // Return default gradient when no banner or error loading
    return <div className={`h-48 md:h-64 w-full rounded-t-lg ${defaultGradient}`}></div>;
  }

  return (
    <div className="h-48 md:h-64 w-full rounded-t-lg relative overflow-hidden">
      {/* Placeholder gradient shown until image loads */}
      <div className={`absolute inset-0 ${defaultGradient} ${loaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}></div>
      
      <img 
        src={bannerUrl} 
        alt="Profile banner" 
        className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`} 
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
};

export default ProfileBanner;
