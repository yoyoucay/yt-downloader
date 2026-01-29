import { Loader2 } from 'lucide-react';

export function LoadingState() {
  return (
    <div className="flex flex-col justify-center items-center py-8">
      <div className="relative">
        <Loader2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-spin" />
        <div className="absolute inset-0 w-10 h-10 border-2 border-indigo-200 dark:border-indigo-900 rounded-full" />
      </div>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400 font-medium text-sm">Searching YouTube...</p>
    </div>
  );
}