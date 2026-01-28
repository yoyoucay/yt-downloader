'use client';

interface FormatSelectorProps {
  selected: 'mp3' | 'mp4';
  onChange: (format: 'mp3' | 'mp4') => void;
}

export function FormatSelector({ selected, onChange }: FormatSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Format
      </label>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onChange('mp4')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
            selected === 'mp4'
              ? 'bg-red-600 text-white shadow-lg'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          MP4 (Video)
        </button>
        <button
          type="button"
          onClick={() => onChange('mp3')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
            selected === 'mp3'
              ? 'bg-red-600 text-white shadow-lg'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          MP3 (Audio)
        </button>
      </div>
    </div>
  );
}
