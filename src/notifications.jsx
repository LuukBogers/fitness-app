import { useState, useEffect, useMemo } from "react";
import { t, useApp, useT, fmtKey, todayKey, weekDates, todayIdx, WEEK } from './lib';
import { Icon, Card, Btn, Modal } from './shared';

/* ═══════════════════════════ COACH ENGINE ═══════════════════════════
 * Pattern-based daily check-in evaluator. Returns array of notification
 * objects { trigger_key, type, title, message, priority }.
 * Each trigger only fires once per pattern window (idempotent by trigger_key+date).
 */

const lastN = (checkIns, days) => {
  const out = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    out.push(checkIns[fmtKey(d)] || null);
  }
  return out;
};
const consecutiveBelow = (entries, field, threshold) => {
  // Count how many recent days (excluding nulls) hit the threshold consecutively
  let count = 0;
  for (const e of entries) {
    if (!e) continue;
    const v = parseFloat(e[field]);
    if (isNaN(v)) continue;
    if (v <= threshold) count++;
    else break;
  }
  return count;
};
const consecutiveAbove = (entries, field, threshold) => {
  let count = 0;
  for (const e of entries) {
    if (!e) continue;
    const v = parseFloat(e[field]);
    if (isNaN(v)) continue;
    if (v >= threshold) count++;
    else break;
  }
  return count;
};
const consecutiveYes = (entries, field) => {
  let count = 0;
  for (const e of entries) {
    if (!e) continue;
    if (e[field] === 'yes' || e[field] === true) count++;
    else break;
  }
  return count;
};

// Generates pending coach notifications. Each pattern with sufficient evidence
// produces a notification keyed by `trigger_key + ':' + datestamp` so we don't
// duplicate. Called on app-load + after each check-in save.
export const evaluateCoachTriggers = (profileData) => {
  const checkIns = profileData?.checkIns || {};
  const last7 = lastN(checkIns, 7);
  const last3 = lastN(checkIns, 3);
  const today = todayKey();
  const out = [];

  const add = (key, title, message, priority = 'normal') => {
    out.push({ trigger_key: key, type: 'coach', title, message, priority, created_at: new Date().toISOString(), is_read: false, datestamp: today });
  };

  // 1. Weight — 3% change since plan calc (or onboarding)
  const weights = Array.isArray(profileData?.weights) ? profileData.weights : [];
  const planWeight = parseFloat(profileData?.weight);
  if (weights.length >= 7 && planWeight) {
    const recent = weights.slice(-7).map(w => parseFloat(w.weight)).filter(Boolean);
    const avg = recent.reduce((s, x) => s + x, 0) / recent.length;
    const deltaPct = Math.abs((avg - planWeight) / planWeight) * 100;
    if (deltaPct >= 3) {
      add('weight_drift', 'Gewicht is veranderd', 'Je gewicht is duidelijk veranderd. Het kan slim zijn om je plan opnieuw te berekenen.', 'high');
    }
  }

  // 2. Sleep hours <6, 2 days in a row
  if (consecutiveBelow(last3, 'sleep', 6) >= 2) {
    add('sleep_low', 'Slaap blijft laag', 'Je slaap is de laatste dagen laag. Minder herstel kan je progressie en energie beïnvloeden.');
  }

  // 3. Sleep quality <=4, 2 days
  if (consecutiveBelow(last3, 'sleepQ', 4) >= 2) {
    add('sleepq_low', 'Slaapkwaliteit laag', 'Je slaapkwaliteit is de laatste dagen laag. Kijk of stress, herstel of cafeïne meespeelt.');
  }

  // 4. Water — heuristic "low" = <2L for 2 days
  if (consecutiveBelow(last3, 'water', 2) >= 2) {
    add('water_low', 'Vochtinname laag', 'Je vochtinname lijkt laag. Dit kan invloed hebben op herstel, performance en hoe je eruitziet.');
  }

  // 5. Steps — heuristic threshold 6000, 3+ days
  if (consecutiveBelow(last7, 'steps', 6000) >= 3) {
    add('steps_low', 'Stappendoel achter', 'Je stappendoel blijft achter. Daardoor kan je totale verbruik lager uitvallen dan gepland.');
  }

  // 6. Stress >=8, 2-3 days
  if (consecutiveAbove(last3, 'stress', 8) >= 2) {
    add('stress_high', 'Stress hoog', 'Je stressniveau is al meerdere dagen hoog. Dit kan slaap, herstel en honger beïnvloeden.');
  }

  // 7. Energy <=4, 2-3 days
  if (consecutiveBelow(last3, 'energy', 4) >= 2) {
    add('energy_low', 'Energie laag', 'Je energieniveau blijft laag. Kijk of belasting, voeding en herstel nog in balans zijn.');
  }

  // 8. Hunger >=8, 3 days
  if (consecutiveAbove(last3, 'hunger', 8) >= 3) {
    add('hunger_high', 'Honger hoog', 'Je honger is structureel hoog. Dit kan een teken zijn dat je aanpak te agressief begint te worden.', 'high');
  }

  // 9. Recovery <=4, 3 days
  if (consecutiveBelow(last3, 'recovery', 4) >= 3) {
    add('recovery_low', 'Herstel blijft achter', 'Je herstel blijft achter. Extra belasting toevoegen is nu waarschijnlijk niet slim.', 'high');
  }

  // 11. Training performance <=4, 2-3 sessions in a row
  const trainEntries = last7.filter(e => e && (e.trained === 'yes' || e.trained === true));
  let trainPerfLow = 0;
  for (const e of trainEntries) {
    const v = parseFloat(e?.trainQ);
    if (!isNaN(v) && v <= 4) trainPerfLow++;
    else break;
  }
  if (trainPerfLow >= 2) {
    add('train_perf_low', 'Trainingperformance loopt terug', 'Je trainingperformance loopt terug. Dat kan wijzen op vermoeidheid, te weinig herstel of te weinig energie.');
  }

  // 13. Caffeine after 14:00 — multiple days
  if (consecutiveYes(last3, 'caffeine') >= 3) {
    add('caffeine_late', 'Cafeïne na 14:00', 'Je neemt regelmatig cafeïne na 14:00. Dit kan je slaapkwaliteit en herstel beïnvloeden.');
  }

  return out;
};

