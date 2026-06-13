/**
 * CarbFoot AI — Data Layer
 *
 * Static data: badges, challenges, default user profile,
 * emission factor labels, monthly history simulation.
 */

import type { Badge, Challenge, UserProfile, MonthlyEntry, CategoryEmissions } from '@/types';
import { format, subMonths } from 'date-fns';

// ── Badges ────────────────────────────────────────────────────

export const ALL_BADGES: Badge[] = [
  {
    id: 'first-assessment',
    name: 'Carbon Curious',
    description: 'Completed your first carbon footprint assessment',
    icon: '🌱',
    category: 'milestones',
    unlocked: false,
    rarity: 'common',
  },
  {
    id: 'eco-score-50',
    name: 'Green Starter',
    description: 'Achieved an Eco Score of 50 or higher',
    icon: '🌿',
    category: 'milestones',
    unlocked: false,
    rarity: 'common',
  },
  {
    id: 'eco-score-75',
    name: 'Eco Warrior',
    description: 'Achieved an Eco Score of 75 or higher',
    icon: '🦺',
    category: 'milestones',
    unlocked: false,
    rarity: 'rare',
  },
  {
    id: 'eco-score-90',
    name: 'Planet Protector',
    description: 'Achieved an Eco Score of 90 or higher',
    icon: '🌍',
    category: 'milestones',
    unlocked: false,
    rarity: 'epic',
  },
  {
    id: 'first-goal',
    name: 'Goal Setter',
    description: 'Created your first sustainability goal',
    icon: '🎯',
    category: 'goals',
    unlocked: false,
    rarity: 'common',
  },
  {
    id: 'goal-complete-1',
    name: 'Promise Keeper',
    description: 'Completed your first sustainability goal',
    icon: '✅',
    category: 'goals',
    unlocked: false,
    rarity: 'rare',
  },
  {
    id: 'goal-complete-5',
    name: 'Commitment Champion',
    description: 'Completed 5 sustainability goals',
    icon: '🏆',
    category: 'goals',
    unlocked: false,
    rarity: 'epic',
  },
  {
    id: 'challenge-first',
    name: 'Challenge Accepted',
    description: 'Completed your first eco challenge',
    icon: '⚡',
    category: 'challenges',
    unlocked: false,
    rarity: 'common',
  },
  {
    id: 'challenge-5',
    name: 'Eco Enthusiast',
    description: 'Completed 5 eco challenges',
    icon: '🔥',
    category: 'challenges',
    unlocked: false,
    rarity: 'rare',
  },
  {
    id: 'challenge-10',
    name: 'Sustainability Superhero',
    description: 'Completed 10 eco challenges',
    icon: '🦸',
    category: 'challenges',
    unlocked: false,
    rarity: 'epic',
  },
  {
    id: 'streak-7',
    name: 'Week Warrior',
    description: 'Maintained a 7-day sustainability streak',
    icon: '📅',
    category: 'streaks',
    unlocked: false,
    rarity: 'rare',
  },
  {
    id: 'streak-30',
    name: 'Month Master',
    description: 'Maintained a 30-day sustainability streak',
    icon: '🗓️',
    category: 'streaks',
    unlocked: false,
    rarity: 'epic',
  },
  {
    id: 'transport-hero',
    name: 'Transit Pioneer',
    description: 'Accepted 3 transportation reduction challenges',
    icon: '🚌',
    category: 'transport',
    unlocked: false,
    rarity: 'rare',
  },
  {
    id: 'energy-saver',
    name: 'Energy Sage',
    description: 'Accepted 3 energy reduction challenges',
    icon: '⚡',
    category: 'energy',
    unlocked: false,
    rarity: 'rare',
  },
  {
    id: 'food-hero',
    name: 'Plant Powered',
    description: 'Adopted a plant-rich diet for 30 days',
    icon: '🥗',
    category: 'food',
    unlocked: false,
    rarity: 'epic',
  },
  {
    id: 'legendary-hero',
    name: 'Eco Legend',
    description: 'Achieved all previous badges',
    icon: '🌟',
    category: 'legendary',
    unlocked: false,
    rarity: 'legendary',
  },
];

