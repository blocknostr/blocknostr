
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Check } from "lucide-react";

interface VerificationSuccessProps {
  username: string;
}

const VerificationSuccess = ({ username }: VerificationSuccessProps) => {
  return (
    <Alert variant="default" className="border-green-500 bg-green-50 dark:bg-green-900/20">
      <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
      <AlertTitle className="text-green-600 dark:text-green-400">Verification Successful!</AlertTitle>
      <AlertDescription className="text-green-600/90 dark:text-green-400/90">
        Your X account {username} has been verified.
      </AlertDescription>
    </Alert>
  );
};

export default VerificationSuccess;
