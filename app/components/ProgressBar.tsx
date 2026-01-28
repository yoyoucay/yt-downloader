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
    <div className="space-y-3 p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4 text-red-600 animate-bounce" />
          <span className="font-medium text-gray-900 dark:text-white">Downloading...</span>
        </div>
        <span className="font-bold text-red-600">{percent.toFixed(1)}%</span>
      </div>
      
      <div className="relative w-full h-3 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="absolute h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-300 ease-out"
          style={{ width: `${percent}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse" />
        </div>
      </div>

      {(downloaded || speed || eta) && (
        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
          {downloaded && total && (
            <span>{downloaded} / {total}</span>
          )}
          {speed && <span>{speed}</span>}
          {eta && <span>ETA: {eta}</span>}
        </div>
      )}
    </div>
  );
}
