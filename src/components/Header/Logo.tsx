
import React from 'react';
import { Link } from 'react-router-dom';

const Logo: React.FC = () => {
  return (
    <Link to="/" className="text-xl font-bold flex items-center gap-2">
      BlockNoster
    </Link>
  );
};

export default Logo;
