import toast, { Toaster } from 'react-hot-toast';
import { CheckCircle, XCircle, AlertTriangle, Info, Zap, Wifi, WifiOff, Shield, Loader2 } from 'lucide-react';
import React from 'react';

// Custom toast types for Nostr/crypto theme
export type NostrToastType = 
  | 'success' 
  | 'error' 
  | 'warning' 
  | 'info' 
  | 'loading'
  | 'nostr'
  | 'crypto'
  | 'relay'
  | 'auth'
  | 'zap';

// Options interface for backward compatibility
export interface ToastOptions {
  description?: string;
}

// Icon mapping for different toast types
const getToastIcon = (type: NostrToastType) => {
  switch (type) {
    case 'success':
      return CheckCircle;
    case 'error':
      return XCircle;
    case 'warning':
      return AlertTriangle;
    case 'info':
      return Info;
    case 'loading':
      return Loader2;
    case 'nostr':
      return Shield;
    case 'crypto':
      return Zap;
    case 'relay':
      return Wifi;
    case 'auth':
      return Shield;
    case 'zap':
      return Zap;
    default:
      return Info;
  }
};

// Color schemes for different toast types
const getToastColors = (type: NostrToastType) => {
  switch (type) {
    case 'success':
      return {
        bg: 'bg-emerald-500/10 dark:bg-emerald-400/10',
        border: 'border-emerald-500/20 dark:border-emerald-400/20',
        icon: 'text-emerald-600 dark:text-emerald-400',
        text: 'text-emerald-900 dark:text-emerald-100'
      };
    case 'error':
      return {
        bg: 'bg-red-500/10 dark:bg-red-400/10',
        border: 'border-red-500/20 dark:border-red-400/20',
        icon: 'text-red-600 dark:text-red-400',
        text: 'text-red-900 dark:text-red-100'
      };
    case 'warning':
      return {
        bg: 'bg-amber-500/10 dark:bg-amber-400/10',
        border: 'border-amber-500/20 dark:border-amber-400/20',
        icon: 'text-amber-600 dark:text-amber-400',
        text: 'text-amber-900 dark:text-amber-100'
      };
    case 'info':
      return {
        bg: 'bg-blue-500/10 dark:bg-blue-400/10',
        border: 'border-blue-500/20 dark:border-blue-400/20',
        icon: 'text-blue-600 dark:text-blue-400',
        text: 'text-blue-900 dark:text-blue-100'
      };
    case 'loading':
      return {
        bg: 'bg-slate-500/10 dark:bg-slate-400/10',
        border: 'border-slate-500/20 dark:border-slate-400/20',
        icon: 'text-slate-600 dark:text-slate-400',
        text: 'text-slate-900 dark:text-slate-100'
      };
    case 'nostr':
      return {
        bg: 'bg-purple-500/10 dark:bg-purple-400/10',
        border: 'border-purple-500/20 dark:border-purple-400/20',
        icon: 'text-purple-600 dark:text-purple-400',
        text: 'text-purple-900 dark:text-purple-100'
      };
    case 'crypto':
      return {
        bg: 'bg-orange-500/10 dark:bg-orange-400/10',
        border: 'border-orange-500/20 dark:border-orange-400/20',
        icon: 'text-orange-600 dark:text-orange-400',
        text: 'text-orange-900 dark:text-orange-100'
      };
    case 'relay':
      return {
        bg: 'bg-cyan-500/10 dark:bg-cyan-400/10',
        border: 'border-cyan-500/20 dark:border-cyan-400/20',
        icon: 'text-cyan-600 dark:text-cyan-400',
        text: 'text-cyan-900 dark:text-cyan-100'
      };
    case 'auth':
      return {
        bg: 'bg-indigo-500/10 dark:bg-indigo-400/10',
        border: 'border-indigo-500/20 dark:border-indigo-400/20',
        icon: 'text-indigo-600 dark:text-indigo-400',
        text: 'text-indigo-900 dark:text-indigo-100'
      };
    case 'zap':
      return {
        bg: 'bg-yellow-500/10 dark:bg-yellow-400/10',
        border: 'border-yellow-500/20 dark:border-yellow-400/20',
        icon: 'text-yellow-600 dark:text-yellow-400',
        text: 'text-yellow-900 dark:text-yellow-100'
      };
    default:
      return {
        bg: 'bg-slate-500/10 dark:bg-slate-400/10',
        border: 'border-slate-500/20 dark:border-slate-400/20',
        icon: 'text-slate-600 dark:text-slate-400',
        text: 'text-slate-900 dark:text-slate-100'
      };
  }
};

