import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/components/Toast';
import { ALL_CHALLENGES, generateLeaderboard } from '@/data';
import type { Challenge, Badge } from '@/types';
import { CATEGORY_LABELS, CATEGORY_ICONS, formatCO2Short } from '@/utils/formatting';

const LEVEL_THRESHOLDS = [
  { level: 'Carbon Giant',   min: 0,   max: 99,   color: '#f87171', icon: '💨' },
  { level: 'Beginner',       min: 100, max: 299,  color: '#fb923c', icon: '🌱' },
  { level: 'Explorer',       min: 300, max: 599,  color: '#fbbf24', icon: '🌿' },
  { level: 'Eco Conscious',  min: 600, max: 999,  color: '#34d399', icon: '🍀' },
  { level: 'Green Champion', min: 1000,max: 1999, color: '#10b981', icon: '🌲' },
  { level: 'Eco Hero',       min: 2000,max: Infinity, color: '#059669', icon: '🌍' },
];

const RARITY_COLORS: Record<Badge['rarity'], string> = {
  common:    '#94a3b8',
  rare:      '#60a5fa',
  epic:      '#a78bfa',
  legendary: '#fbbf24',
};

function ChallengeCard({ challenge, isAccepted, isCompleted, onAccept, onComplete }: {
  challenge: Challenge;
  isAccepted: boolean;
  isCompleted: boolean;
  onAccept: () => void;
  onComplete: () => void;
}) {
  const difficultyColor = {
    easy:   'var(--success)',
    medium: 'var(--warning)',
    hard:   'var(--error)',
  }[challenge.difficulty];

  return (
    <article
      className={`challenge-card ${isAccepted && !isCompleted ? 'accepted' : ''} ${isCompleted ? 'completed' : ''}`}
      aria-label={`Challenge: ${challenge.title}${isCompleted ? ' (completed)' : isAccepted ? ' (in progress)' : ''}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-3">
          <span style={{ fontSize: '2rem', lineHeight: 1 }} aria-hidden="true">{challenge.icon}</span>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>
              {challenge.title}
            </h3>
            <div className="flex gap-2 flex-wrap">
              <span className="badge badge-brand">
                {CATEGORY_ICONS[challenge.category]} {CATEGORY_LABELS[challenge.category]}
              </span>
              <span className="badge" style={{ background: `${difficultyColor}15`, color: difficultyColor, borderColor: `${difficultyColor}30` }}>
                {challenge.difficulty}
              </span>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontWeight: 800, color: 'var(--warning)', fontSize: '1rem' }}>
            ⭐ {challenge.points}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{challenge.durationDays}d</div>
        </div>
      </div>

      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        {challenge.description}
      </p>

      <div className="flex justify-between items-center">
        <span style={{ fontSize: '0.8125rem', color: 'var(--success)', fontWeight: 600 }}>
          -{formatCO2Short(challenge.estimatedSavingKgCO2e)} CO₂e saved
        </span>

        {isCompleted ? (
          <span className="badge badge-success">✓ Completed</span>
        ) : isAccepted ? (
          <button
            className="btn btn-primary btn-sm"
            onClick={onComplete}
            id={`complete-challenge-${challenge.id}`}
            aria-label={`Mark "${challenge.title}" as complete`}
          >
            ✓ Mark Done
          </button>
        ) : (
          <button
            className="btn btn-secondary btn-sm"
            onClick={onAccept}
            id={`accept-challenge-${challenge.id}`}
            aria-label={`Accept challenge: ${challenge.title}`}
          >
            Accept Challenge
          </button>
        )}
      </div>
    </article>
  );
}

function BadgeCard({ badge }: { badge: Badge }) {
  return (
    <div
      className={`card rarity-${badge.rarity}`}
      style={{
        textAlign: 'center',
        padding: '1.25rem 1rem',
        opacity: badge.unlocked ? 1 : 0.4,
        transition: 'all var(--transition)',
        filter: badge.unlocked ? 'none' : 'grayscale(1)',
      }}
      aria-label={`Badge: ${badge.name}. ${badge.unlocked ? 'Unlocked' : 'Locked'}. Rarity: ${badge.rarity}.`}
    >
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }} aria-hidden="true">
        {badge.unlocked ? badge.icon : '🔒'}
      </div>
      <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.25rem' }}>
        {badge.name}
      </div>
      <div style={{ fontSize: '0.75rem', color: RARITY_COLORS[badge.rarity], fontWeight: 600, textTransform: 'capitalize' }}>
        {badge.rarity}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.375rem', lineHeight: 1.4 }}>
        {badge.unlocked ? badge.description : '???'}
      </div>
    </div>
  );
}

type TabId = 'challenges' | 'badges' | 'leaderboard' | 'progress';

export default function ChallengesPage() {
  const { state, acceptChallenge, completeChallenge } = useApp();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabId>('challenges');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const accepted = state.userProfile.acceptedChallenges;
  const completed = state.userProfile.completedChallenges;

  const leaderboard = useMemo(() => {
    const score = state.carbonResult?.ecoScore ?? 30;
    const points = state.userProfile.totalPoints;
    return generateLeaderboard(score, points);
  }, [state.carbonResult, state.userProfile.totalPoints]);

  const filteredChallenges = ALL_CHALLENGES.filter(c =>
    filterCategory === 'all' || c.category === filterCategory
  );

  const handleAccept = (id: string) => {
    acceptChallenge(id);
    showToast('Challenge accepted! Good luck! 💪', 'success', '⚡');
  };

  const handleComplete = (id: string) => {
    completeChallenge(id);
    const ch = ALL_CHALLENGES.find(c => c.id === id);
    showToast(
      `Challenge completed! You earned ⭐ ${ch?.points ?? 0} points!`,
      'success',
      '🏆'
    );
  };

  const currentLevelInfo = LEVEL_THRESHOLDS.find(l =>
    state.userProfile.totalPoints >= l.min &&
    state.userProfile.totalPoints <= l.max
  ) ?? LEVEL_THRESHOLDS[0];

  const nextLevel = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.indexOf(currentLevelInfo) + 1];
  const pointsToNext = nextLevel ? nextLevel.min - state.userProfile.totalPoints : 0;
  const levelProgress = nextLevel
    ? Math.round(((state.userProfile.totalPoints - currentLevelInfo.min) /
        (nextLevel.min - currentLevelInfo.min)) * 100)
    : 100;

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'challenges',  label: 'Challenges',  icon: '⚡' },
    { id: 'badges',      label: 'Badges',      icon: '🏅' },
    { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
    { id: 'progress',    label: 'Progress',    icon: '📈' },
  ];

  return (
    <main id="main-content" className="page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title font-display">Eco Challenges</h1>
          <p className="page-subtitle">Complete challenges, earn badges, and level up your eco score</p>
        </div>

        {/* Level banner */}
        <div
          className="card card-glow"
          style={{
            background: 'var(--grad-hero)',
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: '2rem',
            alignItems: 'center',
            marginBottom: '2rem',
          }}
          aria-label={`Current level: ${currentLevelInfo.level}. ${state.userProfile.totalPoints} points.`}
        >
          <div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>
              Current Level
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '2rem' }} aria-hidden="true">{currentLevelInfo.icon}</span>
              <div>
                <div style={{ fontWeight: 900, fontSize: '1.5rem', letterSpacing: '-0.03em', color: currentLevelInfo.color }}>
                  {currentLevelInfo.level}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  ⭐ {state.userProfile.totalPoints} points total
                </div>
              </div>
            </div>
            {nextLevel && (
              <>
                <div
                  className="progress-bar"
                  role="progressbar"
                  aria-valuenow={levelProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${levelProgress}% progress to ${nextLevel.level}`}
                  style={{ marginBottom: '0.5rem' }}
                >
                  <div className="progress-fill" style={{ width: `${levelProgress}%` }} />
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  {pointsToNext} points to <strong style={{ color: nextLevel.color }}>{nextLevel.level}</strong>
                </div>
              </>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', textAlign: 'right' }}>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--success)' }}>{completed.length}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>challenges done</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--warning)' }}>
                {state.userProfile.badges.filter(b => b.unlocked).length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>badges earned</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent-400)' }}>
                {state.userProfile.streak}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>day streak</div>
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <div
          role="tablist"
          aria-label="Challenge sections"
          style={{
            display: 'flex',
            gap: '0.25rem',
            borderBottom: '1px solid var(--border)',
            marginBottom: '1.5rem',
          }}
        >
          {tabs.map(tab => (
            <button
              key={tab.id}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              className="nav-link"
              style={{
                borderBottom: activeTab === tab.id ? '2px solid var(--brand-400)' : '2px solid transparent',
                borderRadius: 0,
                paddingBottom: '0.75rem',
                fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? 'var(--brand-400)' : 'var(--text-secondary)',
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              <span aria-hidden="true">{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        {/* ── Challenges Tab ──────────────────────────────── */}
        {activeTab === 'challenges' && (
          <div role="tabpanel" id="panel-challenges" aria-labelledby="tab-challenges">
            <div className="flex gap-2" style={{ marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              {['all', 'transportation', 'energy', 'food', 'shopping', 'waste'].map(cat => (
                <button
                  key={cat}
                  className={`btn btn-sm ${filterCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setFilterCategory(cat)}
                  aria-pressed={filterCategory === cat}
                  id={`filter-${cat}`}
                >
                  {cat === 'all' ? '🌍 All' : `${CATEGORY_ICONS[cat]} ${CATEGORY_LABELS[cat]}`}
                </button>
              ))}
            </div>

            <div className="grid-2 stagger">
              {filteredChallenges.map(ch => (
                <ChallengeCard
                  key={ch.id}
                  challenge={ch}
                  isAccepted={accepted.includes(ch.id)}
                  isCompleted={completed.includes(ch.id)}
                  onAccept={() => handleAccept(ch.id)}
                  onComplete={() => handleComplete(ch.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Badges Tab ───────────────────────────────────── */}
        {activeTab === 'badges' && (
          <div role="tabpanel" id="panel-badges" aria-labelledby="tab-badges">
            <div className="flex justify-between items-center" style={{ marginBottom: '1.25rem' }}>
              <p style={{ color: 'var(--text-secondary)' }}>
                {state.userProfile.badges.filter(b => b.unlocked).length} / {state.userProfile.badges.length} unlocked
              </p>
            </div>

            {(['common', 'rare', 'epic', 'legendary'] as Badge['rarity'][]).map(rarity => {
              const rarityBadges = state.userProfile.badges.filter(b => b.rarity === rarity);
              return (
                <section key={rarity} style={{ marginBottom: '2rem' }} aria-labelledby={`rarity-${rarity}`}>
                  <h2
                    id={`rarity-${rarity}`}
                    style={{
                      fontSize: '0.9375rem',
                      fontWeight: 700,
                      marginBottom: '1rem',
                      textTransform: 'capitalize',
                      color: RARITY_COLORS[rarity],
                    }}
                  >
                    {rarity === 'legendary' ? '✨' : rarity === 'epic' ? '💜' : rarity === 'rare' ? '💎' : '⚪'}{' '}
                    {rarity}
                  </h2>
                  <div className="grid-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
                    {rarityBadges.map(badge => (
                      <BadgeCard key={badge.id} badge={badge} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* ── Leaderboard Tab ──────────────────────────────── */}
        {activeTab === 'leaderboard' && (
          <div role="tabpanel" id="panel-leaderboard" aria-labelledby="tab-leaderboard">
            <div className="card" aria-label="Community leaderboard">
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.375rem' }}>
                  🏆 Community Leaderboard
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Simulated community — your real position based on your eco score
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {leaderboard.slice(0, 11).map(entry => (
                  <div
                    key={`${entry.name}-${entry.rank}`}
                    className={`leaderboard-row ${entry.name === 'You' ? 'you' : ''}`}
                    aria-label={`Rank ${entry.rank}: ${entry.name}, eco score ${Math.round(entry.ecoScore)}`}
                  >
                    <div className={`rank-num ${entry.rank <= 3 ? 'top3' : ''}`}>
                      {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                    </div>
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: '1.25rem' }} aria-hidden="true">{entry.avatar}</span>
                      <div>
                        <div style={{ fontWeight: entry.name === 'You' ? 700 : 500 }}>{entry.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{entry.level}</div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--warning)', fontSize: '0.9rem' }}>
                      ⭐ {entry.points}
                    </div>
                    <div style={{ fontWeight: 800, color: 'var(--brand-400)', fontSize: '0.9375rem' }}>
                      {Math.round(entry.ecoScore)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Progress Tab ─────────────────────────────────── */}
        {activeTab === 'progress' && (
          <div role="tabpanel" id="panel-progress" aria-labelledby="tab-progress">
            <div className="grid-2" style={{ marginBottom: '2rem' }}>
              <div className="card">
                <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.5rem' }}>Level Progression</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {LEVEL_THRESHOLDS.map((lvl, i) => {
                    const isCurrentLevel = state.userProfile.totalPoints >= lvl.min &&
                      state.userProfile.totalPoints <= lvl.max;
                    const isPastLevel = state.userProfile.totalPoints > lvl.max;
                    return (
                      <div
                        key={lvl.level}
                        className="flex items-center gap-3"
                        style={{ opacity: isPastLevel || isCurrentLevel ? 1 : 0.4 }}
                        aria-label={`Level ${i + 1}: ${lvl.level}. ${isCurrentLevel ? 'Current level' : isPastLevel ? 'Achieved' : 'Locked'}`}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: isCurrentLevel || isPastLevel ? lvl.color : 'var(--bg-elevated)',
                          border: isCurrentLevel ? `2px solid ${lvl.color}` : '2px solid var(--border)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1rem', flexShrink: 0,
                        }} aria-hidden="true">
                          {isPastLevel ? '✓' : lvl.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: isCurrentLevel ? 700 : 500, fontSize: '0.9375rem' }}>
                            {lvl.level}
                            {isCurrentLevel && <span className="badge badge-brand" style={{ marginLeft: '0.5rem', fontSize: '0.75rem' }}>Current</span>}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {lvl.max === Infinity ? `${lvl.min}+ points` : `${lvl.min}–${lvl.max} points`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card">
                <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.5rem' }}>Activity Summary</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {[
                    { label: 'Challenges Accepted', value: accepted.length, icon: '⚡', color: 'var(--accent-400)' },
                    { label: 'Challenges Completed', value: completed.length, icon: '✅', color: 'var(--success)' },
                    { label: 'Badges Earned', value: state.userProfile.badges.filter(b => b.unlocked).length, icon: '🏅', color: 'var(--warning)' },
                    { label: 'Total Points', value: state.userProfile.totalPoints, icon: '⭐', color: 'var(--brand-400)' },
                    { label: 'Current Streak', value: `${state.userProfile.streak} days`, icon: '🔥', color: 'var(--error)' },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center" aria-label={`${item.label}: ${item.value}`}>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: '1.25rem' }} aria-hidden="true">{item.icon}</span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>{item.label}</span>
                      </div>
                      <strong style={{ fontSize: '1.25rem', color: item.color }}>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
