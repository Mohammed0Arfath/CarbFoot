/**
 * CarbFoot AI — Global App Context
 * Manages all application state with useReducer for predictable updates.
 * Persists to localStorage on every state change.
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from 'react';
import type { AppState, AssessmentData, CarbonResult, Goal, Theme } from '@/types';
import { DEFAULT_USER_PROFILE, ALL_CHALLENGES, generateMonthlyHistory } from '@/data';
import { calculateCarbonFootprint } from '@/engine/calculator';
import { sanitizeAssessmentData } from '@/utils/validation';

const STORAGE_KEY = 'carbfoot-ai-v1';

const defaultState: AppState = {
  theme: 'dark',
  assessmentData: null,
  carbonResult: null,
  goals: [],
  userProfile: { ...DEFAULT_USER_PROFILE },
  monthlyHistory: [],
  hasCompletedAssessment: false,
};

// ── Actions ───────────────────────────────────────────────────

type Action =
  | { type: 'SET_THEME'; payload: Theme }
  | { type: 'COMPLETE_ASSESSMENT'; payload: AssessmentData }
  | { type: 'SET_CARBON_RESULT'; payload: CarbonResult }
  | { type: 'ADD_GOAL'; payload: Goal }
  | { type: 'UPDATE_GOAL'; payload: Goal }
  | { type: 'DELETE_GOAL'; payload: string }
  | { type: 'COMPLETE_CHALLENGE'; payload: string }
  | { type: 'ACCEPT_CHALLENGE'; payload: string }
  | { type: 'UPDATE_PROFILE_NAME'; payload: string }
  | { type: 'UNLOCK_BADGE'; payload: string }
  | { type: 'INCREMENT_STREAK' }
  | { type: 'RESET_STATE' }
  | { type: 'HYDRATE'; payload: AppState };

// ── Reducer ───────────────────────────────────────────────────

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'HYDRATE':
      return action.payload;

    case 'SET_THEME':
      return { ...state, theme: action.payload };

    case 'COMPLETE_ASSESSMENT': {
      const sanitized = sanitizeAssessmentData(action.payload);
      const carbonResult = calculateCarbonFootprint(sanitized);
      const monthlyHistory = generateMonthlyHistory(
        carbonResult.totalAnnualKgCO2e,
        carbonResult.byCategory
      );
      const updatedBadges = state.userProfile.badges.map(badge =>
        badge.id === 'first-assessment'
          ? { ...badge, unlocked: true, unlockedAt: new Date().toISOString() }
          : badge.id === 'eco-score-50' && carbonResult.ecoScore >= 50
          ? { ...badge, unlocked: true, unlockedAt: new Date().toISOString() }
          : badge.id === 'eco-score-75' && carbonResult.ecoScore >= 75
          ? { ...badge, unlocked: true, unlockedAt: new Date().toISOString() }
          : badge.id === 'eco-score-90' && carbonResult.ecoScore >= 90
          ? { ...badge, unlocked: true, unlockedAt: new Date().toISOString() }
          : badge
      );
      return {
        ...state,
        assessmentData: sanitized,
        carbonResult,
        monthlyHistory,
        hasCompletedAssessment: true,
        userProfile: {
          ...state.userProfile,
          level: carbonResult.sustainabilityLevel,
          badges: updatedBadges,
        },
      };
    }

    case 'ADD_GOAL': {
      const updatedBadges = state.userProfile.badges.map(badge =>
        badge.id === 'first-goal' && state.goals.length === 0
          ? { ...badge, unlocked: true, unlockedAt: new Date().toISOString() }
          : badge
      );
      return {
        ...state,
        goals: [...state.goals, action.payload],
        userProfile: { ...state.userProfile, badges: updatedBadges },
      };
    }

    case 'UPDATE_GOAL':
      return {
        ...state,
        goals: state.goals.map(g => g.id === action.payload.id ? action.payload : g),
      };

    case 'DELETE_GOAL':
      return { ...state, goals: state.goals.filter(g => g.id !== action.payload) };

    case 'ACCEPT_CHALLENGE': {
      const newAccepted = [...state.userProfile.acceptedChallenges, action.payload];
      return {
        ...state,
        userProfile: { ...state.userProfile, acceptedChallenges: newAccepted },
      };
    }

    case 'COMPLETE_CHALLENGE': {
      const completed = [...state.userProfile.completedChallenges, action.payload];
      const challenge = ALL_CHALLENGES.find(c => c.id === action.payload);
      const pointsGained = challenge?.points ?? 0;
      const newPoints = state.userProfile.totalPoints + pointsGained;

      // Update badges based on challenge completions
      const updatedBadges = state.userProfile.badges.map(badge => {
        if (badge.id === 'challenge-first' && completed.length === 1)
          return { ...badge, unlocked: true, unlockedAt: new Date().toISOString() };
        if (badge.id === 'challenge-5' && completed.length >= 5)
          return { ...badge, unlocked: true, unlockedAt: new Date().toISOString() };
        if (badge.id === 'challenge-10' && completed.length >= 10)
          return { ...badge, unlocked: true, unlockedAt: new Date().toISOString() };
        return badge;
      });

      return {
        ...state,
        userProfile: {
          ...state.userProfile,
          completedChallenges: completed,
          totalPoints: newPoints,
          badges: updatedBadges,
        },
      };
    }

    case 'UPDATE_PROFILE_NAME':
      return {
        ...state,
        userProfile: { ...state.userProfile, name: action.payload },
      };

    case 'UNLOCK_BADGE':
      return {
        ...state,
        userProfile: {
          ...state.userProfile,
          badges: state.userProfile.badges.map(b =>
            b.id === action.payload
              ? { ...b, unlocked: true, unlockedAt: new Date().toISOString() }
              : b
          ),
        },
      };

    case 'INCREMENT_STREAK': {
      const newStreak = state.userProfile.streak + 1;
      const badgesUpdated = state.userProfile.badges.map(badge => {
        if (badge.id === 'streak-7' && newStreak >= 7)
          return { ...badge, unlocked: true, unlockedAt: new Date().toISOString() };
        if (badge.id === 'streak-30' && newStreak >= 30)
          return { ...badge, unlocked: true, unlockedAt: new Date().toISOString() };
        return badge;
      });
      return {
        ...state,
        userProfile: { ...state.userProfile, streak: newStreak, badges: badgesUpdated },
      };
    }

    case 'RESET_STATE':
      return { ...defaultState };

    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  setTheme: (theme: Theme) => void;
  completeAssessment: (data: AssessmentData) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (goal: Goal) => void;
  deleteGoal: (id: string) => void;
  acceptChallenge: (id: string) => void;
  completeChallenge: (id: string) => void;
  resetApp: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────

function loadFromStorage(): AppState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultState;
    const parsed = JSON.parse(stored) as AppState;
    // Merge with defaults to handle schema evolution
    return {
      ...defaultState,
      ...parsed,
      userProfile: { ...DEFAULT_USER_PROFILE, ...parsed.userProfile },
    };
  } catch {
    return defaultState;
  }
}

function saveToStorage(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage may be full or unavailable — fail silently
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, defaultState);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = loadFromStorage();
    dispatch({ type: 'HYDRATE', payload: stored });
  }, []);

  // Persist on every state change
  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  // Sync theme with DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state.theme]);

  const setTheme = useCallback((theme: Theme) => dispatch({ type: 'SET_THEME', payload: theme }), []);
  const completeAssessment = useCallback((data: AssessmentData) =>
    dispatch({ type: 'COMPLETE_ASSESSMENT', payload: data }), []);
  const addGoal = useCallback((goal: Goal) => dispatch({ type: 'ADD_GOAL', payload: goal }), []);
  const updateGoal = useCallback((goal: Goal) => dispatch({ type: 'UPDATE_GOAL', payload: goal }), []);
  const deleteGoal = useCallback((id: string) => dispatch({ type: 'DELETE_GOAL', payload: id }), []);
  const acceptChallenge = useCallback((id: string) => dispatch({ type: 'ACCEPT_CHALLENGE', payload: id }), []);
  const completeChallenge = useCallback((id: string) => dispatch({ type: 'COMPLETE_CHALLENGE', payload: id }), []);
  const resetApp = useCallback(() => dispatch({ type: 'RESET_STATE' }), []);

  return (
    <AppContext.Provider value={{
      state, dispatch,
      setTheme, completeAssessment,
      addGoal, updateGoal, deleteGoal,
      acceptChallenge, completeChallenge,
      resetApp,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
