
import React from "react";

const AlephiumLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 64 64" 
      width="100%" 
      height="100%"
      fill="currentColor"
      {...props}
    >
      <circle cx="32" cy="32" r="30" fill="#000000" />
      <path d="M24 20L36 44M40 20L28 44" stroke="white" strokeWidth="6" strokeLinecap="round" />
      <rect x="38" y="20" width="5" height="10" rx="1" fill="white" />
      <rect x="21" y="34" width="5" height="10" rx="1" fill="white" />
    </svg>
  );
};

export default AlephiumLogo;
