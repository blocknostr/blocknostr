
/**
 * Utility functions for community-related components
 */

/**
 * Generates a random matte color based on a string identifier
 * @param str String to generate color from
 * @returns CSS class name for background color
 */
export const getRandomColor = (str: string) => {
  // Matte colors palette
  const colors = [
    "bg-[#F2FCE2]", // Soft Green
    "bg-[#FEF7CD]", // Soft Yellow
    "bg-[#FEC6A1]", // Soft Orange
    "bg-[#E5DEFF]", // Soft Purple
    "bg-[#FFDEE2]", // Soft Pink
    "bg-[#FDE1D3]", // Soft Peach
    "bg-[#D3E4FD]", // Soft Blue
    "bg-[#F1F0FB]"  // Soft Gray
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
