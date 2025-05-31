// Replaced Sonner with React Hot Toast
// This file now exports our custom toast system for backward compatibility

import { Toaster } from 'react-hot-toast';
import { customToast } from '@/lib/toast';

// Re-export our custom toast components for backward compatibility
export { Toaster };
export const toast = customToast;

// Default export
export default { Toaster, toast };

