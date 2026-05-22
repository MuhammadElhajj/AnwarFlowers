import { useLanguage } from '../../contexts/LanguageContext';

export default function BarChart({ data }) {
  const { t } = useLanguage();
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="bar-chart-container">
      {data.map((item, index) => (
        <div key={index} className="bar-item">
          <div className="bar-value-display">{item.value}</div>
          <div
            className="bar-graphic"
            style={{
              height: `${(item.value / maxValue) * 100}%`,
              backgroundColor: item.color || '#667eea',
              width: '100%',
              maxWidth: '80px',
            }}
          />
          <div className="bar-label-text">{item.label}</div>
        </div>
      ))}
    </div>
  );
}