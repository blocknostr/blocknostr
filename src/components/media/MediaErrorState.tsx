
import { Video, Image } from 'lucide-react';

interface MediaErrorStateProps {
  isVideo: boolean;
}

const MediaErrorState = ({ isVideo }: MediaErrorStateProps) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center flex-col gap-2 text-muted-foreground">
      {isVideo ? <Video className="w-8 h-8" /> : <Image className="w-8 h-8" />}
      <span className="text-sm">Unable to load media</span>
    </div>
  );
};

export default MediaErrorState;
