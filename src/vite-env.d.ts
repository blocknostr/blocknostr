
/// <reference types="vite/client" />

// Add any custom type definitions here if needed

// Extend NostrService interface to support profile operations
declare interface NostrService {
  updateProfile(profileData: Record<string, string>): Promise<boolean>;
}

