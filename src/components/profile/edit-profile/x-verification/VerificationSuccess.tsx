
import { CheckCircle2, ExternalLink } from 'lucide-react';

interface VerificationSuccessProps {
  username: string;
}

const VerificationSuccess = ({ username }: VerificationSuccessProps) => {
  return (
    <div className="bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-3 text-sm flex items-center justify-between">
      <span className="flex items-center gap-1.5">
        <CheckCircle2 className="h-4 w-4 text-[#1DA1F2]" />
        <span className="text-gray-800 dark:text-gray-200 font-medium">X account verified successfully (NIP-39)</span>
      </span>
      <a 
        href={`https://x.com/${username.replace('@', '')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#1DA1F2] hover:text-[#0d8bd7] flex items-center gap-1 text-xs font-medium transition-colors"
      >
        View profile <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
};

export default VerificationSuccess;
