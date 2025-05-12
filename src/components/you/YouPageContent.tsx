
import React from 'react';
import YouHeader from "@/components/you/YouHeader";
import EditProfileSection from "@/components/you/EditProfileSection";
import ProfilePreview from "@/components/you/ProfilePreview";

interface YouPageContentProps {
  profileData: any;
  isEditing: boolean;
  toggleEditing: () => void;
  onSaved: () => void;
  profileKey: number;
}

const YouPageContent: React.FC<YouPageContentProps> = ({ 
  profileData, 
  isEditing, 
  toggleEditing, 
  onSaved,
  profileKey
}) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <YouHeader 
        profileData={profileData} 
        isEditing={isEditing} 
        toggleEditing={toggleEditing} 
      />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          {isEditing ? (
            <EditProfileSection 
              profileData={profileData.profileData} 
              onSaved={onSaved} 
            />
          ) : (
            <div className="space-y-6">
              {profileData.profileData?.about && (
                <div className="bg-card rounded-lg p-6 shadow">
                  <h2 className="text-lg font-medium mb-2">About</h2>
                  <p className="whitespace-pre-wrap text-card-foreground">{profileData.profileData.about}</p>
                </div>
              )}
              
              <div className="bg-card rounded-lg p-6 shadow">
                <h2 className="text-lg font-medium mb-4">Stats</h2>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{profileData.events.length}</div>
                    <div className="text-sm text-muted-foreground">Posts</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{profileData.following.length}</div>
                    <div className="text-sm text-muted-foreground">Following</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{profileData.followers.length}</div>
                    <div className="text-sm text-muted-foreground">Followers</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="lg:col-span-2">
          <ProfilePreview profileData={{...profileData, key: profileKey}} />
        </div>
      </div>
    </div>
  );
};

export default YouPageContent;
