
import { CheckCircle2, ExternalLink } from 'lucide-react';

interface VerificationSuccessProps {
  username: string;
}

const VerificationSuccess = ({ username }: VerificationSuccessProps) => {
  return (
    <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm flex items-center justify-between">
      <span className="flex items-center gap-1">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        X account verified successfully (NIP-39)
      </span>
      <a 
        href={`https://x.com/${username.replace('@', '')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 hover:underline flex items-center gap-1 text-xs"
      >
        View profile <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
};

export default VerificationSuccess;
