'use client';

import { ChevronDown } from 'lucide-react';

interface QualitySelectorProps {
  format: 'mp3' | 'mp4';
  selected: string;
  onChange: (quality: string) => void;
  availableQualities?: string[];
}

export function QualitySelector({ format, selected, onChange, availableQualities }: QualitySelectorProps) {
  const defaultQualities = format === 'mp4' 
    ? ['144p', '240p', '360p', '480p', '720p', '1080p', '1440p', '2160p']
    : ['128kbps', '192kbps', '256kbps', '320kbps'];

  const qualities = availableQualities && availableQualities.length > 0 
    ? availableQualities 
    : defaultQualities;

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Quality
      </label>
      <div className="relative">
        <select
          value={selected}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 pr-10 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white font-medium appearance-none cursor-pointer hover:border-red-400 dark:hover:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all shadow-sm"
        >
          {qualities.map((quality) => (
            <option key={quality} value={quality}>
              {quality}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400 pointer-events-none" />
      </div>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        {availableQualities && availableQualities.length > 0 
          ? `Available for this video`
          : `Standard qualities`}
      </p>
    </div>
  );
}
