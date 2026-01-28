'use client';

import { VideoResult } from '@/lib/types';
import { Clock, User } from 'lucide-react';
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
      className={`cursor-pointer rounded-xl overflow-hidden transition-all duration-200 ${
        isSelected
          ? 'ring-4 ring-red-500 shadow-xl scale-105'
          : 'hover:shadow-lg hover:scale-102 bg-white dark:bg-gray-800'
      }`}
    >
      <div className="relative aspect-video">
        <Image
          src={video.thumbnail}
          alt={video.title}
          fill
          className="object-cover"
          unoptimized
        />
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {video.duration}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2">
          {video.title}
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <User className="w-4 h-4" />
          <span className="truncate">{video.channel}</span>
        </div>
      </div>
    </div>
  );
}