// Custom toast component
const CustomToast = ({ 
  message, 
  description, 
  type, 
  onClose 
}: {
  message: string;
  description?: string;
  type: NostrToastType;
  onClose: () => void;
}) => {
  const Icon = getToastIcon(type);
  const colors = getToastColors(type);
  
  return (
    <div className={`
      flex items-start gap-3 p-4 rounded-lg border backdrop-blur-sm
      ${colors.bg} ${colors.border}
      shadow-lg max-w-md w-full
      transform transition-all duration-300
    `}>
      <div className={`flex-shrink-0 mt-0.5 ${colors.icon}`}>
        <Icon className={`h-4 w-4 ${type === 'loading' ? 'animate-spin' : ''}`} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${colors.text}`}>
          {message}
        </div>
        {description && (
          <div className={`text-xs mt-1 opacity-75 ${colors.text}`}>
            {description}
          </div>
        )}
      </div>
      
      <button
        onClick={onClose}
        className={`flex-shrink-0 text-xs opacity-50 hover:opacity-100 transition-opacity ${colors.text}`}
      >
        ×
      </button>
    </div>
  );
};

// Enhanced toast functions with custom styling
export const customToast = {
  success: (message: string, options?: ToastOptions | string) => {
    const description = typeof options === 'string' ? options : options?.description;
    return toast.custom((t) => (
      <CustomToast
        message={message}
        description={description}
        type="success"
        onClose={() => toast.dismiss(t.id)}
      />
    ), {
      duration: 4000,
    });
  },

  error: (message: string, options?: ToastOptions | string) => {
    const description = typeof options === 'string' ? options : options?.description;
    return toast.custom((t) => (
      <CustomToast
        message={message}
        description={description}
        type="error"
        onClose={() => toast.dismiss(t.id)}
      />
    ), {
      duration: 6000,
    });
  },

  warning: (message: string, options?: ToastOptions | string) => {
    const description = typeof options === 'string' ? options : options?.description;
    return toast.custom((t) => (
      <CustomToast
        message={message}
        description={description}
        type="warning"
        onClose={() => toast.dismiss(t.id)}
      />
    ), {
      duration: 5000,
    });
  },

  info: (message: string, options?: ToastOptions | string) => {
    const description = typeof options === 'string' ? options : options?.description;
    return toast.custom((t) => (
      <CustomToast
        message={message}
        description={description}
        type="info"
        onClose={() => toast.dismiss(t.id)}
      />
    ), {
      duration: 4000,
    });
  },

  loading: (message: string, options?: ToastOptions | string) => {
    const description = typeof options === 'string' ? options : options?.description;
    return toast.custom((t) => (
      <CustomToast
        message={message}
        description={description}
        type="loading"
        onClose={() => toast.dismiss(t.id)}
      />
    ), {
      duration: Infinity,
    });
  },

  // Specialized Nostr/crypto toasts
  nostr: (message: string, options?: ToastOptions | string) => {
    const description = typeof options === 'string' ? options : options?.description;
    return toast.custom((t) => (
      <CustomToast
        message={message}
        description={description}
        type="nostr"
        onClose={() => toast.dismiss(t.id)}
      />
    ), {
      duration: 4000,
    });
  },

  crypto: (message: string, options?: ToastOptions | string) => {
    const description = typeof options === 'string' ? options : options?.description;
    return toast.custom((t) => (
      <CustomToast
        message={message}
        description={description}
        type="crypto"
        onClose={() => toast.dismiss(t.id)}
      />
    ), {
      duration: 4000,
    });
  },

  relay: (message: string, options?: ToastOptions | string) => {
    const description = typeof options === 'string' ? options : options?.description;
    return toast.custom((t) => (
      <CustomToast
        message={message}
        description={description}
        type="relay"
        onClose={() => toast.dismiss(t.id)}
      />
    ), {
      duration: 4000,
    });
  },

  auth: (message: string, options?: ToastOptions | string) => {
    const description = typeof options === 'string' ? options : options?.description;
    return toast.custom((t) => (
      <CustomToast
        message={message}
        description={description}
        type="auth"
        onClose={() => toast.dismiss(t.id)}
      />
    ), {
      duration: 4000,
    });
  },

  zap: (message: string, options?: ToastOptions | string) => {
    const description = typeof options === 'string' ? options : options?.description;
    return toast.custom((t) => (
      <CustomToast
        message={message}
        description={description}
        type="zap"
        onClose={() => toast.dismiss(t.id)}
      />
    ), {
      duration: 4000,
    });
  },

  promise: <T,>(
    promise: Promise<T>,
    {
      loading: loadingMessage,
      success: successMessage,
      error: errorMessage,
    }: {
      loading: string;
      success: string | ((result: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return toast.promise(promise, {
      loading: loadingMessage,
      success: successMessage,
      error: errorMessage,
    });
  },

  dismiss: (toastId?: string) => {
    toast.dismiss(toastId);
  },

  remove: (toastId?: string) => {
    toast.remove(toastId);
  },
};

// Re-export for backward compatibility
export { customToast as toast };

// Export the toaster component
export { Toaster };

// Default export for convenience
export default customToast; 

