'use client';

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
    <div className="s7-search-wrap">
      <div className="s7-search-label">
        <span>// 01 &nbsp; QUERY INPUT</span>
        <span className="right">URL / TITLE / CHANNEL</span>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="s7-search-frame">
          <div className="s7-search-prompt">&gt;_</div>
          <input
            name="searchContent"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="paste URL or search title..."
            className="s7-search-input"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="s7-search-btn"
          >
            {isLoading ? 'SCANNING...' : 'EXECUTE'}
          </button>
        </div>
      </form>
    </div>
  );
}
