
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ImageUrlFormProps {
  onUrlSubmit: (url: string) => void;
}

const ImageUrlForm = ({ onUrlSubmit }: ImageUrlFormProps) => {
  const [imageUrl, setImageUrl] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (imageUrl) {
      onUrlSubmit(imageUrl);
      setImageUrl('');
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center space-x-2">
        <Input
          type="text"
          placeholder="https://example.com/image.jpg"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />
        <Button type="submit">Add</Button>
      </div>
      
      <div className="mt-4 text-sm text-muted-foreground">
        Enter the URL of an image from the web
      </div>
    </form>
  );
};

export default ImageUrlForm;
