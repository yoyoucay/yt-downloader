'use client';

import { Music, Video } from 'lucide-react';

interface FormatSelectorProps {
  selected: 'mp3' | 'mp4';
  onChange: (format: 'mp3' | 'mp4') => void;
}

export function FormatSelector({ selected, onChange }: FormatSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
        Format
      </label>
      <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 dark:bg-zinc-900/50 rounded-lg">
        <button
          type="button"
          onClick={() => onChange('mp4')}
          className={`relative py-2.5 px-3 rounded-md font-medium text-sm transition-all ${
            selected === 'mp4'
              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-700'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Video className="w-4 h-4" />
            <span>MP4</span>
          </div>
        </button>
        <button
          type="button"
          onClick={() => onChange('mp3')}
          className={`relative py-2.5 px-3 rounded-md font-medium text-sm transition-all ${
            selected === 'mp3'
              ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-700'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Music className="w-4 h-4" />
            <span>MP3</span>
          </div>
        </button>
      </div>
    </div>
  );
}
