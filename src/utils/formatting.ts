/** Formatting utilities for CarbFoot AI */

/** Format kg CO₂e with appropriate unit (kg or tonnes) */
export function formatCO2(kgCO2e: number): string {
  if (kgCO2e >= 1000) {
    return `${(kgCO2e / 1000).toFixed(2)}t CO₂e`;
  }
  return `${Math.round(kgCO2e)} kg CO₂e`;
}

/** Format kg CO₂e for short display */
export function formatCO2Short(kgCO2e: number): string {
  if (kgCO2e >= 1000) return `${(kgCO2e / 1000).toFixed(1)}t`;
  return `${Math.round(kgCO2e)} kg`;
}

/** Format a month string "YYYY-MM" to human label "Jan 24" */
export function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

/** Format percentage */
export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

/** Generate a unique ID */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Category display names */
export const CATEGORY_LABELS: Record<string, string> = {
  transportation: 'Transportation',
  energy: 'Energy',
  food: 'Food & Diet',
  shopping: 'Shopping',
  waste: 'Waste',
};

/** Category emoji icons */
export const CATEGORY_ICONS: Record<string, string> = {
  transportation: '🚗',
  energy: '⚡',
  food: '🍽️',
  shopping: '🛍️',
  waste: '♻️',
};

/** Category colors (CSS variables) */
export const CATEGORY_COLORS: Record<string, string> = {
  transportation: '#22d3ee',
  energy:         '#a78bfa',
  food:           '#4ade80',
  shopping:       '#fb923c',
  waste:          '#f472b6',
};

/** Eco-score color based on value */
export function getEcoScoreColor(score: number): string {
  if (score >= 75) return '#4ade80';
  if (score >= 55) return '#86efac';
  if (score >= 40) return '#fbbf24';
  if (score >= 25) return '#fb923c';
  return '#f87171';
}

/** Clamp a value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Format date to readable string */
export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}
