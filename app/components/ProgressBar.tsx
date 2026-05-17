'use client';

interface ProgressBarProps {
  percent: number;
  downloaded?: string;
  total?: string;
  speed?: string;
  eta?: string;
}

export function ProgressBar({ percent, downloaded, total, speed, eta }: ProgressBarProps) {
  return (
    <div className="s7-progress-block">
      <div className="s7-progress-head">
        <span>// DOWNLOADING</span>
        <span className="pct">{Math.round(percent)}%</span>
      </div>
      <div className="s7-progress-track">
        <div className="s7-progress-fill" style={{ width: `${percent}%` }} />
      </div>
      {(downloaded || speed || eta) && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px',
          marginTop: '12px',
          fontSize: '10px',
          letterSpacing: '0.15em',
          color: 'var(--text-mute)',
        }}>
          <div>RECV<b style={{ display: 'block', color: 'var(--text)', fontSize: '12px', marginTop: '3px' }}>{downloaded ?? '--'}</b></div>
          <div>TOTAL<b style={{ display: 'block', color: 'var(--text)', fontSize: '12px', marginTop: '3px' }}>{total ?? '--'}</b></div>
          <div>ETA<b style={{ display: 'block', color: 'var(--text)', fontSize: '12px', marginTop: '3px' }}>{eta ?? '--'}</b></div>
        </div>
      )}
    </div>
  );
}
