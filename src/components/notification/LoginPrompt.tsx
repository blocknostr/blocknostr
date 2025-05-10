
import { Button } from "@/components/ui/button";
import { nostrService } from "@/lib/nostr";

const LoginPrompt = () => {
  return (
    <div className="p-6 text-center">
      <p className="mb-4">You need to log in to see your notifications</p>
      <Button onClick={() => nostrService.login()}>
        Log in
      </Button>
    </div>
  );
};

export default LoginPrompt;