// Merges newly-evaluated triggers with stored notifications (deduplication by trigger_key+datestamp).
// Old notifications stay; only fresh ones are appended.
export const mergeNotifications = (existing, fresh) => {
  const seen = new Set((existing || []).map(n => `${n.trigger_key}:${n.datestamp || ''}`));
  const merged = [...(existing || [])];
  for (const n of fresh) {
    const key = `${n.trigger_key}:${n.datestamp || ''}`;
    if (!seen.has(key)) {
      merged.push({ ...n, id: n.trigger_key + '_' + Date.now() + Math.random().toString(36).slice(2, 6) });
      seen.add(key);
    }
  }
  // Keep only last 60 days
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 60);
  return merged.filter(n => new Date(n.created_at) >= cutoff);
};

/* ═══════════════════════════ BELL BUTTON ═══════════════════════════ */
export function HomeBell({ onClick }) {
  const { profile } = useApp();
  const notifications = profile?.data?.notifications || [];
  const unread = notifications.filter(n => !n.is_read).length;
  return (
    <div onClick={onClick} style={{
      width: 44, height: 44, borderRadius: 14, cursor: 'pointer',
      background: t.glass, border: `1px solid ${t.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', flexShrink: 0,
    }}>
      <Icon name="bell" size={20} color={t.text} />
      {unread > 0 && (
        <div style={{
          position: 'absolute', top: -4, right: -4, minWidth: 20, height: 20,
          background: '#F5928E', color: '#0A0A0B', borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 800, padding: '0 6px',
          border: `2px solid ${t.bg}`,
        }}>{unread}</div>
      )}
    </div>
  );
}

/* ═══════════════════════════ NOTIFICATIONS LIST MODAL ═══════════════════════════ */
export function NotificationsModal({ visible, onClose }) {
  const T = useT();
  const { profile, saveProfileData } = useApp();
  const notifications = profile?.data?.notifications || [];
  // Sort newest first
  const sorted = useMemo(() => [...notifications].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)), [notifications]);

  // Mark all visible as read when modal opens
  useEffect(() => {
    if (visible && notifications.some(n => !n.is_read)) {
      const updated = notifications.map(n => ({ ...n, is_read: true }));
      saveProfileData({ notifications: updated });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const deleteOne = async (id) => {
    await saveProfileData({ notifications: notifications.filter(n => n.id !== id) });
  };
  const clearAll = async () => {
    await saveProfileData({ notifications: [] });
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    const now = new Date();
    const diffH = (now - d) / 36e5;
    if (diffH < 1) return T('notif.justnow');
    if (diffH < 24) return T('notif.hoursago', { h: Math.round(diffH) });
    const diffD = Math.floor(diffH / 24);
    if (diffD === 1) return T('notif.yesterday');
    return T('notif.daysago', { d: diffD });
  };

  return (
    <Modal visible={visible} onClose={onClose} title={T('notif.title')}>
      {sorted.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔔</div>
          <div style={{ fontSize: 14, color: t.soft, lineHeight: 1.5 }}>{T('notif.empty')}</div>
        </div>
      ) : (
        <>
          {sorted.map(n => (
            <div key={n.id} style={{
              padding: 14, borderRadius: 14, marginBottom: 8,
              background: n.is_read ? t.card2 : t.greenBg,
              border: `1px solid ${n.is_read ? t.border : t.greenBorder}`,
              opacity: n.is_read ? 0.75 : 1,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: n.is_read ? t.text : t.green }}>{n.title}</div>
                  {!n.is_read && <div style={{ width: 6, height: 6, borderRadius: 3, background: t.green, flexShrink: 0 }} />}
                </div>
                <div style={{ fontSize: 10, color: t.muted, flexShrink: 0 }}>{formatTime(n.created_at)}</div>
              </div>
              <div style={{ fontSize: 12.5, color: t.soft, lineHeight: 1.5 }}>{n.message}</div>
              <div style={{ marginTop: 8, fontSize: 10, color: t.muted, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{n.type === 'coach' ? '🤖 ' + T('notif.coach') : n.type}</span>
                <span onClick={() => deleteOne(n.id)} style={{ cursor: 'pointer', color: t.muted }}>{T('common.delete').toLowerCase()}</span>
              </div>
            </div>
          ))}
          <Btn full variant="outline" onClick={clearAll} style={{ marginTop: 14 }}>{T('notif.clearall')}</Btn>
        </>
      )}
    </Modal>
  );
}

/* ═══════════════════════════ CHECK-IN HISTORY MODAL ═══════════════════════════ */
export function CheckinHistoryModal({ visible, onClose }) {
  const T = useT();
  const { profile } = useApp();
  const checkIns = profile?.data?.checkIns || {};
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current, -1 = last week, etc.

  // Compute the Monday of selected week
  const mondayDate = useMemo(() => {
    const now = new Date();
    const ti = (now.getDay() + 6) % 7; // 0 = Monday
    const monday = new Date(now);
    monday.setDate(now.getDate() - ti + (weekOffset * 7));
    return monday;
  }, [weekOffset]);

  const weekDays = useMemo(() => {
    return WEEK.map((day, i) => {
      const d = new Date(mondayDate);
      d.setDate(mondayDate.getDate() + i);
      const key = fmtKey(d);
      return {
        day, date: d, key, entry: checkIns[key] || null,
        label: d.getDate() + '/' + (d.getMonth() + 1),
      };
    });
  }, [mondayDate, checkIns]);

  const weekStats = useMemo(() => {
    const entries = weekDays.map(d => d.entry).filter(Boolean);
    if (entries.length === 0) return null;
    const avg = (field) => {
      const vals = entries.map(e => parseFloat(e[field])).filter(v => !isNaN(v));
      return vals.length > 0 ? (vals.reduce((s, x) => s + x, 0) / vals.length).toFixed(1) : '—';
    };
    return {
      count: entries.length,
      avgWeight: avg('weight'),
      avgSleep: avg('sleep'),
      avgSteps: avg('steps'),
      avgEnergy: avg('energy'),
      avgRecovery: avg('recovery'),
    };
  }, [weekDays]);

  const weekRangeLabel = `${weekDays[0].label} – ${weekDays[6].label}`;

  return (
    <Modal visible={visible} onClose={onClose} title={T('checkin.history.title')}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, padding: '4px 0' }}>
        <div onClick={() => setWeekOffset(o => o - 1)} style={{ cursor: 'pointer', padding: 8, borderRadius: 10, background: t.glass, border: `1px solid ${t.border}` }}>
          <Icon name="chevL" size={16} color={t.text} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: t.text, fontWeight: 700 }}>{weekRangeLabel}</div>
          <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>
            {weekOffset === 0 ? T('checkin.history.thisweek') : weekOffset === -1 ? T('checkin.history.lastweek') : T('checkin.history.weeksago', { n: Math.abs(weekOffset) })}
          </div>
        </div>
        <div onClick={() => weekOffset < 0 && setWeekOffset(o => o + 1)} style={{
          cursor: weekOffset < 0 ? 'pointer' : 'default',
          padding: 8, borderRadius: 10, background: t.glass, border: `1px solid ${t.border}`,
          opacity: weekOffset < 0 ? 1 : 0.4,
        }}>
          <Icon name="chevR" size={16} color={t.text} />
        </div>
      </div>

      {weekStats && (
        <div style={{ padding: 14, borderRadius: 14, background: t.greenBg, border: `1px solid ${t.greenBorder}`, marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: t.green, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>
            {T('checkin.history.weekavg', { count: weekStats.count })}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            <div><span style={{ color: t.muted, fontSize: 11 }}>{T('checkin.weight')}: </span><b style={{ color: t.text }}>{weekStats.avgWeight}{weekStats.avgWeight !== '—' ? ' kg' : ''}</b></div>
            <div><span style={{ color: t.muted, fontSize: 11 }}>{T('checkin.sleep')}: </span><b style={{ color: t.text }}>{weekStats.avgSleep}{weekStats.avgSleep !== '—' ? 'h' : ''}</b></div>
            <div><span style={{ color: t.muted, fontSize: 11 }}>{T('checkin.steps')}: </span><b style={{ color: t.text }}>{weekStats.avgSteps}</b></div>
            <div><span style={{ color: t.muted, fontSize: 11 }}>{T('checkin.energy')}: </span><b style={{ color: t.text }}>{weekStats.avgEnergy}/10</b></div>
          </div>
        </div>
      )}

      {weekDays.map(d => (
        <div key={d.key} style={{
          padding: 12, borderRadius: 12, marginBottom: 6,
          background: d.entry ? t.card2 : t.glass,
          border: `1px solid ${d.entry ? t.border : 'transparent'}`,
          opacity: d.entry ? 1 : 0.55,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{T('onb.day.' + d.day)} <span style={{ color: t.muted, fontWeight: 500 }}>· {d.label}</span></div>
              {d.entry ? (
                <div style={{ fontSize: 11.5, color: t.soft, marginTop: 4 }}>
                  {d.entry.weight && `${d.entry.weight}kg · `}
                  {d.entry.sleep && `${d.entry.sleep}h sleep · `}
                  {d.entry.energy && `E ${d.entry.energy}/10`}
                </div>
              ) : (
                <div style={{ fontSize: 11, color: t.muted, marginTop: 4 }}>{T('checkin.history.nodata')}</div>
              )}
            </div>
            {d.entry && <Icon name="check" size={16} color={t.green} />}
          </div>
        </div>
      ))}
    </Modal>
  );
}
