
import type { EducationalVideo } from '@/types/learn';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Film } from 'lucide-react'; // Added Film icon

interface VideoCardProps {
  video: EducationalVideo;
}

export function VideoCard({ video }: VideoCardProps) {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="font-headline text-xl">{video.title}</CardTitle>
        <Badge variant="default" className="w-fit font-body">{video.category}</Badge>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col space-y-4">
        <div 
          className="flex flex-col items-center justify-center h-48 bg-muted/30 rounded-lg p-4 text-center border border-dashed border-muted-foreground/30"
          data-ai-hint={video.dataAiHint || video.category.toLowerCase().replace(/\s+/g, '_')} // Preserve data-ai-hint
        >
          <Film className="w-12 h-12 text-muted-foreground mb-2" />
          <p className="text-lg font-semibold text-muted-foreground font-body">Video Coming Soon!</p>
          <p className="text-xs text-muted-foreground/70 font-body mt-1">Check back later for new content.</p>
        </div>
        <CardDescription className="font-body text-base">{video.description}</CardDescription>
      </CardContent>
    </Card>
  );
}
