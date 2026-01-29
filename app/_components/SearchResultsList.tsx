import { VideoCard } from '../components/VideoCard';
import { VideoResult } from '@/lib/types';

interface SearchResultsListProps {
  results: VideoResult[];
  selectedVideo: VideoResult | null;
  onSelectVideo: (video: VideoResult) => void;
}

export function SearchResultsList({ results, selectedVideo, onSelectVideo }: SearchResultsListProps) {
  if (results.length === 0) return null;

  return (
    <div>
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
        Search Results
      </h2>
      <div className="space-y-3">
        {results.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            onSelect={onSelectVideo}
            isSelected={selectedVideo?.id === video.id}
          />
        ))}
      </div>
    </div>
  );
}