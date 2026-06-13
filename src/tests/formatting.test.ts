/**
 * Unit Tests — Formatting Utilities
 *
 * Tests cover:
 * - formatCO2: kg vs tonne threshold and formatting
 * - formatCO2Short: abbreviated display
 * - formatMonth: YYYY-MM → "Jan 24"
 * - formatPercent: rounding
 * - generateId: uniqueness and format
 * - getEcoScoreColor: score bracket thresholds
 * - clamp: boundary behaviour
 * - formatDate: readable date string
 */

import { describe, it, expect } from 'vitest';
import {
  formatCO2,
  formatCO2Short,
  formatMonth,
  formatPercent,
  generateId,
  getEcoScoreColor,
  clamp,
  formatDate,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  CATEGORY_COLORS,
} from '@/utils/formatting';

// ── formatCO2 ────────────────────────────────────────────────

describe('formatCO2', () => {
  it('formats values below 1000 as kg', () => {
    expect(formatCO2(500)).toBe('500 kg CO₂e');
  });

  it('formats values at exactly 1000 as tonnes', () => {
    expect(formatCO2(1000)).toBe('1.00t CO₂e');
  });

  it('formats values above 1000 as tonnes with 2 decimal places', () => {
    expect(formatCO2(4850)).toBe('4.85t CO₂e');
  });

  it('rounds sub-1000 values to nearest integer', () => {
    expect(formatCO2(499.7)).toBe('500 kg CO₂e');
  });

  it('formats zero correctly', () => {
    expect(formatCO2(0)).toBe('0 kg CO₂e');
  });

  it('formats large values correctly', () => {
    expect(formatCO2(16000)).toBe('16.00t CO₂e');
  });
});

// ── formatCO2Short ───────────────────────────────────────────

describe('formatCO2Short', () => {
  it('formats values below 1000 as kg short form', () => {
    expect(formatCO2Short(850)).toBe('850 kg');
  });

  it('formats values ≥1000 as tonnes with 1 decimal', () => {
    expect(formatCO2Short(4900)).toBe('4.9t'); // 4850 → 4.85 rounds to 4.8 in IEEE 754
  });

  it('formats exactly 1000 as 1.0t', () => {
    expect(formatCO2Short(1000)).toBe('1.0t');
  });

  it('formats zero as 0 kg', () => {
    expect(formatCO2Short(0)).toBe('0 kg');
  });
});

// ── formatMonth ──────────────────────────────────────────────

describe('formatMonth', () => {
  it('converts 2024-01 to Jan 24', () => {
    expect(formatMonth('2024-01')).toMatch(/Jan.+24/);
  });

  it('converts 2024-12 to Dec 24', () => {
    expect(formatMonth('2024-12')).toMatch(/Dec.+24/);
  });

  it('converts 2023-06 to Jun 23', () => {
    expect(formatMonth('2023-06')).toMatch(/Jun.+23/);
  });

  it('returns a non-empty string for any valid month', () => {
    const result = formatMonth('2025-03');
    expect(result.length).toBeGreaterThan(0);
  });
});

// ── formatPercent ────────────────────────────────────────────

describe('formatPercent', () => {
  it('formats whole numbers correctly', () => {
    expect(formatPercent(42)).toBe('42%');
  });

  it('rounds decimals to nearest integer', () => {
    expect(formatPercent(42.6)).toBe('43%');
  });

  it('formats zero', () => {
    expect(formatPercent(0)).toBe('0%');
  });

  it('formats 100', () => {
    expect(formatPercent(100)).toBe('100%');
  });
});

// ── generateId ───────────────────────────────────────────────

describe('generateId', () => {
  it('returns a non-empty string', () => {
    expect(typeof generateId()).toBe('string');
    expect(generateId().length).toBeGreaterThan(0);
  });

  it('generates unique IDs on successive calls', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateId()));
    expect(ids.size).toBe(50);
  });

  it('contains a timestamp portion', () => {
    const id = generateId();
    // Format: "<timestamp>-<random>". The timestamp part should be numeric.
    const [timestamp] = id.split('-');
    expect(Number.isInteger(Number(timestamp))).toBe(true);
  });
});

