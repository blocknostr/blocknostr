
import { useState, useEffect } from 'react';

export const useNoteReachCount = (createdAt: number) => {
  const [reachCount, setReachCount] = useState(0);
  
  useEffect(() => {
    // Get a more realistic reach count - still random but based on the age of the post
    // and some randomization for demonstration purposes
    const postAge = Math.floor(Date.now() / 1000) - createdAt;
    const hoursOld = Math.max(1, postAge / 3600);
    const baseReach = Math.floor(50 + (Math.random() * 20 * hoursOld));
    setReachCount(baseReach);
  }, [createdAt]);
  
  return { reachCount };
};
