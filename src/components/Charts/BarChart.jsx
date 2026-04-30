export default function BarChart({ data }) {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="bar-chart-container">
      {/* {data.map((bar, i) => (
        <div key={i} className="bar-item">
          <span className="bar-value-display">{bar.value}</span>
          <div
            className="bar-graphic"
            style={{
              height: `${(bar.value / maxValue) * 100}%`,
              background: `linear-gradient(180deg, ${bar.color}, ${bar.color}88)`,
              color: bar.color
            }}
          />
          <span className="bar-label-text">{bar.label}</span>
        </div>
      ))} */}
    </div>
  );
}