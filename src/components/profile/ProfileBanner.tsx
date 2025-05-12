
import React from 'react';
// Remove next/image import and use an img element directly

interface ProfileBannerProps {
  bannerUrl?: string;
  alt?: string;
  className?: string;
}

const ProfileBanner: React.FC<ProfileBannerProps> = ({
  bannerUrl,
  alt = "Profile Banner",
  className = ""
}) => {
  // Default banner if none provided
  const defaultBanner = "/images/default-banner.jpg";
  
  return (
    <div className={`w-full h-48 overflow-hidden ${className}`}>
      {bannerUrl ? (
        <img 
          src={bannerUrl} 
          alt={alt}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to default if error occurs
            const target = e.target as HTMLImageElement;
            target.src = defaultBanner;
          }}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-r from-blue-400 to-purple-500"></div>
      )}
    </div>
  );
};

export default ProfileBanner;
