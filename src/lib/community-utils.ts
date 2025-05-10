
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

/**
 * Parse a formatted serial number to extract the numeric component
 * This helps with searching by partial serial number
 * @param formattedSerial The formatted serial string (e.g. #ABC123)
 * @returns The numeric value or null if invalid format
 */
export const parseSerialNumber = (formattedSerial: string): number | null => {
  // Remove the # if present
  const cleanedSerial = formattedSerial.startsWith('#') ? 
    formattedSerial.substring(1) : formattedSerial;
  
  // Extract letters and numbers
  const lettersPart = cleanedSerial.substring(0, 3);
  const numbersPart = cleanedSerial.substring(3);
  
  if (!lettersPart.match(/^[A-Za-z]{1,3}$/) || !numbersPart.match(/^\d{1,3}$/)) {
    return null;
  }
  
  // Convert letters to number
  let letterValue = 0;
  for (let i = 0; i < lettersPart.length; i++) {
    const charCode = lettersPart.charCodeAt(i);
    const value = (charCode >= 97) ? charCode - 97 : charCode - 65;
    letterValue += value * Math.pow(26, i);
  }
  
  // Calculate final number
  const numericValue = parseInt(numbersPart) * Math.pow(26, 3) + letterValue;
  return numericValue;
};

