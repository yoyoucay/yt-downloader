'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-10 h-10" />;
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="relative p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm hover:shadow-md active:scale-95 group"
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5">
        {theme === 'dark' ? (
          <Sun className="w-5 h-5 text-amber-500 transition-transform group-hover:rotate-45" />
        ) : (
          <Moon className="w-5 h-5 text-zinc-700 transition-transform group-hover:-rotate-12" />
        )}
      </div>
    </button>
  );
}
