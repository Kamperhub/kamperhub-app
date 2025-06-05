
import type { EducationalVideo } from '@/types/learn';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { YouTubeEmbed } from './YouTubeEmbed';
import { Badge } from '@/components/ui/badge';

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
        <YouTubeEmbed videoId={video.videoId} title={video.title} />
        <CardDescription className="font-body text-base">{video.description}</CardDescription>
      </CardContent>
    </Card>
  );
}
