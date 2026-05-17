export function LoadingState() {
  return (
    <div className="s7-loading">
      <span style={{ color: 'var(--pink)', animation: 'blink 0.8s steps(1) infinite' }}>◈</span>
      <span>SCANNING INDEX...</span>
    </div>
  );
}
