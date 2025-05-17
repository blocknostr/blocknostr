
/**
 * Generate a letter component for the serial number based on a numeric index
 * Will generate AAA through ZZZ
 */
export function generateLetterCode(index: number): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const firstLetter = letters[Math.floor(index / (26 * 26)) % 26];
  const secondLetter = letters[Math.floor(index / 26) % 26];
  const thirdLetter = letters[index % 26];
  
  return `${firstLetter}${secondLetter}${thirdLetter}`;
}

/**
 * Format a serial number to the standard #AAA000 format
 */
export function formatSerialNumber(num: number): string {
  if (!num) return '#AAA000';
  
  // Generate the letter part based on the number div 1000
  const letterIndex = Math.floor(num / 1000);
  const letterCode = generateLetterCode(letterIndex);
  
  // Generate the numeric part (last three digits)
  const numericPart = (num % 1000).toString().padStart(3, '0');
  
  return `#${letterCode}${numericPart}`;
}

/**
 * Parse a serial number from the standard #AAA000 format
 * Returns null if invalid format
 */
export function parseSerialNumber(serialStr: string): number | null {
  if (!serialStr) return null;
  
  // Remove # if present and convert to uppercase
  const cleanStr = serialStr.startsWith('#') ? 
    serialStr.substring(1).toUpperCase() : 
    serialStr.toUpperCase();
  
  // Check format (3 letters followed by 3 digits)
  const match = cleanStr.match(/^([A-Z]{3})(\d{3})$/);
  if (!match) return null;
  
  const [, letterPart, numericPart] = match;
  
  // Convert letter part to index
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const firstLetterIndex = letters.indexOf(letterPart[0]);
  const secondLetterIndex = letters.indexOf(letterPart[1]);
  const thirdLetterIndex = letters.indexOf(letterPart[2]);
  
  if (firstLetterIndex < 0 || secondLetterIndex < 0 || thirdLetterIndex < 0) {
    return null;
  }
  
  const letterIndex = 
    firstLetterIndex * 26 * 26 + 
    secondLetterIndex * 26 + 
    thirdLetterIndex;
  
  const numeric = parseInt(numericPart, 10);
  
  return letterIndex * 1000 + numeric;
}

/**
 * Generate a unique tag for DAO chat based on DAO ID
 */
export function generateDAOChatTag(daoId: string): string {
  return `dao-chat-${daoId.substring(0, 10)}`;
}

/**
 * Check if user can leave DAO
 */
export function canUserLeaveDAO(userPubkey: string | null, daoCreator: string, daoMembers: string[]): boolean {
  // User can leave if they're a member but not the creator
  return !!userPubkey && daoMembers.includes(userPubkey) && userPubkey !== daoCreator;
}

/**
 * Check if user can delete DAO
 */
export function canUserDeleteDAO(userPubkey: string | null, daoCreator: string, daoMembers: string[]): boolean {
  // Creator can delete only if they are the only member
  return !!userPubkey && 
    userPubkey === daoCreator && 
    daoMembers.length === 1 && 
    daoMembers[0] === daoCreator;
}
