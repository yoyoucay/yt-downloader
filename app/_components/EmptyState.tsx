import { Youtube } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="text-center py-12 sm:text-left">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-900 dark:to-zinc-800 mb-4 border border-zinc-200 dark:border-zinc-700">
        <Youtube className="w-8 h-8 text-zinc-400 dark:text-zinc-600" />
      </div>
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
        Ready to download
      </h3>
      <p className="text-zinc-600 dark:text-zinc-400 text-sm max-w-sm leading-relaxed">
        Search for a video or paste a YouTube URL to get started
      </p>
    </div>
  );
}