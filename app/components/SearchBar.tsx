'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl opacity-0 group-focus-within:opacity-100 blur transition-opacity duration-300" />
        <div className="relative">
          <input
            name="searchContent"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search YouTube or paste URL..."
            className="w-full h-14 px-5 pr-14 text-base rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-11 w-11 flex items-center justify-center bg-gradient-to-b from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:from-zinc-300 disabled:to-zinc-400 dark:disabled:from-zinc-700 dark:disabled:to-zinc-800 text-white rounded-lg transition-all disabled:cursor-not-allowed shadow-md shadow-indigo-600/25 disabled:shadow-none active:scale-95"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>
    </form>
  );
}
