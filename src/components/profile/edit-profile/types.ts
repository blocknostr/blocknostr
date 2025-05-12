
import { z } from "zod";

// Profile form validation schema
export const profileFormSchema = z.object({
  name: z.string().optional(),
  display_name: z.string().optional(),
  about: z.string().optional(),
  picture: z.string().optional(),
  banner: z.string().optional(),
  website: z.string().optional(),
  nip05: z.string().optional(),
  twitter: z.string().optional(),
});

// TypeScript type for the form values
export type ProfileFormValues = z.infer<typeof profileFormSchema>;
