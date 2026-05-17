export function PageHeader() {
  return (
    <header className="s7-topbar">
      <div className="s7-brand">
        <div className="s7-logo"><span>S</span></div>
        <div>
          <div className="s7-brand-name">SECTOR<em>·</em>7</div>
          <div className="s7-brand-tag">VIDEO &amp; AUDIO VAULT // v3.2.1</div>
        </div>
      </div>
      <div className="s7-topbar-meta">
        <span><span className="s7-dot" />SIGNAL OK</span>
        <span>WORKER · 03 / 04</span>
        <span>QUEUE · 02</span>
        <span>
          <span className="s7-kbd">⌘</span>{' '}
          <span className="s7-kbd">K</span>{' '}
          SEARCH
        </span>
      </div>
    </header>
  );
}
