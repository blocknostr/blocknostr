
import Image from 'next/image';

interface ProfileBannerProps {
  bannerUrl?: string | null;
}

export function ProfileBanner({ bannerUrl }: ProfileBannerProps) {
  const defaultBanner = 'https://images.unsplash.com/photo-1633421878925-def48a15d1dd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80';
  
  return (
    <div className="relative w-full h-32 md:h-48 overflow-hidden rounded-t-lg">
      {bannerUrl || defaultBanner ? (
        <img
          src={bannerUrl || defaultBanner}
          alt="Profile banner"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-r from-blue-500/30 to-purple-500/30" />
      )}
    </div>
  );
}
