
import { 
  extractMediaUrls, 
  extractMediaItems,
  extractFirstImageUrl,
  isValidMediaUrl,
  isImageUrl,
  isVideoUrl
} from '../media-extraction';

describe('Media URL Extraction', () => {
  test('should extract image URLs from content', () => {
    const content = 'Check out this image: https://example.com/image.jpg and this one https://example.com/photo.png';
    
    const urls = extractMediaUrls(content, []);
    
    expect(urls).toContain('https://example.com/image.jpg');
    expect(urls).toContain('https://example.com/photo.png');
    expect(urls.length).toBe(2);
  });
  
  test('should extract video URLs from content', () => {
    const content = 'Watch this video: https://example.com/video.mp4';
    
    const urls = extractMediaUrls(content, []);
    
    expect(urls).toContain('https://example.com/video.mp4');
    expect(urls.length).toBe(1);
  });
  
  test('should extract URLs from image tags', () => {
    const content = 'Post with tags';
    const tags = [
      ['image', 'https://example.com/tagged-image.jpg'],
      ['img', 'https://example.com/another-image.png']
    ];
    
    const urls = extractMediaUrls(content, tags);
    
    expect(urls).toContain('https://example.com/tagged-image.jpg');
    expect(urls).toContain('https://example.com/another-image.png');
    expect(urls.length).toBe(2);
  });
  
  test('should combine URLs from content and tags without duplicates', () => {
    const content = 'Image in content: https://example.com/image.jpg';
    const tags = [
      ['image', 'https://example.com/image.jpg'], // Duplicate
      ['img', 'https://example.com/unique.png']
    ];
    
    const urls = extractMediaUrls(content, tags);
    
    expect(urls).toContain('https://example.com/image.jpg');
    expect(urls).toContain('https://example.com/unique.png');
    expect(urls.length).toBe(2); // No duplicates
  });
  
  test('should extract structured media items', () => {
    const content = 'Post with image https://example.com/image.jpg and video https://example.com/video.mp4';
    const tags = [
      ['image', 'https://example.com/tagged.png', 'alt text']
    ];
    
    const items = extractMediaItems(content, tags);
    
    expect(items.length).toBe(3);
    
    // Check that items have correct types
    const imageItems = items.filter(item => item.type === 'image');
    const videoItems = items.filter(item => item.type === 'video');
    
    expect(imageItems.length).toBe(2);
    expect(videoItems.length).toBe(1);
    
    // Check alt text
    const taggedImage = items.find(item => item.url === 'https://example.com/tagged.png');
    expect(taggedImage?.alt).toBe('alt text');
  });
  
  test('extractFirstImageUrl should return the first image URL or null', () => {
    const contentWithImage = 'Here is an image: https://example.com/first.jpg and https://example.com/second.jpg';
    const contentWithoutImage = 'No image here';
    
    expect(extractFirstImageUrl(contentWithImage, [])).toBe('https://example.com/first.jpg');
    expect(extractFirstImageUrl(contentWithoutImage, [])).toBe(null);
    expect(extractFirstImageUrl('', [['image', 'https://example.com/tagged.jpg']])).toBe('https://example.com/tagged.jpg');
  });
});

describe('Media URL Validation', () => {
  test('should validate image URLs', () => {
    expect(isImageUrl('https://example.com/image.jpg')).toBe(true);
    expect(isImageUrl('https://example.com/image.jpeg')).toBe(true);
    expect(isImageUrl('https://example.com/image.png')).toBe(true);
    expect(isImageUrl('https://example.com/image.gif')).toBe(true);
    expect(isImageUrl('https://example.com/image.webp')).toBe(true);
    expect(isImageUrl('https://example.com/image.svg')).toBe(true);
    expect(isImageUrl('https://example.com/document.pdf')).toBe(false);
    expect(isImageUrl('not a url')).toBe(false);
  });
  
  test('should validate video URLs', () => {
    expect(isVideoUrl('https://example.com/video.mp4')).toBe(true);
    expect(isVideoUrl('https://example.com/video.webm')).toBe(true);
    expect(isVideoUrl('https://example.com/video.mov')).toBe(true);
    expect(isVideoUrl('https://example.com/video.avi')).toBe(true);
    expect(isVideoUrl('https://example.com/image.jpg')).toBe(false);
    expect(isVideoUrl('not a url')).toBe(false);
  });
  
  test('should validate generic media URLs', () => {
    expect(isValidMediaUrl('https://example.com/image.jpg')).toBe(true);
    expect(isValidMediaUrl('https://example.com/video.mp4')).toBe(true);
    expect(isValidMediaUrl('https://example.com/document.txt')).toBe(false);
    expect(isValidMediaUrl('')).toBe(false);
    expect(isValidMediaUrl('not a url')).toBe(false);
  });
  
  test('should handle special cases', () => {
    // URLs with query parameters
    expect(isImageUrl('https://example.com/image.jpg?size=large')).toBe(true);
    
    // URLs with fragments
    expect(isVideoUrl('https://example.com/video.mp4#t=10')).toBe(true);
    
    // Uppercase extensions
    expect(isImageUrl('https://example.com/image.JPG')).toBe(true);
    expect(isVideoUrl('https://example.com/video.MP4')).toBe(true);
  });
});
