import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import type { Goal } from '@/types';
import {
  formatCO2, formatCO2Short, formatDate,
  CATEGORY_ICONS,
} from '@/utils/formatting';
import {
  GOAL_TEMPLATES, buildGoal, validateGoalForm, applyProgressDelta, useGoals,
} from '@/hooks/useGoals';

function AddGoalModal({
  onClose, onAdd, carbonResult,
}: {
  onClose: () => void;
  onAdd: (goal: Goal) => void;
  carbonResult: NonNullable<ReturnType<typeof useApp>['state']['carbonResult']>;
}) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Goal['category']>('overall');
  const [targetPercent, setTargetPercent] = useState(20);
  const [deadlineDays, setDeadlineDays] = useState(90);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const baseEmissions = category === 'overall'
    ? carbonResult.totalAnnualKgCO2e
    : carbonResult.byCategory[category as keyof typeof carbonResult.byCategory] ?? carbonResult.totalAnnualKgCO2e;

  const targetKg = Math.round(baseEmissions * (targetPercent / 100));
  const deadline = new Date(Date.now() + deadlineDays * 86_400_000).toISOString();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateGoalForm(title, targetPercent, deadlineDays);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    onAdd(buildGoal(title, category, targetPercent, deadlineDays, carbonResult));
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-goal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal">
        <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
          <h2 id="add-goal-title" style={{ fontWeight: 800, fontSize: '1.25rem' }}>
            Set a New Goal 🎯
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close dialog">✕</button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Quick templates */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Quick Templates
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {GOAL_TEMPLATES.map(t => (
                <button
                  key={t.title}
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ border: '1px solid var(--border)', fontSize: '0.8125rem' }}
                  onClick={() => {
                    setTitle(t.title);
                    setCategory(t.category);
                    setTargetPercent(t.target);
                  }}
                  aria-label={`Use template: ${t.title}`}
                >
                  {t.icon} {t.title}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="goal-title">
                Goal Title <span aria-label="required">*</span>
              </label>
              <input
                id="goal-title"
                type="text"
                className="form-input"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Drive less, eat more plants"
                maxLength={100}
                aria-required="true"
                aria-describedby={errors.title ? 'goal-title-error' : undefined}
              />
              {errors.title && (
                <span id="goal-title-error" className="form-error" role="alert">{errors.title}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="goal-category">Category</label>
              <select
                id="goal-category"
                className="form-select"
                value={category}
                onChange={e => setCategory(e.target.value as Goal['category'])}
              >
                <option value="overall">Overall Footprint</option>
                <option value="transportation">Transportation</option>
                <option value="energy">Energy</option>
                <option value="food">Food & Diet</option>
                <option value="shopping">Shopping</option>
                <option value="waste">Waste</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="goal-target">
                Reduction Target: <strong style={{ color: 'var(--brand-400)' }}>{targetPercent}%</strong>
              </label>
              <input
                id="goal-target"
                type="range"
                className="form-range"
                min={5} max={100} step={5}
                value={targetPercent}
                onChange={e => setTargetPercent(parseInt(e.target.value))}
                aria-valuetext={`${targetPercent}% reduction target`}
              />
              {targetKg > 0 && (
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  = saving approximately <strong style={{ color: 'var(--success)' }}>{formatCO2(targetKg)}</strong> per year
                </p>
              )}
              {errors.target && <span className="form-error" role="alert">{errors.target}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="goal-deadline">
                Deadline: <strong style={{ color: 'var(--brand-400)' }}>{deadlineDays} days</strong>
              </label>
              <input
                id="goal-deadline"
                type="range"
                className="form-range"
                min={7} max={365} step={7}
                value={deadlineDays}
                onChange={e => setDeadlineDays(parseInt(e.target.value))}
                aria-valuetext={`${deadlineDays} day deadline`}
              />
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Target date: {formatDate(deadline)}
              </div>
              {errors.deadline && <span className="form-error" role="alert">{errors.deadline}</span>}
            </div>
          </div>

          <div className="flex gap-3 justify-between" style={{ marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" id="add-goal-submit">
              <span aria-hidden="true">🎯</span> Create Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function GoalCard({ goal, onUpdate, onDelete }: {
  goal: Goal;
  onUpdate: (g: Goal) => void;
  onDelete: (id: string) => void;
}) {
  const daysLeft = Math.max(0, Math.round((new Date(goal.deadline).getTime() - Date.now()) / 86_400_000));
  const isOverdue = !goal.completed && daysLeft === 0;
  const cat = goal.category === 'overall' ? null : goal.category;

  const handleProgressUpdate = (delta: number) => {
    onUpdate(applyProgressDelta(goal, delta));
  };

  return (
    <article
      className="card"
      style={{
        opacity: goal.completed ? 0.75 : 1,
        border: goal.completed ? '1px solid rgba(74,222,128,0.3)' : undefined,
      }}
      aria-label={`Goal: ${goal.title}${goal.completed ? ' (completed)' : ''}`}
    >
      <div className="flex justify-between items-start" style={{ marginBottom: '1rem' }}>
        <div style={{ flex: 1 }}>
          <div className="flex items-center gap-2" style={{ marginBottom: '0.375rem' }}>
            {cat && <span aria-hidden="true">{CATEGORY_ICONS[cat]}</span>}
            {goal.completed && <span className="badge badge-success">✓ Completed</span>}
            {isOverdue && !goal.completed && <span className="badge badge-error">Overdue</span>}
            {!goal.completed && !isOverdue && daysLeft <= 7 && (
              <span className="badge badge-warning">⏰ {daysLeft}d left</span>
            )}
          </div>
          <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{goal.title}</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {goal.description}
          </p>
        </div>
        <button
          className="btn btn-danger btn-icon btn-sm"
          onClick={() => onDelete(goal.id)}
          aria-label={`Delete goal: ${goal.title}`}
          id={`delete-goal-${goal.id}`}
        >
          ✕
        </button>
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: '0.375rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Progress</span>
          <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>{goal.currentProgress}%</span>
        </div>
        <div
          className="progress-bar"
          role="progressbar"
          aria-valuenow={goal.currentProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${goal.title} progress: ${goal.currentProgress}%`}
        >
          <div
            className="progress-fill"
            style={{
              width: `${goal.currentProgress}%`,
              background: goal.completed ? 'var(--success)' : 'var(--grad-brand)',
            }}
          />
        </div>
      </div>

      <div className="flex justify-between items-center" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
        <span>Target: -{goal.targetReductionPercent}% ({formatCO2Short(goal.targetKgCO2e)})</span>
        {!goal.completed && (
          <span>{daysLeft > 0 ? `${daysLeft} days remaining` : 'Due today'}</span>
        )}
      </div>

      {!goal.completed && (
        <div className="flex gap-2" style={{ marginTop: '1rem' }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => handleProgressUpdate(10)}
            aria-label="Mark 10% progress"
            id={`progress-10-${goal.id}`}
          >
            +10%
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => handleProgressUpdate(25)}
            aria-label="Mark 25% progress"
            id={`progress-25-${goal.id}`}
          >
            +25%
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => handleProgressUpdate(100 - goal.currentProgress)}
            aria-label="Mark goal as complete"
            id={`complete-goal-${goal.id}`}
          >
            ✓ Complete
          </button>
        </div>
      )}
    </article>
  );
}

export default function GoalsPage() {
  const navigate = useNavigate();
  const { state } = useApp();
  const [showModal, setShowModal] = useState(false);

  const { stats, handleAddGoal, handleUpdateGoal, handleDeleteGoal } = useGoals();

  const wrappedAddGoal = (goal: Goal) => {
    handleAddGoal(goal);
    setShowModal(false);
  };

  if (!state.hasCompletedAssessment || !state.carbonResult) {
    return (
      <main id="main-content" className="page">
        <div className="container" style={{ maxWidth: 600, textAlign: 'center', paddingTop: '4rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }} aria-hidden="true">🎯</div>
          <h1 className="page-title" style={{ marginBottom: '1rem' }}>Complete Assessment First</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            You need to complete the carbon footprint assessment before setting goals.
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/assessment')} id="goals-go-assessment">
            Start Assessment
          </button>
        </div>
      </main>
    );
  }

  const active = stats.active;
  const completed = stats.completed;
  const totalSaved = stats.totalSaved;

  return (
    <main id="main-content" className="page">
      <div className="container">
        <div className="page-header flex justify-between items-start">
          <div>
            <h1 className="page-title font-display">Goal Tracking</h1>
            <p className="page-subtitle">Set and track your sustainability targets</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
            id="open-add-goal"
            aria-label="Add a new sustainability goal"
          >
            <span aria-hidden="true">+</span> New Goal
          </button>
        </div>

        {/* Stats row */}
        {state.goals.length > 0 && (
          <div className="grid-4 stagger" style={{ marginBottom: '2rem' }}>
            <div className="stat-card">
              <div className="stat-label">Active Goals</div>
              <div className="stat-value">{active.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Completed</div>
              <div className="stat-value">{completed.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Saved</div>
              <div className="stat-value" style={{ fontSize: '1.5rem' }}>
                {formatCO2Short(totalSaved)}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Completion Rate</div>
              <div className="stat-value">
                {state.goals.length > 0 ? `${stats.completionRate}%` : '—'}
              </div>
            </div>
          </div>
        )}

        {state.goals.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }} aria-hidden="true">🎯</div>
            <h2 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>No goals yet</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Set your first sustainability goal and start tracking your progress.
            </p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)} id="goals-empty-add">
              <span aria-hidden="true">+</span> Create First Goal
            </button>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <section aria-labelledby="active-goals-title" style={{ marginBottom: '2rem' }}>
                <h2
                  id="active-goals-title"
                  style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '1rem' }}
                >
                  Active Goals ({active.length})
                </h2>
                <div className="grid-2">
                  {active.map(goal => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onUpdate={handleUpdateGoal}
                      onDelete={handleDeleteGoal}
                    />
                  ))}
                </div>
              </section>
            )}

            {completed.length > 0 && (
              <section aria-labelledby="completed-goals-title">
                <h2
                  id="completed-goals-title"
                  style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '1rem' }}
                >
                  ✅ Completed Goals ({completed.length})
                </h2>
                <div className="grid-2">
                  {completed.map(goal => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onUpdate={handleUpdateGoal}
                      onDelete={handleDeleteGoal}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {showModal && state.carbonResult && (
        <AddGoalModal
          onClose={() => setShowModal(false)}
          onAdd={wrappedAddGoal}
          carbonResult={state.carbonResult}
        />
      )}
    </main>
  );
}
