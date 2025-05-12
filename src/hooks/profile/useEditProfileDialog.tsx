
import { useState } from 'react';

export function useEditProfileDialog() {
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  const openEditProfile = () => {
    setIsEditOpen(true);
  };

  const handleProfileUpdated = (refreshCallback: () => void) => {
    setIsEditOpen(false);
    refreshCallback();
  };

  return {
    isEditOpen,
    setIsEditOpen,
    openEditProfile,
    handleProfileUpdated
  };
}
