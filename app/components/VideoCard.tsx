'use client';

import { VideoResult } from '@/lib/types';
import { Clock, User, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

interface VideoCardProps {
  video: VideoResult;
  onSelect: (video: VideoResult) => void;
  isSelected?: boolean;
}

export function VideoCard({ video, onSelect, isSelected }: VideoCardProps) {
  return (
    <div
      onClick={() => onSelect(video)}
      className={`cursor-pointer rounded-xl overflow-hidden transition-all duration-200 border ${
        isSelected
          ? 'ring-2 ring-indigo-500 shadow-xl shadow-indigo-500/20 scale-[1.02] border-indigo-200 dark:border-indigo-900 bg-white dark:bg-zinc-900'
          : 'hover:shadow-lg hover:scale-[1.01] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm'
      }`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-zinc-100 dark:bg-zinc-800">
        <Image
          src={video.thumbnail}
          alt={video.title}
          fill
          className="object-cover"
          unoptimized
        />
        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2 bg-black/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md flex items-center gap-1 font-medium">
          <Clock className="w-3 h-3" />
          {video.duration}
        </div>
        {/* Selected Indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2 bg-indigo-600 text-white rounded-full p-1 shadow-lg">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4">
        <h3 className="font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2 mb-2 text-sm leading-snug">
          {video.title}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
          <User className="w-3.5 h-3.5" />
          <span className="truncate">{video.channel}</span>
        </div>
      </div>
    </div>
  );
}