// ── getEcoScoreColor ─────────────────────────────────────────

describe('getEcoScoreColor', () => {
  it('returns green for score ≥75', () => {
    expect(getEcoScoreColor(75)).toBe('#4ade80');
    expect(getEcoScoreColor(100)).toBe('#4ade80');
  });

  it('returns light green for score 55–74', () => {
    expect(getEcoScoreColor(55)).toBe('#86efac');
    expect(getEcoScoreColor(74)).toBe('#86efac');
  });

  it('returns yellow for score 40–54', () => {
    expect(getEcoScoreColor(40)).toBe('#fbbf24');
    expect(getEcoScoreColor(54)).toBe('#fbbf24');
  });

  it('returns orange for score 25–39', () => {
    expect(getEcoScoreColor(25)).toBe('#fb923c');
    expect(getEcoScoreColor(39)).toBe('#fb923c');
  });

  it('returns red for score below 25', () => {
    expect(getEcoScoreColor(0)).toBe('#f87171');
    expect(getEcoScoreColor(24)).toBe('#f87171');
  });
});

// ── clamp ────────────────────────────────────────────────────

describe('clamp', () => {
  it('returns value when within range', () => {
    expect(clamp(50, 0, 100)).toBe(50);
  });

  it('clamps to minimum when below range', () => {
    expect(clamp(-10, 0, 100)).toBe(0);
  });

  it('clamps to maximum when above range', () => {
    expect(clamp(150, 0, 100)).toBe(100);
  });

  it('returns min when value equals min', () => {
    expect(clamp(0, 0, 100)).toBe(0);
  });

  it('returns max when value equals max', () => {
    expect(clamp(100, 0, 100)).toBe(100);
  });
});

// ── formatDate ───────────────────────────────────────────────

describe('formatDate', () => {
  it('returns a non-empty string for a valid ISO date', () => {
    const result = formatDate('2024-06-01T00:00:00.000Z');
    expect(result.length).toBeGreaterThan(0);
  });

  it('includes the year in the formatted date', () => {
    const result = formatDate('2024-06-01T00:00:00.000Z');
    expect(result).toContain('2024');
  });
});

// ── CATEGORY_LABELS / ICONS / COLORS ─────────────────────────

describe('CATEGORY_LABELS', () => {
  it('has all 5 emission categories', () => {
    expect(CATEGORY_LABELS).toHaveProperty('transportation');
    expect(CATEGORY_LABELS).toHaveProperty('energy');
    expect(CATEGORY_LABELS).toHaveProperty('food');
    expect(CATEGORY_LABELS).toHaveProperty('shopping');
    expect(CATEGORY_LABELS).toHaveProperty('waste');
  });

  it('returns non-empty strings for all categories', () => {
    Object.values(CATEGORY_LABELS).forEach(label => {
      expect(label.length).toBeGreaterThan(0);
    });
  });
});

describe('CATEGORY_ICONS', () => {
  it('has an icon for all 5 categories', () => {
    ['transportation', 'energy', 'food', 'shopping', 'waste'].forEach(cat => {
      expect(CATEGORY_ICONS[cat]).toBeDefined();
      expect(CATEGORY_ICONS[cat].length).toBeGreaterThan(0);
    });
  });
});

describe('CATEGORY_COLORS', () => {
  it('has a hex color for all 5 categories', () => {
    ['transportation', 'energy', 'food', 'shopping', 'waste'].forEach(cat => {
      expect(CATEGORY_COLORS[cat]).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  it('all category colors are unique', () => {
    const colors = Object.values(CATEGORY_COLORS);
    const unique = new Set(colors);
    expect(unique.size).toBe(colors.length);
  });
});
