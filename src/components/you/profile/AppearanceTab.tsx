
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ProfileFormValues } from './useProfileForm';

interface AppearanceTabProps {
  form: UseFormReturn<ProfileFormValues>;
}

const AppearanceTab: React.FC<AppearanceTabProps> = ({ form }) => {
  return (
    <>
      <FormField
        control={form.control}
        name="picture"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Profile Picture URL</FormLabel>
            <FormControl>
              <Input placeholder="https://example.com/your-image.jpg" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="banner"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Banner Image URL</FormLabel>
            <FormControl>
              <Input placeholder="https://example.com/your-banner.jpg" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};

export default AppearanceTab;
