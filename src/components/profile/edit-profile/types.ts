
import { z } from 'zod';

// Define form schema with validation
export const profileFormSchema = z.object({
  name: z.string().optional(),
  display_name: z.string().optional(),
  about: z.string().optional(),
  picture: z.string().url().optional().or(z.string().length(0)),
  banner: z.string().url().optional().or(z.string().length(0)),
  website: z.string().url().optional().or(z.string().length(0)),
  nip05: z.string().optional(),
  twitter: z.string().optional(),
  tweetUrl: z.string().optional()
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
