
/**
 * Format number with thousand separators and optional decimal places
 */
export const formatNumber = (num: number, decimalPlaces: number = 2): string => {
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimalPlaces
  });
};

/**
 * Format currency with symbol
 */
export const formatCurrency = (
  value: number, 
  currency = 'USD', 
  minimumFractionDigits = 2,
  maximumFractionDigits = 2
): string => {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits
  }).format(value);
};

/**
 * Format a number to a compact representation (1.2k, 1.2M, etc)
 */
export const formatCompactNumber = (value: number): string => {
  return new Intl.NumberFormat(undefined, {
    notation: 'compact',
    compactDisplay: 'short'
  }).format(value);
};

/**
 * Format a date to a readable string
 */
export const formatDate = (
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }
): string => {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  return new Intl.DateTimeFormat(undefined, options).format(date);
};

/**
 * Format a relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: Date | string | number): string => {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
};

/**
 * Truncate address to shorter format
 */
export const truncateAddress = (address: string, prefixLength = 6, suffixLength = 4): string => {
  if (!address || address.length <= prefixLength + suffixLength) {
    return address;
  }
  
  return `${address.substring(0, prefixLength)}...${address.substring(address.length - suffixLength)}`;
};

/**
 * Format NFT token ID for display
 */
export const formatNftId = (id: string): string => {
  if (!id || id.length <= 12) {
    return id;
  }
  
  return `${id.substring(0, 6)}...${id.substring(id.length - 6)}`;
};

/**
 * Format NFT attributes for display
 */
export const formatNftAttributes = (attributes: any[] | undefined): string => {
  if (!attributes || attributes.length === 0) {
    return "No attributes";
  }
  
  return `${attributes.length} attribute${attributes.length > 1 ? 's' : ''}`;
};
