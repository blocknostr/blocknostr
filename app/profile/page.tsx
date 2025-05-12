
'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { nostrService } from "@/lib/nostr";
import ProfileLoading from "@/components/profile/ProfileLoading";
import PageHeader from "@/components/navigation/PageHeader";

export default function ProfilePage() {
  const router = useRouter();
  const currentUserPubkey = nostrService.publicKey;
  
  // Redirect to current user's profile if a user is logged in
  useEffect(() => {
    if (currentUserPubkey) {
      const formattedPubkey = nostrService.formatPubkey(currentUserPubkey);
      router.push(`/profile/${formattedPubkey}`);
    }
  }, [currentUserPubkey, router]);
  
  return (
    <>
      <PageHeader 
        title="Profile"
        showBackButton={true}
      />
      <ProfileLoading />
    </>
  );
}
