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
      <div className="s7-section-head">
        <h2>// 02 &nbsp; INDEX RESULTS</h2>
        <span className="s7-badge">{String(results.length).padStart(2, '0')} HITS</span>
        <div className="s7-rule" />
        <span className="s7-sort-label">SORT · RELEVANCE</span>
      </div>
      <div className="s7-results" style={{ paddingLeft: '28px' }}>
        {results.map((video, i) => (
          <VideoCard
            key={video.id}
            video={video}
            onSelect={onSelectVideo}
            isSelected={selectedVideo?.id === video.id}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
