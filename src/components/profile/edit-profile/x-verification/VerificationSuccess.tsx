
import React from 'react';
import { Check, Twitter } from "lucide-react";

interface VerificationSuccessProps {
  username: string;
}

const VerificationSuccess = ({ username }: VerificationSuccessProps) => {
  return (
    <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
      <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center flex-shrink-0">
        <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-green-800 dark:text-green-300">
          Your X account has been verified
        </p>
        <div className="flex items-center text-xs text-green-700 dark:text-green-400 mt-0.5">
          <Twitter className="h-3 w-3 mr-1" />
          @{username}
        </div>
      </div>
    </div>
  );
};

export default VerificationSuccess;
