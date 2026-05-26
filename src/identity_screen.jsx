/* ═══════════════════════════════════════════════════════════════════════════
 * IDENTITY SCREEN — fullscreen private coaching view
 *
 * Opens from Home → tap "Your progress" card. Shows tier hero, score, three
 * key metrics, weekly review entry, and the Identity Evidence Timeline.
 *
 * Visual DNA: matte glass, cinematic minimalism, calm motion, no badges or
 * achievement-grid. Inspired by WHOOP / Oura "state of progression" view.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { useState } from 'react';
import { Icon, Card, Btn } from './shared';
import { t, useT } from './lib';
import {
  calculateLiveIdentity, generateWeeklyReview, TIERS, PR_TYPES,
} from './pr';
import { getExercise } from './exercise_library';

const TIER_KEY_MAP = {
  [TIERS.FOUNDATION]: { name: 'progress.tier.foundation', copy: 'progress.copy.foundation' },
  [TIERS.FORGED]:     { name: 'progress.tier.forged',     copy: 'progress.copy.forged' },
  [TIERS.DIALED]:     { name: 'progress.tier.dialed',     copy: 'progress.copy.dialed' },
  [TIERS.RELENTLESS]: { name: 'progress.tier.relentless', copy: 'progress.copy.relentless' },
};

export function IdentityScreen({ data, onClose }) {
  const T = useT();
  const [showWeekly, setShowWeekly] = useState(false);

  const { tier, score, metrics } = calculateLiveIdentity(data);
  const tierKeys = TIER_KEY_MAP[tier] || TIER_KEY_MAP[TIERS.FOUNDATION];
  const timeline = Array.isArray(data.timeline) ? [...data.timeline] : [];
  timeline.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  const review = generateWeeklyReview(data);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: t.bg, color: t.text,
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto',
    }}>
      {/* Sticky header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 5,
        background: t.bg, borderBottom: `1px solid ${t.border}`,
        padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div onClick={onClose} style={{
          width: 36, height: 36, borderRadius: 10,
          background: t.card2, border: `1px solid ${t.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}>
          <Icon name="chevL" size={20} color={t.text} stroke={2.4} />
        </div>
        <div style={{
          flex: 1, fontSize: 11, fontWeight: 800, color: t.soft,
          letterSpacing: '0.14em', textTransform: 'uppercase',
        }}>
          {T('identity.title')}
        </div>
      </div>

      {/* Soft top-light gradient — cinematic depth */}
      <div style={{
        position: 'absolute', top: 60, left: 0, right: 0, height: 320,
        background: `radial-gradient(ellipse at center top, rgba(77,139,250,0.14), transparent 65%)`,
        pointerEvents: 'none',
      }} />

      {/* Hero: tier name + tier copy */}
      <div style={{
        padding: '40px 24px 28px', textAlign: 'center', position: 'relative',
      }}>
        <div style={{
          fontSize: 44, fontWeight: 800, color: t.text,
          letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 14,
        }}>
          {T(tierKeys.name)}
        </div>
        <div style={{
          fontSize: 15, color: t.soft, fontWeight: 500,
          letterSpacing: '0.01em', lineHeight: 1.45,
          maxWidth: 320, margin: '0 auto',
          fontStyle: 'italic', opacity: 0.9,
        }}>
          {T(tierKeys.copy)}
        </div>
      </div>

      {/* Big score ring */}
      <div style={{
        display: 'flex', justifyContent: 'center', padding: '4px 0 36px',
        position: 'relative',
      }}>
        <BigTierRing score={score} />
      </div>

      {/* Metrics row */}
      <div style={{
        margin: '0 20px 24px', padding: '20px 0',
        borderTop: `1px solid ${t.border}`,
        borderBottom: `1px solid ${t.border}`,
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
        position: 'relative',
      }}>
        <Metric label={T('identity.workouts')} value={metrics.workoutsCompleted} />
        <Metric label={T('identity.weeks_active')} value={metrics.weeksActive} />
        <Metric label={T('identity.adherence')} value={`${metrics.adherencePct}%`} />
      </div>

      {/* Weekly review tap-row */}
      {review && (
        <div onClick={() => setShowWeekly(true)} style={{
          margin: '0 20px 24px', padding: '16px 18px',
          background: 'rgba(255,255,255,0.025)',
          border: `1px solid ${t.border}`,
          borderRadius: 16, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.04)',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 10, fontWeight: 800, color: t.muted,
              letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 4,
            }}>
              {T('identity.this_week')}
            </div>
            <div style={{
              fontSize: 14, color: t.text, fontWeight: 600,
              letterSpacing: '-0.01em', lineHeight: 1.4,
            }}>
              {translateHeadline(review.headline, T)}
            </div>
          </div>
          <Icon name="chevR" size={16} color={t.soft} />
        </div>
      )}

      {/* Evidence timeline */}
      <div style={{ padding: '0 20px 40px', position: 'relative' }}>
        <div style={{
          fontSize: 11, fontWeight: 800, color: t.muted,
          letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 14,
        }}>
          {T('identity.evidence')}
        </div>

        {timeline.length === 0 ? (
          <div style={{
            fontSize: 13.5, color: t.soft, lineHeight: 1.55, fontStyle: 'italic',
            padding: '8px 2px',
          }}>
            {T('identity.no_evidence')}
          </div>
        ) : (
          <TimelineList entries={timeline} T={T} />
        )}
      </div>

      {/* Weekly review modal */}
      {showWeekly && (
        <WeeklyReviewModal
          data={data}
          onClose={() => setShowWeekly(false)}
          T={T}
        />
      )}
    </div>
  );
}

