/**
 * CarbFoot AI — useGoals Hook
 *
 * Encapsulates goal creation, progress tracking, and deletion logic.
 * Keeps GoalsPage focused purely on rendering.
 */

import { useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/components/Toast';
import type { Goal, CarbonResult } from '@/types';
import { CATEGORY_LABELS, generateId } from '@/utils/formatting';

export const GOAL_TEMPLATES = [
  { title: 'Reduce transport emissions', category: 'transportation' as const, target: 20, icon: '🚗' },
  { title: 'Switch to renewable energy', category: 'energy'          as const, target: 50, icon: '⚡' },
  { title: 'Adopt plant-rich diet',      category: 'food'            as const, target: 30, icon: '🥗' },
  { title: 'Cut shopping footprint',     category: 'shopping'        as const, target: 25, icon: '🛍️' },
  { title: 'Zero waste practices',       category: 'waste'           as const, target: 40, icon: '♻️' },
  { title: 'Overall 20% reduction',     category: 'overall'         as const, target: 20, icon: '🌍' },
];

/** Validate goal form fields; returns a map of field → error message. */
export function validateGoalForm(
  title: string,
  targetPercent: number,
  deadlineDays: number,
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!title.trim())               errors.title    = 'Goal title is required';
  if (title.trim().length > 100)   errors.title    = 'Title must be under 100 characters';
  if (targetPercent < 1 || targetPercent > 100) errors.target   = 'Target must be 1–100%';
  if (deadlineDays  < 7 || deadlineDays  > 365) errors.deadline = 'Deadline must be 7–365 days';
  return errors;
}

/** Build a Goal object from form inputs and the current carbon result. */
export function buildGoal(
  title: string,
  category: Goal['category'],
  targetPercent: number,
  deadlineDays: number,
  carbonResult: CarbonResult,
): Goal {
  const baseEmissions =
    category === 'overall'
      ? carbonResult.totalAnnualKgCO2e
      : carbonResult.byCategory[category as keyof typeof carbonResult.byCategory] ??
        carbonResult.totalAnnualKgCO2e;

  return {
    id: generateId(),
    title: title.trim(),
    description: `Reduce ${
      category === 'overall' ? 'total' : CATEGORY_LABELS[category]
    } emissions by ${targetPercent}%`,
    category,
    targetReductionPercent: targetPercent,
    targetKgCO2e: Math.round(baseEmissions * (targetPercent / 100)),
    currentProgress: 0,
    createdAt: new Date().toISOString(),
    deadline: new Date(Date.now() + deadlineDays * 86_400_000).toISOString(),
    completed: false,
    weeklyCheckIns: [],
  };
}

/** Compute a progress-updated version of a goal (clamped 0–100). */
export function applyProgressDelta(goal: Goal, delta: number): Goal {
  const newProgress = Math.min(100, Math.max(0, goal.currentProgress + delta));
  return {
    ...goal,
    currentProgress: newProgress,
    completed: newProgress >= 100,
    weeklyCheckIns: [
      ...goal.weeklyCheckIns,
      { week: new Date().toISOString().slice(0, 10), progressDelta: delta },
    ],
  };
}

/** Aggregated goal stats derived from the goals list. */
export interface GoalStats {
  active: Goal[];
  completed: Goal[];
  totalSaved: number;
  completionRate: number;
}

export function computeGoalStats(goals: Goal[]): GoalStats {
  const active    = goals.filter(g => !g.completed);
  const completed = goals.filter(g =>  g.completed);
  const totalSaved = completed.reduce((s, g) => s + g.targetKgCO2e, 0);
  const completionRate = goals.length > 0
    ? Math.round((completed.length / goals.length) * 100)
    : 0;
  return { active, completed, totalSaved, completionRate };
}

// ── React hook ───────────────────────────────────────────────

export interface UseGoalsReturn {
  goals: Goal[];
  stats: GoalStats;
  handleAddGoal: (goal: Goal) => void;
  handleUpdateGoal: (goal: Goal) => void;
  handleDeleteGoal: (id: string) => void;
}

export function useGoals(): UseGoalsReturn {
  const { state, addGoal, updateGoal, deleteGoal } = useApp();
  const { showToast } = useToast();

  const goals = state.goals;
  const stats = computeGoalStats(goals);

  const handleAddGoal = useCallback((goal: Goal) => {
    addGoal(goal);
    showToast('Goal created! Track your progress weekly.', 'success', '🎯');
  }, [addGoal, showToast]);

  const handleUpdateGoal = useCallback((goal: Goal) => {
    updateGoal(goal);
    if (goal.completed) {
      showToast(`🎉 "${goal.title}" completed! Amazing work!`, 'success', '🏆');
    }
  }, [updateGoal, showToast]);

  const handleDeleteGoal = useCallback((id: string) => {
    deleteGoal(id);
    showToast('Goal removed.', 'info');
  }, [deleteGoal, showToast]);

  return { goals, stats, handleAddGoal, handleUpdateGoal, handleDeleteGoal };
}
