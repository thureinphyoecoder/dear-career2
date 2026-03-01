type AdCardProps = {
  title: string;
  eyebrow?: string;
  description: string;
  ctaLabel: string;
  href: string;
  compact?: boolean;
};

export function AdCard({
  title,
  eyebrow = "Sponsored",
  description,
  ctaLabel,
  href,
  compact = false,
}: AdCardProps) {
  return (
    <article className={["job-card", "ad-card", compact ? "ad-card-compact" : ""].join(" ")}>
      <div className="job-card-topline">
        <div className="job-source-badge">{eyebrow}</div>
        <div className="pill">featured</div>
      </div>
      <div className="stack">
        <h3 className="job-card-title">{title}</h3>
        <p className="job-card-summary">{description}</p>
      </div>
      <div className="job-card-meta">
        <span className="job-card-chip">Priority placement</span>
        <span className="job-card-chip">Brand spotlight</span>
      </div>
      <a href={href} className="job-card-button">
        {ctaLabel}
      </a>
    </article>
  );
}