function BigTierRing({ score, size = 132 }) {
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const C = 2 * Math.PI * radius;
  const dash = (Math.min(Math.max(score, 0), 100) / 100) * C;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={radius}
          stroke="rgba(140,160,200,0.10)" strokeWidth={stroke} fill="none" />
        <circle cx={size/2} cy={size/2} r={radius}
          stroke="url(#bigTierGrad)" strokeWidth={stroke} fill="none"
          strokeDasharray={`${dash} ${C}`} strokeLinecap="round" />
        <defs>
          <linearGradient id="bigTierGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6FA0FF" />
            <stop offset="100%" stopColor="#4D8BFA" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          fontSize: 40, fontWeight: 800, color: t.text,
          letterSpacing: '-0.03em', lineHeight: 1, fontVariantNumeric: 'tabular-nums',
        }}>
          {Math.round(score)}
        </div>
        <div style={{
          fontSize: 10, color: t.muted, fontWeight: 700, letterSpacing: '0.14em',
          marginTop: 5, textTransform: 'uppercase',
        }}>
          /100
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div style={{ textAlign: 'center', padding: '0 8px' }}>
      <div style={{
        fontSize: 10, fontWeight: 800, color: t.muted,
        letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 22, fontWeight: 800, color: t.text,
        letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </div>
    </div>
  );
}

