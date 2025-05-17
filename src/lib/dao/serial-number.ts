
/**
 * Formats a DAO serial number according to the format #AAA000
 * @param serialNumber The serial number to format
 * @returns Formatted serial number string
 */
export const formatDAOSerialNumber = (serialNumber: number): string => {
  // Calculate letters part (AAA)
  const base = 26; // A-Z
  let letterPart = '';
  let tempNum = Math.floor((serialNumber - 1) / 1000);
  
  // Generate three letters
  for (let i = 0; i < 3; i++) {
    const remainder = tempNum % base;
    letterPart = String.fromCharCode(65 + remainder) + letterPart;
    tempNum = Math.floor(tempNum / base);
  }
  
  // Calculate numeric part (000)
  const numericPart = String(serialNumber % 1000).padStart(3, '0');
  
  return `#${letterPart}${numericPart}`;
};

/**
 * Parse a formatted serial number back to its numeric value
 * @param formattedSerial The formatted serial number (e.g. #AAA000)
 * @returns The numeric serial number or null if invalid format
 */
export const parseDAOSerialNumber = (formattedSerial: string): number | null => {
  // Check if it matches the pattern #AAA000
  const match = formattedSerial.match(/^#([A-Z]{3})(\d{3})$/);
  if (!match) return null;
  
  const [_, letterPart, numericPart] = match;
  
  // Convert letters to number (AAA)
  let letterValue = 0;
  for (let i = 0; i < 3; i++) {
    const charCode = letterPart.charCodeAt(i) - 65; // A = 0, B = 1, etc.
    letterValue = letterValue * 26 + charCode;
  }
  
  // Calculate final number
  const numericValue = parseInt(numericPart);
  return letterValue * 1000 + numericValue;
};
