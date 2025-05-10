
/**
 * Utility functions for community-related components
 */

/**
 * Generates a matte color based on a string identifier
 * @param str String to generate color from
 * @returns CSS class name for background color
 */
export const getRandomColor = (str: string) => {
  const colors = [
    "bg-blue-400/80", "bg-green-400/80", "bg-yellow-400/80", 
    "bg-purple-400/80", "bg-pink-400/80", "bg-indigo-400/80",
    "bg-teal-400/80", "bg-orange-400/80", "bg-cyan-400/80"
  ];
  const hash = str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

/**
 * Get initials from a name
 * @param name Full name
 * @returns Up to 2 uppercase characters representing initials
 */
export const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

/**
 * Format a serial number in the #AAA000 format (3 letters and 3 numbers)
 * @param num The serial number to format
 * @returns Formatted serial number string
 */
export const formatSerialNumber = (num: number): string => {
  // Generate letters part (A-Z)
  let letters = '';
  let tempNum = num;
  
  // Use modulo to get three letters (A-Z)
  for (let i = 0; i < 3; i++) {
    const remainder = tempNum % 26;
    letters += String.fromCharCode(65 + remainder); // 65 is ASCII for 'A'
    tempNum = Math.floor(tempNum / 26);
  }
  
  // Use remaining number for the numeric part (000-999)
  const numbers = String(tempNum % 1000).padStart(3, '0');
  
  return `#${letters}${numbers}`;
};