function TimelineList({ entries, T }) {
  return (
    <div style={{ position: 'relative', paddingLeft: 18 }}>
      {/* Vertical guide-line */}
      <div style={{
        position: 'absolute', left: 4, top: 4, bottom: 4,
        width: 1, background: t.border,
      }} />

      {entries.map((entry, idx) => (
        <div key={entry.id} style={{
          position: 'relative', paddingBottom: idx === entries.length - 1 ? 0 : 22,
        }}>
          {/* Dot */}
          <div style={{
            position: 'absolute', left: -18, top: 6,
            width: 9, height: 9, borderRadius: 5,
            background: t.bg,
            border: `2px solid #6FA0FF`,
            boxShadow: '0 0 10px rgba(111,160,255,0.35)',
          }} />
          <div style={{
            fontSize: 14, fontWeight: 700, color: t.text,
            letterSpacing: '-0.01em', lineHeight: 1.3, marginBottom: 4,
          }}>
            {T(entry.titleKey || 'progress.no_progress')}
          </div>
          <div style={{
            fontSize: 12, color: t.soft, fontWeight: 500, lineHeight: 1.4,
          }}>
            {T(entry.subtitleKey || '', entry.subtitleVars || {})}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════ WEEKLY REVIEW MODAL ═══════════════════════════ */

function WeeklyReviewModal({ data, onClose, T }) {
  const review = generateWeeklyReview(data);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1100,
      background: t.bg, color: t.text,
      display: 'flex', flexDirection: 'column', overflowY: 'auto',
    }}>
      {/* Sticky header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 5,
        background: t.bg, borderBottom: `1px solid ${t.border}`,
        padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div onClick={onClose} style={{
          width: 36, height: 36, borderRadius: 10,
          background: t.card2, border: `1px solid ${t.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}>
          <Icon name="chevL" size={20} color={t.text} stroke={2.4} />
        </div>
        <div style={{
          flex: 1, fontSize: 11, fontWeight: 800, color: t.soft,
          letterSpacing: '0.14em', textTransform: 'uppercase',
        }}>
          {T('weekly.title')}
        </div>
      </div>

      {/* Top-light gradient */}
      <div style={{
        position: 'absolute', top: 60, left: 0, right: 0, height: 280,
        background: `radial-gradient(ellipse at center top, rgba(77,139,250,0.12), transparent 65%)`,
        pointerEvents: 'none',
      }} />

      {!review ? (
        <div style={{
          padding: '60px 24px', textAlign: 'center',
          fontSize: 14, color: t.soft, fontStyle: 'italic', lineHeight: 1.5,
        }}>
          {T('weekly.no_data')}
        </div>
      ) : (
        <>
          {/* Headline */}
          <div style={{ padding: '40px 24px 28px', textAlign: 'center', position: 'relative' }}>
            <div style={{
              fontSize: 22, fontWeight: 800, color: t.text,
              letterSpacing: '-0.02em', lineHeight: 1.25,
              maxWidth: 320, margin: '0 auto',
            }}>
              {translateHeadline(review.headline, T)}
            </div>
            <div style={{
              fontSize: 13, color: t.soft, marginTop: 12, fontStyle: 'italic',
            }}>
              {T('weekly.subtitle')}
            </div>
          </div>

          {/* Top PR hero — if any */}
          {review.topPR && (
            <TopPRCard pr={review.topPR} T={T} />
          )}

          {/* Metrics grid */}
          <div style={{
            margin: '0 20px 24px',
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
            position: 'relative',
          }}>
            <WeeklyMetricCard
              label={T('weekly.sessions')}
              value={String(review.sessionCount)}
            />
            <WeeklyMetricCard
              label={T('weekly.volume')}
              value={`${review.totalVolume.toLocaleString('en-US')} kg`}
            />
            <WeeklyMetricCard
              label={T('weekly.prs')}
              value={String(review.prCount)}
            />
            {review.bodyweightDelta !== null && (
              <WeeklyMetricCard
                label={T('weekly.bodyweight_delta')}
                value={`${review.bodyweightDelta > 0 ? '+' : ''}${review.bodyweightDelta} kg`}
              />
            )}
          </div>

          {/* Continue */}
          <div style={{ flex: 1, minHeight: 24 }} />
          <div style={{ padding: '16px 20px 24px' }}>
            <Btn full accent="orange" onClick={onClose}>{T('weekly.close')}</Btn>
          </div>
        </>
      )}
    </div>
  );
}

function WeeklyMetricCard({ label, value }) {
  return (
    <div style={{
      padding: '14px 16px', borderRadius: 14,
      background: 'rgba(255,255,255,0.025)',
      border: `1px solid ${t.border}`,
      boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.04)',
    }}>
      <div style={{
        fontSize: 10, fontWeight: 800, color: t.muted,
        letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 6,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 19, fontWeight: 800, color: t.text,
        letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </div>
    </div>
  );
}

const PR_TYPE_TO_KEY = {
  [PR_TYPES.HEAVIEST_WEIGHT]: 'pr.type.heaviest',
  [PR_TYPES.EST_1RM]:         'pr.type.est1rm',
  [PR_TYPES.BEST_VOLUME]:     'pr.type.volume',
};

function TopPRCard({ pr, T }) {
  const exMeta = getExercise(pr.exerciseId);
  const exName = exMeta?.name || pr.exerciseId;
  const value = pr.type === PR_TYPES.BEST_VOLUME
    ? `${Math.round(pr.newValue).toLocaleString('en-US')} kg`
    : `${Number(pr.newValue).toFixed(1)} kg`;
  return (
    <div style={{
      margin: '0 20px 24px', padding: '20px 22px',
      background: t.glassPanel,
      border: `1px solid ${t.borderStrong}`,
      borderRadius: 18,
      backdropFilter: 'blur(18px) saturate(140%)',
      WebkitBackdropFilter: 'blur(18px) saturate(140%)',
      boxShadow: t.cardShadow,
      position: 'relative',
    }}>
      <div style={{
        fontSize: 9, fontWeight: 800, color: '#6FA0FF',
        letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8,
      }}>
        {T(PR_TYPE_TO_KEY[pr.type] || 'pr.new')}
      </div>
      <div style={{
        fontSize: 32, fontWeight: 800, color: t.text,
        letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 6,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </div>
      <div style={{ fontSize: 13, color: t.soft, fontWeight: 500 }}>
        {exName}
      </div>
    </div>
  );
}

function translateHeadline(headline, T) {
  // generateWeeklyReview returns English-language headline strings. Map to
  // localized keys when we recognize one.
  switch (headline) {
    case 'Consistency held.':                          return T('weekly.headline.consistency');
    case 'Strength up while bodyweight held.':         return T('weekly.headline.strength');
    case 'A step forward.':                            return T('weekly.headline.step');
    case 'A quiet week.':                              return T('weekly.headline.quiet');
    default:                                           return headline; // PR-count strings — already short
  }
}
