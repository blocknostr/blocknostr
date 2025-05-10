
/**
 * Utility functions for community-related components
 */

/**
 * Generates a random color based on a string identifier
 * @param str String to generate color from
 * @returns CSS class name for background color
 */
export const getRandomColor = (str: string) => {
  const colors = [
    "bg-blue-500", "bg-green-500", "bg-yellow-500", 
    "bg-purple-500", "bg-pink-500", "bg-indigo-500"
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
