'use client';

import { Download } from 'lucide-react';

interface ProgressBarProps {
  percent: number;
  downloaded?: string;
  total?: string;
  speed?: string;
  eta?: string;
}

export function ProgressBar({ percent, downloaded, total, speed, eta }: ProgressBarProps) {
  return (
    <div className="space-y-3 p-5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-bounce" />
          </div>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">Downloading</span>
        </div>
        <span className="font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums">
          {percent.toFixed(1)}%
        </span>
      </div>
      
      {/* Progress Track */}
      <div className="relative w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="absolute h-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 transition-all duration-300 ease-out rounded-full"
          style={{ width: `${percent}%` }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
        </div>
      </div>

      {/* Metadata */}
      {(downloaded || speed || eta) && (
        <div className="flex justify-between text-[11px] text-zinc-600 dark:text-zinc-400 font-medium tabular-nums">
          {downloaded && total && (
            <span>{downloaded} / {total}</span>
          )}
          <div className="flex gap-3">
            {speed && <span>{speed}</span>}
            {eta && <span>ETA {eta}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
