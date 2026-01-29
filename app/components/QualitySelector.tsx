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
    ? ['1080p', '720p']
    : ['320kbps', '128kbps'];

  const qualities = availableQualities && availableQualities.length > 0
    ? availableQualities
    : defaultQualities;

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
        Quality
      </label>
      <div className="relative">
        <select
          value={selected}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-11 px-3.5 pr-9 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 text-sm font-medium appearance-none cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
        >
          {qualities.map((quality) => (
            <option key={quality} value={quality}>
              {quality}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 dark:text-zinc-400 pointer-events-none" />
      </div>
      <p className="text-[11px] text-zinc-500 dark:text-zinc-500">
        {availableQualities && availableQualities.length > 0
          ? `Available qualities for this video`
          : `Default ${format.toUpperCase()} qualities`}
      </p>
    </div>
  );
}
