import { t, WEEK, useApp, useT, useLang, todayIdx, weekDates, todayKey, dayLabel, weekDayShort, fmtKey } from './lib';
import { Icon, Card, Label, ProgressBar, Ring } from './shared';

/* ═══════════════════════════ HOME ═══════════════════════════ */
export function Home({ onOpenCheckIn }) {
  const T = useT();
  const { lang } = useLang();
  const { profile, session } = useApp();
  const d = profile?.data || {};
  const userName = profile?.name || session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'You';
  const calories = d.calories || 0;
  const protein = d.protein || 0;
  const carbs = d.carbs || 0;
  const fat = d.fat || 0;
  const streak = d.streak || 0;
  const weights = Array.isArray(d.weights) ? d.weights : [];
  const checkIns = d.checkIns || {};
  const meals = d.meals || {};
  const workoutPlan = d.workoutPlan || {};
  const workoutLog = d.workoutLog || {};

  const ti = todayIdx();
  const dates = weekDates();
  const tKey = todayKey();

  // Today's eaten totals
  const todayMeals = meals[tKey] || [];
  const eatenKcal = todayMeals.reduce((s, m) => s + (m.eaten ? (m.kcal || 0) : 0), 0);
  const eatenP = todayMeals.reduce((s, m) => s + (m.eaten ? (m.p || 0) : 0), 0);
  const eatenC = todayMeals.reduce((s, m) => s + (m.eaten ? (m.c || 0) : 0), 0);
  const eatenF = todayMeals.reduce((s, m) => s + (m.eaten ? (m.f || 0) : 0), 0);
  const remaining = Math.max(0, calories - eatenKcal);

  // Today's workout
  const todayDayName = WEEK[ti];
  const todayWorkout = workoutPlan[todayDayName] || null;
  const todayDone = workoutLog[tKey]?.completed || false;

  // Check-in done check
  const checkedThisWeek = WEEK.map((_, i) => {
    const dt = new Date(); dt.setDate(dt.getDate() - ti + i);
    return !!checkIns[fmtKey(dt)];
  });

  // Weight graph: last 7 entries
  const wLog = weights.slice(-7);
  const hasWeights = wLog.length >= 2;
  let linePath = '', fillPath = '', pts = [], lastW = null, weightDelta = null;
  if (hasWeights) {
    const vals = wLog.map(w => w.weight);
    const minW = Math.min(...vals) - 0.3;
    const maxW = Math.max(...vals) + 0.3;
    const W = 100, H = 60;
    pts = vals.map((w, i) => ({
      x: (i / (vals.length - 1)) * W,
      y: H - ((w - minW) / (maxW - minW)) * H,
    }));
    linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    fillPath = `${linePath} L ${W} ${H} L 0 ${H} Z`;
    lastW = vals[vals.length - 1];
    weightDelta = (lastW - vals[0]).toFixed(1);
  }

  return (
    <div style={{ padding: '20px 16px 100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 13, color: t.muted, fontWeight: 600, letterSpacing: '0.05em', marginBottom: 2 }}>{dayLabel(lang)}</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: t.text, letterSpacing: '-0.02em' }}>{T('home.greeting')}, {userName}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ position: 'relative', width: 40, height: 40, borderRadius: 12, background: t.card2, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${t.border}`, cursor: 'pointer' }}>
            <Icon name="bell" size={18} color={t.soft} />
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${t.green}, ${t.orange})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0A0A0B', fontWeight: 800, fontSize: 15 }}>{(userName[0] || 'U').toUpperCase()}</div>
        </div>
      </div>

      {/* Block 1: Daily Check-in */}
      <Card onClick={onOpenCheckIn} style={{ background: `linear-gradient(135deg, ${t.card}, ${t.card2})`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, background: `radial-gradient(circle, ${t.greenBg}, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, position: 'relative' }}>
          <Label color={t.green} style={{ marginBottom: 0 }}>{T('home.checkin')}</Label>
          {streak > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: t.orangeBg, padding: '4px 10px', borderRadius: 10, border: `1px solid ${t.orangeBorder}` }}>
              <Icon name="fire" size={11} color={t.orange} />
              <span style={{ fontSize: 11, color: t.orange, fontWeight: 700 }}>{streak} {T('home.streak')}</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 4, justifyContent: 'space-between', marginBottom: 14, position: 'relative' }}>
          {WEEK.map((day, i) => {
            const isToday = i === ti;
            const done = checkedThisWeek[i];
            return (
              <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 9, color: isToday ? t.green : t.muted, fontWeight: 700, letterSpacing: '0.05em' }}>{weekDayShort(lang, i)}</div>
                <div style={{
                  width: 34, height: 34, borderRadius: 17,
                  background: isToday ? t.green : done ? t.greenBg : t.card2,
                  border: `1.5px solid ${isToday ? t.green : done ? t.greenBorder : t.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isToday ? '#0A0A0B' : done ? t.green : t.muted,
                  fontSize: 11.5, fontWeight: 700,
                }}>{done ? <Icon name="check" size={14} stroke={3} /> : dates[i]}</div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
          <div style={{ fontSize: 13, color: t.soft }}>{checkIns[tKey] ? T('home.checkindone') : T('home.fillcheckin')}</div>
          <Icon name="chevR" size={16} color={t.green} />
        </div>
      </Card>

      {/* Block 2: Nutrition Status */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <Label color={t.green}>{T('home.nutrtoday')}</Label>
            {calories > 0 ? (
              <div style={{ fontSize: 16, color: t.text }}>
                {T('home.canstileat')} <span style={{ fontWeight: 700, color: t.green }}>{remaining}</span> kcal
              </div>
            ) : (
              <div style={{ fontSize: 14, color: t.muted }}>{T('home.setmacros')}</div>
            )}
          </div>
        </div>

        <ProgressBar value={eatenKcal} max={calories || 1} color={t.green} height={10} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12 }}>
          <span style={{ color: t.soft }}><span style={{ color: t.text, fontWeight: 700 }}>{eatenKcal}</span> {T('home.eaten')}</span>
          <span style={{ color: t.soft }}>{T('home.target')} <span style={{ color: t.text, fontWeight: 700 }}>{calories || '—'}</span></span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 20, paddingTop: 18, borderTop: `1px solid ${t.border}` }}>
          <Ring value={Math.round(eatenP)} max={protein || 1} color={t.protein} label={T('macros.protein')} />
          <Ring value={Math.round(eatenC)} max={carbs || 1} color={t.carbs} label={T('macros.carbs')} />
          <Ring value={Math.round(eatenF)} max={fat || 1} color={t.fat} label={T('macros.fat')} />
        </div>
      </Card>

      {/* Block 3: Workout Status */}
      <Card>
        <Label color={t.orange}>{T('home.todaysworkout')}</Label>
        {todayWorkout ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: todayDone ? t.greenBg : t.orangeBg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${todayDone ? t.greenBorder : t.orangeBorder}` }}>
                <Icon name={todayDone ? "check" : "workout"} size={22} color={todayDone ? t.green : t.orange} />
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: t.text }}>{todayWorkout}</div>
                <div style={{ fontSize: 12.5, color: t.soft }}>{todayDone ? '✓ ' + T('home.completed') : T('home.taptostart')}</div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: t.card2, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${t.border}` }}>
              <Icon name="rest" size={22} color={t.muted} />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: t.text }}>{T('home.restday')}</div>
              <div style={{ fontSize: 12.5, color: t.soft }}>{Object.keys(workoutPlan).length === 0 ? T('home.planworkouts') : T('home.recovery')}</div>
            </div>
          </div>
        )}
      </Card>

      {/* Block 4: Weight Graph */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
          <div>
            <Label>{T('home.weight')}</Label>
            {hasWeights ? (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 26, fontWeight: 800, color: t.text, letterSpacing: '-0.02em' }}>{lastW}</span>
                <span style={{ fontSize: 13, color: t.soft }}>kg</span>
                {weightDelta !== null && weightDelta !== '0.0' && (
                  <span style={{ fontSize: 12, color: parseFloat(weightDelta) < 0 ? t.green : t.orange, marginLeft: 6, fontWeight: 600 }}>{parseFloat(weightDelta) > 0 ? '+' : ''}{weightDelta} kg</span>
                )}
              </div>
            ) : (
              <div style={{ fontSize: 14, color: t.muted, marginTop: 4 }}>{T('home.logweighfirst')}</div>
            )}
          </div>
          {hasWeights && <div style={{ fontSize: 11, color: t.muted, fontWeight: 600 }}>{T('home.lastentries', { n: wLog.length })}</div>}
        </div>

        {hasWeights ? (
          <svg viewBox="0 0 100 60" preserveAspectRatio="none" style={{ width: '100%', height: 90 }}>
            <defs>
              <linearGradient id="wf" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={t.green} stopOpacity="0.3" />
                <stop offset="100%" stopColor={t.green} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={fillPath} fill="url(#wf)" />
            <path d={linePath} fill="none" stroke={t.green} strokeWidth="1.5" strokeLinecap="round" />
            {pts.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 2 : 1.2} fill={t.green} />
            ))}
          </svg>
        ) : (
          <div style={{ height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, background: t.card2, border: `1px dashed ${t.border}` }}>
            <div style={{ fontSize: 12, color: t.muted }}>{T('home.graphhint')}</div>
          </div>
        )}
      </Card>
    </div>
  );
}
export function EXMAP_LEN(workouts, name) { const w = (workouts||[]).find(x => x.name === name); return w ? (w.exercises||[]).length : 4; }
