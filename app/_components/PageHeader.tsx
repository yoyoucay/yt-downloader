import { Sparkles } from 'lucide-react';

export function PageHeader() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative">
        <svg 
          role="img" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-8 h-8 fill-red-600 dark:fill-red-500"
        >
          <title>YouTube</title>
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
        <Sparkles className="w-4 h-4 text-indigo-400 dark:text-indigo-500 absolute -top-1 -right-1" />
      </div>
      <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-br from-zinc-900 via-zinc-700 to-zinc-900 dark:from-zinc-100 dark:via-zinc-300 dark:to-zinc-100 bg-clip-text text-transparent tracking-tight">
        YT Downloader
      </h1>
    </div>
  );
}