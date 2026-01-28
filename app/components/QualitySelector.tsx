'use client';

interface QualitySelectorProps {
  format: 'mp3' | 'mp4';
  selected: string;
  onChange: (quality: string) => void;
}

const MP4_QUALITIES = ['1080p', '720p', '480p', '360p'];
const MP3_QUALITIES = ['320kbps', '192kbps', '128kbps'];

export function QualitySelector({ format, selected, onChange }: QualitySelectorProps) {
  const qualities = format === 'mp4' ? MP4_QUALITIES : MP3_QUALITIES;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Quality
      </label>
      <select
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
      >
        {qualities.map((quality) => (
          <option key={quality} value={quality}>
            {quality}
          </option>
        ))}
      </select>
    </div>
  );
}
