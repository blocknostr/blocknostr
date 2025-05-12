
import React from 'react';

interface ProfileBannerProps {
  bannerUrl?: string;
}

const ProfileBanner = ({ bannerUrl }: ProfileBannerProps) => {
  return (
    <div className="relative h-40 md:h-60 w-full overflow-hidden">
      {bannerUrl ? (
        <img
          src={bannerUrl}
          alt="Profile Banner"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-r from-primary/20 to-primary/10" />
      )}
    </div>
  );
};

export default ProfileBanner;
