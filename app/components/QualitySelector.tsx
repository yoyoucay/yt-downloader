'use client';

interface QualitySelectorProps {
  format: 'mp3' | 'mp4';
  selected: string;
  onChange: (quality: string) => void;
  availableQualities?: string[];
  disabled?: boolean;
}

export function QualitySelector({ format, selected, onChange, availableQualities, disabled }: QualitySelectorProps) {
  const defaultQualities = format === 'mp4'
    ? ['1080p', '720p', '480p', '360p']
    : ['320kbps', '256kbps', '192kbps', '128kbps'];

  const qualities = availableQualities && availableQualities.length > 0
    ? availableQualities
    : defaultQualities;

  return (
    <div className="s7-field">
      <div className="s7-field-label">
        <span>// QUALITY</span>
        <span className="count">{String(qualities.length).padStart(2, '0')} OPTIONS</span>
      </div>
      <div className="s7-qgrid">
        {qualities.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onChange(q)}
            disabled={disabled}
            className={selected === q ? 'active' : ''}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
