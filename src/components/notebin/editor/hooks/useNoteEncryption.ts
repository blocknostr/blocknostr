
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { nostrService } from "@/lib/nostr";
import { encryption } from "@/lib/encryption";
import { useHotkeys } from "../../useHotkeys";

export function useNoteEncryption() {
  const [isEncrypted, setIsEncrypted] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const [hasSetPassword, setHasSetPassword] = useState<boolean>(false);
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
  
  // Generate and store a local encryption key if needed
  useEffect(() => {
    try {
      // First try to get existing key
      const existingKey = localStorage.getItem('notebin_encryption_key');
      if (existingKey) {
        setEncryptionKey(existingKey);
        return;
      }
      
      // Generate new key if needed
      const key = encryption.generateEncryptionKey();
      setEncryptionKey(key);
      
      // Attempt to save to localStorage, but don't fail if it can't be saved
      try {
        localStorage.setItem('notebin_encryption_key', key);
      } catch (storageError) {
        console.warn("Could not save encryption key to localStorage, using in-memory key instead:", storageError);
      }
    } catch (error) {
      console.error("Error managing encryption key:", error);
    }
  }, []);
  
  // Register keyboard shortcut for encryption toggle
  useHotkeys('ctrl+e', (e) => {
    e.preventDefault();
    toggleEncryption();
  }, [isEncrypted]);
  
  const toggleEncryption = () => {
    // If turning encryption on, check if logged in or has password
    if (!isEncrypted) {
      if (!nostrService.publicKey && !hasSetPassword) {
        // Prompt for password if not logged in
        const pwd = prompt("Enter an encryption password for local notes:");
        if (pwd) {
          setPassword(pwd);
          setHasSetPassword(true);
          setIsEncrypted(true);
          toast.success("Encryption enabled with password");
        }
      } else {
        setIsEncrypted(true);
        toast.success("Encryption enabled");
      }
    } else {
      setIsEncrypted(false);
      toast.success("Encryption disabled");
    }
  };
  
  const getEncryptionDetails = () => {
    return {
      isEncrypted,
      encryptionMethod: nostrService.publicKey ? "nip04" : hasSetPassword ? "password" : null,
      encryptionKey,
      password: hasSetPassword ? password : null
    };
  };
  
  return {
    isEncrypted,
    toggleEncryption,
    getEncryptionDetails
  };
}
