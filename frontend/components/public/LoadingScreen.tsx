export function LoadingScreen() {
  return (
    <div className="site-loader" aria-live="polite" aria-label="Loading website">
      <div className="site-loader-backdrop" />
      <div className="site-loader-content">
        <div className="site-loader-mark">
          <img src="/logoflat.svg" alt="" aria-hidden="true" className="site-loader-logo" />
        </div>
        <div className="site-loader-copy">
          <span className="site-loader-title">dear career</span>
          <span className="site-loader-subtitle">loading opportunities</span>
        </div>
      </div>
    </div>
  );
}
