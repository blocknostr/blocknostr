import React from 'react';
import { useParams } from 'react-router-dom';
import PrimalProfileDisplay from '@/components/profile/PrimalProfileDisplay';

const ProfilePage: React.FC = () => {
  const { pubkey } = useParams<{ pubkey?: string }>();

  return (
    <PrimalProfileDisplay routePubkey={pubkey} />
  );
};

export default ProfilePage;
