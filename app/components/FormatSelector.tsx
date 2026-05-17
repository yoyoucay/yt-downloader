'use client';

interface FormatSelectorProps {
  selected: 'mp3' | 'mp4';
  onChange: (format: 'mp3' | 'mp4') => void;
  disabled?: boolean;
}

export function FormatSelector({ selected, onChange, disabled }: FormatSelectorProps) {
  return (
    <div className="s7-field">
      <div className="s7-field-label">
        <span>// FORMAT</span>
        <span className="req">REQUIRED</span>
      </div>
      <div className="s7-seg">
        <button
          type="button"
          onClick={() => onChange('mp4')}
          disabled={disabled}
          className={selected === 'mp4' ? 'active' : ''}
        >
          MP4 <span className="ext">// VIDEO + AUDIO</span>
        </button>
        <button
          type="button"
          onClick={() => onChange('mp3')}
          disabled={disabled}
          className={selected === 'mp3' ? 'active' : ''}
        >
          MP3 <span className="ext">// AUDIO ONLY</span>
        </button>
      </div>
    </div>
  );
}
