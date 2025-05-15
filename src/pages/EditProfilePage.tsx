
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { nostrService } from "@/lib/nostr";
import { toast } from "sonner";
import ProfileEditor from "@/components/profile/edit-profile/ProfileEditor";
import { PageHeader } from "@/components/ui/page-header";

const EditProfilePage = () => {
  const navigate = useNavigate();
  const pubkey = nostrService.publicKey;

  // Redirect if not logged in
  useEffect(() => {
    if (!pubkey) {
      toast.error("You need to log in to edit your profile");
      navigate("/");
    }
  }, [pubkey, navigate]);

  return (
    <div className="flex-1">
      <PageHeader title="Edit Profile" />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <ProfileEditor />
      </div>
    </div>
  );
};

export default EditProfilePage;
