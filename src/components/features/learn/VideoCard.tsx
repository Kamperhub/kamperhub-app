import type { EducationalVideo } from '@/types/learn';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { YouTubeEmbed } from './YouTubeEmbed';

interface VideoCardProps {
  video: EducationalVideo;
}

export function VideoCard({ video }: VideoCardProps) {
  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="font-headline text-xl">{video.title}</CardTitle>
        <Badge variant="secondary" className="w-fit font-body">{video.category}</Badge>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col space-y-4">
        <YouTubeEmbed videoId={video.videoId} title={video.title} />
        <CardDescription className="font-body text-base text-muted-foreground pt-2">
          {video.description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}