// ── Challenges ────────────────────────────────────────────────

export const ALL_CHALLENGES: Challenge[] = [
  {
    id: 'ch-meatless-week',
    title: 'Meatless Week',
    description: 'Go meat-free for an entire week. Discover delicious plant-based alternatives.',
    category: 'food',
    points: 150,
    difficulty: 'medium',
    durationDays: 7,
    completed: false,
    accepted: false,
    icon: '🥗',
    estimatedSavingKgCO2e: 15,
  },
  {
    id: 'ch-no-car-week',
    title: 'Car-Free Week',
    description: 'Ditch the car for a week. Walk, cycle, or take public transport instead.',
    category: 'transportation',
    points: 200,
    difficulty: 'hard',
    durationDays: 7,
    completed: false,
    accepted: false,
    icon: '🚲',
    estimatedSavingKgCO2e: 30,
  },
  {
    id: 'ch-cold-shower',
    title: 'Cold Shower Challenge',
    description: 'Take cold showers for 5 days. Reduces hot water energy use significantly.',
    category: 'energy',
    points: 80,
    difficulty: 'easy',
    durationDays: 5,
    completed: false,
    accepted: false,
    icon: '🚿',
    estimatedSavingKgCO2e: 5,
  },
  {
    id: 'ch-zero-waste-day',
    title: 'Zero Waste Day',
    description: 'Produce zero landfill waste for an entire day. Plan meals and avoid packaging.',
    category: 'waste',
    points: 100,
    difficulty: 'medium',
    durationDays: 1,
    completed: false,
    accepted: false,
    icon: '♻️',
    estimatedSavingKgCO2e: 2,
  },
  {
    id: 'ch-local-shopping',
    title: 'Local Market Month',
    description: 'Buy all produce from local markets or farmers for one month.',
    category: 'food',
    points: 180,
    difficulty: 'medium',
    durationDays: 30,
    completed: false,
    accepted: false,
    icon: '🧺',
    estimatedSavingKgCO2e: 20,
  },
  {
    id: 'ch-unplug-standby',
    title: 'Standby Slayer',
    description: 'Unplug all standby devices for a week. Track your energy savings.',
    category: 'energy',
    points: 60,
    difficulty: 'easy',
    durationDays: 7,
    completed: false,
    accepted: false,
    icon: '🔌',
    estimatedSavingKgCO2e: 4,
  },
  {
    id: 'ch-no-fast-fashion',
    title: 'Fashion Detox',
    description: 'Buy zero new clothing items for one month. Explore thrifting instead.',
    category: 'shopping',
    points: 120,
    difficulty: 'medium',
    durationDays: 30,
    completed: false,
    accepted: false,
    icon: '👗',
    estimatedSavingKgCO2e: 25,
  },
  {
    id: 'ch-cycle-commute',
    title: 'Cycle to Work Week',
    description: 'Cycle to work every day for a week instead of driving.',
    category: 'transportation',
    points: 160,
    difficulty: 'medium',
    durationDays: 5,
    completed: false,
    accepted: false,
    icon: '🚴',
    estimatedSavingKgCO2e: 20,
  },
  {
    id: 'ch-plant-tree',
    title: 'Plant a Tree',
    description: 'Plant a tree in your garden or community space. Trees absorb CO₂ for decades.',
    category: 'waste',
    points: 100,
    difficulty: 'easy',
    durationDays: 1,
    completed: false,
    accepted: false,
    icon: '🌳',
    estimatedSavingKgCO2e: 10,
  },
  {
    id: 'ch-cold-wash',
    title: 'Cold Wash Challenge',
    description: 'Wash all laundry at 30°C or below for two weeks. Saves 40% energy per wash.',
    category: 'energy',
    points: 80,
    difficulty: 'easy',
    durationDays: 14,
    completed: false,
    accepted: false,
    icon: '🧺',
    estimatedSavingKgCO2e: 6,
  },
  {
    id: 'ch-composting',
    title: 'Start Composting',
    description: 'Set up a compost bin and compost all food scraps for two weeks.',
    category: 'waste',
    points: 140,
    difficulty: 'medium',
    durationDays: 14,
    completed: false,
    accepted: false,
    icon: '🪱',
    estimatedSavingKgCO2e: 12,
  },
  {
    id: 'ch-digital-detox',
    title: 'Digital Carbon Detox',
    description: 'Reduce screen time by 50% for a week. Digital devices have a hidden carbon cost.',
    category: 'energy',
    points: 70,
    difficulty: 'easy',
    durationDays: 7,
    completed: false,
    accepted: false,
    icon: '📵',
    estimatedSavingKgCO2e: 3,
  },
];

