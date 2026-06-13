/** EcoScoreRing — SVG circular progress indicator */
import { getEcoScoreColor } from '@/utils/formatting';
import type { SustainabilityLevel } from '@/types';

interface Props {
  score: number;
  level: SustainabilityLevel;
  size?: number;
  strokeWidth?: number;
}

export default function EcoScoreRing({
  score,
  level,
  size = 180,
  strokeWidth = 12,
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = ((score) / 100) * circumference;
  const color = getEcoScoreColor(score);

  return (
    <div
      className="eco-score-ring"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Eco score: ${score} out of 100. Level: ${level}`}
    >
      <svg width={size} height={size} aria-hidden="true">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--bg-elevated)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 8px ${color}60)` }}
        />
      </svg>
      <div className="eco-score-center" aria-hidden="true">
        <div style={{
          fontSize: size > 140 ? '2.5rem' : '1.75rem',
          fontWeight: 900,
          letterSpacing: '-0.04em',
          color,
          lineHeight: 1,
        }}>
          {score}
        </div>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: '4px' }}>
          ECO SCORE
        </div>
        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '2px' }}>
          {level}
        </div>
      </div>
    </div>
  );
}
