'use client';

import { VideoResult } from '@/lib/types';
import Image from 'next/image';

interface VideoCardProps {
  video: VideoResult;
  onSelect: (video: VideoResult) => void;
  isSelected?: boolean;
  index: number;
}

export function VideoCard({ video, onSelect, isSelected, index }: VideoCardProps) {
  const qualities = video.availableFormats?.video ?? [];
  const topQuality = qualities[0];

  return (
    <article
      onClick={() => onSelect(video)}
      className={`s7-card${isSelected ? ' selected' : ''}`}
    >
      <div className="s7-thumb">
        <Image
          src={video.thumbnail}
          alt={video.title}
          fill
          className="object-cover"
          unoptimized
        />
        <span className="s7-duration">{video.duration}</span>
      </div>

      <div className="s7-card-body">
        <div className="s7-card-title">{video.title}</div>
        <div className="s7-card-meta">
          <span><span className="k">CH</span>{video.channel}</span>
        </div>
        <div className="s7-card-tags">
          {topQuality && <span className="s7-tag cyan">{topQuality}</span>}
          {isSelected && <span className="s7-tag pink">SELECTED</span>}
          {qualities.some(q => q.includes('320')) && (
            <span className="s7-tag gold">320KBPS</span>
          )}
        </div>
      </div>

      <div className="s7-card-id">
        REF<span className="num">{String(index + 1).padStart(2, '0')}</span>
      </div>
    </article>
  );
}
