
import React from "react";

interface ProfileBannerProps {
  bannerUrl?: string;
}

export const ProfileBanner = ({ bannerUrl }: ProfileBannerProps) => {
  return (
    <div 
      className="h-48 md:h-64 bg-gradient-to-r from-violet-500 to-fuchsia-500 w-full rounded-t-lg"
      style={bannerUrl ? { 
        backgroundImage: `url(${bannerUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      } : {}}
    ></div>
  );
};

export default ProfileBanner;
