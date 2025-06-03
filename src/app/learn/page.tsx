import { VideoCard } from '@/components/features/learn/VideoCard';
import { sampleVideos } from '@/types/learn';

export default function LearnPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline mb-6 text-primary">Educational Resources</h1>
        <p className="text-muted-foreground font-body mb-6">
          Browse our curated list of YouTube videos to learn more about caravanning, from towing basics to maintenance tips.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sampleVideos.map(video => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
}
