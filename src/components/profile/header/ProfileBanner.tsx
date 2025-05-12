
import React from "react";

interface ProfileBannerProps {
  bannerUrl?: string;
}

const ProfileBanner = ({ bannerUrl }: ProfileBannerProps) => {
  const [hasError, setHasError] = React.useState(false);

  // Handle image load errors
  const handleImageError = () => {
    console.warn("Banner image failed to load:", bannerUrl);
    setHasError(true);
  };

  return (
    <div 
      className={`h-48 md:h-64 w-full rounded-t-lg transition-all duration-500 ${
        !bannerUrl || hasError 
          ? "bg-gradient-to-r from-violet-500 to-fuchsia-500" 
          : ""
      }`}
      style={bannerUrl && !hasError ? { 
        backgroundImage: `url(${bannerUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      } : {}}
      role="img"
      aria-label="Profile banner"
    >
      {bannerUrl && (
        <img 
          src={bannerUrl} 
          className="hidden" 
          alt=""
          onError={handleImageError}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default ProfileBanner;