// ── Default User Profile ──────────────────────────────────────

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'Eco Explorer',
  streak: 0,
  totalPoints: 0,
  level: 'Beginner',
  badges: ALL_BADGES.map(b => ({ ...b })),
  completedChallenges: [],
  acceptedChallenges: [],
  joinedAt: new Date().toISOString(),
};

// ── Simulated Monthly History ─────────────────────────────────

export function generateMonthlyHistory(
  currentTotal: number,
  byCategory: CategoryEmissions
): MonthlyEntry[] {
  const months: MonthlyEntry[] = [];
  const monthlyTotal = currentTotal / 12;

  for (let i = 11; i >= 0; i--) {
    const date = subMonths(new Date(), i);
    const monthStr = format(date, 'yyyy-MM');
    // Simulate slight variation + gradual improvement over last 12 months
    const trendFactor = 1 + (i / 12) * 0.25; // older months have higher footprint
    const noiseFactor = 0.85 + Math.random() * 0.3;
    const adjustedTotal = monthlyTotal * trendFactor * noiseFactor;

    const ratio = adjustedTotal / monthlyTotal;
    months.push({
      month: monthStr,
      totalKgCO2e: Math.round(adjustedTotal),
      byCategory: {
        transportation: Math.round((byCategory.transportation / 12) * ratio),
        energy:         Math.round((byCategory.energy / 12) * ratio),
        food:           Math.round((byCategory.food / 12) * ratio),
        shopping:       Math.round((byCategory.shopping / 12) * ratio),
        waste:          Math.round((byCategory.waste / 12) * ratio),
      },
    });
  }
  return months;
}

// ── Community Leaderboard (Simulated) ────────────────────────

export interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  ecoScore: number;
  totalKgCO2e: number;
  level: string;
  points: number;
}

export function generateLeaderboard(userEcoScore: number, userPoints: number): LeaderboardEntry[] {
  const names = [
    'Alex Green', 'Sam Forrest', 'Jordan River', 'Riley Meadow',
    'Casey Brooks', 'Morgan Vale', 'Avery Stone', 'Quinn Leaf',
    'Drew Fern', 'Blake Earth',
  ];
  const avatars = ['🌱', '🌿', '🍀', '🌳', '🌲', '♻️', '🌍', '💚', '🌊', '☀️'];
  const levels = ['Eco Hero', 'Green Champion', 'Eco Conscious', 'Explorer'];

  const entries: LeaderboardEntry[] = names.map((name, i) => ({
    rank: 0,
    name,
    avatar: avatars[i],
    ecoScore: Math.max(10, Math.min(99, userEcoScore + (Math.random() - 0.4) * 30)),
    totalKgCO2e: Math.round(2000 + Math.random() * 10000),
    level: levels[Math.floor(Math.random() * levels.length)],
    points: Math.round(Math.random() * 2000),
  }));

  // Insert current user
  entries.push({
    rank: 0,
    name: 'You',
    avatar: '⭐',
    ecoScore: userEcoScore,
    totalKgCO2e: 0,
    level: 'Explorer',
    points: userPoints,
  });

  // Sort and rank
  entries.sort((a, b) => b.ecoScore - a.ecoScore);
  return entries.map((entry, i) => ({ ...entry, rank: i + 1 }));
}
