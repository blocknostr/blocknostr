
// Simple shim for next/font/google to work with our Vite setup
export const Inter = ({ subsets }) => {
  // Just return a className for the font
  return {
    className: 'font-sans',
    style: {
      fontFamily: 'Inter, sans-serif',
    },
  };
};

// Add other Google fonts as needed
export const Roboto = ({ subsets, weight }) => {
  return {
    className: 'font-sans',
    style: {
      fontFamily: 'Roboto, sans-serif',
      fontWeight: Array.isArray(weight) ? weight[0] : weight,
    },
  };
};
