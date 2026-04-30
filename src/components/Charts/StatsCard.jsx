export default function StatsCard({ icon, value, label, color, bgColor, trend, variant = 'purple', sparkle }) {
  const variants = {
    purple: 'variant-purple',
    gold: 'variant-gold',
    green: 'variant-green',
    violet: 'variant-violet',
    orange: 'variant-orange',
    teal: 'variant-teal',
  };

  return (
    <div className={`stats-card-wrapper ${variants[variant] || variants.purple}`}>
      <div className="stats-card-inner">
        {/* Icon */}
        <div className="stats-icon-container" style={{ background: bgColor, color: color }}>
          <div className="stats-icon-ring" style={{ borderColor: `${color}40` }} />
          {icon}
        </div>

        {/* Info */}
        <div className="stats-info">
          <div className="stats-value">{value}</div>
          <div className="stats-label">{label}</div>
          {trend && (
            <div className={`stats-trend ${trend > 0 ? 'up' : 'down'}`}>
              {trend > 0 ? '📈' : '📉'} {Math.abs(trend)}% هذا الشهر
            </div>
          )}
        </div>

        {/* Sparkle */}
        {sparkle && <div className="stats-sparkle">{sparkle}</div>}

        {/* Glow Line */}
        <div className="stats-glow-line" />
      </div>
    </div>
  );
}