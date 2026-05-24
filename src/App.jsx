import { useState, useEffect, useRef } from "react";
import { supabase, isConfigured, AppContext, LangContext, t, todayKey, detectLang } from './lib';
import { LoadingScreen, ConfigError, AuthFlow } from './auth';
import { Onboarding } from './onboarding';
import { Home } from './home';
import { CheckIn } from './checkin';
import { Nutrition } from './nutrition';
import { Workouts } from './workouts';
import { Settings } from './settings';
import { BottomNav } from './nav';

/* ═══════════════════════════ SWIPE-TO-CHANGE-TAB ═══════════════════════════
 * Horizontal swipe between Home / Nutrition / Workouts / Settings.
 * Native-feeling iOS/Android pattern. Ignores swipes that:
 *  - start inside a horizontal scroll container (chip rows, week strips, etc.)
 *  - are mostly vertical (regular scroll)
 *  - are too short (< 60px) or too slow (> 600ms)
 */
const TABS_ORDER = ['home', 'nutrition', 'workouts', 'settings'];
function SwipeTabs({ tab, setTab, children }) {
  const touch = useRef({ x: 0, y: 0, t: 0, valid: false });

  const isInsideHorizontalScroller = (node) => {
    let el = node;
    while (el && el.nodeType === 1) {
      const cs = window.getComputedStyle ? window.getComputedStyle(el) : null;
      if (cs) {
        const ox = cs.overflowX;
        if ((ox === 'auto' || ox === 'scroll') && el.scrollWidth > el.clientWidth + 1) return true;
      }
      if (el.dataset && el.dataset.noSwipe === 'true') return true;
      el = el.parentElement;
    }
    return false;
  };

  const onTouchStart = (e) => {
    if (e.touches.length !== 1) { touch.current.valid = false; return; }
    if (isInsideHorizontalScroller(e.target)) { touch.current.valid = false; return; }
    const tch = e.touches[0];
    touch.current = { x: tch.clientX, y: tch.clientY, t: Date.now(), valid: true };
  };

  const onTouchEnd = (e) => {
    if (!touch.current.valid) return;
    const tch = (e.changedTouches && e.changedTouches[0]) || null;
    if (!tch) return;
    const dx = tch.clientX - touch.current.x;
    const dy = tch.clientY - touch.current.y;
    const dt = Date.now() - touch.current.t;
    touch.current.valid = false;
    // Require: > 60px horizontal, mostly-horizontal (|dx| > 1.6 * |dy|), < 600ms
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.6 || dt > 600) return;
    const i = TABS_ORDER.indexOf(tab);
    if (i === -1) return;
    if (dx > 0 && i > 0) setTab(TABS_ORDER[i - 1]);                        // swipe right → previous tab
    else if (dx < 0 && i < TABS_ORDER.length - 1) setTab(TABS_ORDER[i + 1]); // swipe left → next tab
  };

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {children}
    </div>
  );
}

/* ═══════════════════════════ MAIN APP ═══════════════════════════ */
export default function App() {
  const [phase, setPhase] = useState('loading'); // loading | config | auth | onboarding | main
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState('home');
  const [showCheckIn, setShowCheckIn] = useState(false);
  // Language: start with localStorage → browser detect → en
  const [lang, setLangState] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('app.lang');
      if (stored) return stored;
    }
    return detectLang();
  });

  // Sets language + persists to localStorage immediately (profile sync via useEffect below)
  const setLang = (newLang) => {
    setLangState(newLang);
    if (typeof window !== 'undefined') window.localStorage.setItem('app.lang', newLang);
  };

  // Load font + animations
  useEffect(() => {
    document.title = 'Fitness app';
    let favicon = document.querySelector("link[rel='icon']");
    if (!favicon) { favicon = document.createElement('link'); favicon.rel = 'icon'; document.head.appendChild(favicon); }
    favicon.href = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%94%A5%3C/text%3E%3C/svg%3E";

    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
      @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
      @keyframes scanline { 0%, 100% { transform: translateY(-70px); opacity: 0.4 } 50% { transform: translateY(70px); opacity: 1 } }
      @keyframes spin { to { transform: rotate(360deg) } }
      @keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.5 } }
      ::-webkit-scrollbar { display: none }
      input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
      input[type=number] { -moz-appearance: textfield; }
      button:disabled { cursor: not-allowed }
    `;
    document.head.appendChild(styleEl);
    return () => { try { document.head.removeChild(link); document.head.removeChild(styleEl); } catch(e) {} };
  }, []);

  // Session bootstrap + listener
  useEffect(() => {
    if (!isConfigured()) { setPhase('config'); return; }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setPhase('auth');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sess) => {
      setSession(sess);
      if (!sess) { setProfile(null); setPhase('auth'); }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load profile when session is available
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) console.error('Profile load error:', error);

      if (!data || !data.onboarded) {
        setProfile(data || null);
        setPhase('onboarding');
      } else {
        setProfile(data);
        // Restore language from profile if set
        if (data.data?.language) {
          setLangState(data.data.language);
          if (typeof window !== 'undefined') window.localStorage.setItem('app.lang', data.data.language);
        }
        setPhase('main');
      }
    })();
    return () => { cancelled = true; };
  }, [session]);

  // Sync language changes to profile.data
  useEffect(() => {
    if (!session || !profile) return;
    if (profile.data?.language === lang) return;
    (async () => {
      const merged = { ...(profile.data || {}), language: lang };
      await supabase.from('profiles').update({ data: merged, updated_at: new Date().toISOString() }).eq('id', session.user.id);
      setProfile(p => ({ ...p, data: merged }));
    })();
  }, [lang, session, profile?.id]);

  const completeOnboarding = async (onboardingData) => {
    const age = parseInt(onboardingData.age) || 28;
    const h = parseInt(onboardingData.height) || 175;
    const w = parseFloat(onboardingData.weight) || 75;
    const bmr = onboardingData.gender === 'female'
      ? Math.round(10 * w + 6.25 * h - 5 * age - 161)
      : Math.round(10 * w + 6.25 * h - 5 * age + 5);
    const mult = { Low: 1.2, Average: 1.375, High: 1.55, 'Very high': 1.725 }[onboardingData.activity] || 1.375;
    const maint = Math.round(bmr * mult);
    const deficit = onboardingData.goal === 'Cutting' ? 500 : onboardingData.goal === 'Fat loss' ? 300 : 0;
    const calories = maint - deficit;
    const protein = Math.round(w * (onboardingData.goalDetail === 'Mini cut' ? 2.5 : onboardingData.goal === 'Cutting' ? 2.4 : 2.2));
    const fat = Math.round(w * 0.7);
    const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));

    const fullData = {
      ...onboardingData,
      language: lang,
      calories, protein, carbs, fat,
      streak: 0,
      weights: w ? [{ date: todayKey(), weight: w }] : [],
      checkIns: {}, meals: {},
      products: [], recipes: [], concepts: [],
      workouts: [], workoutPlan: {}, workoutLog: {},
    };

    const update = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || (session.user.email?.split('@')[0]) || 'You',
      data: fullData,
      onboarded: true,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('profiles').upsert(update);
    if (error) { console.error(error); alert('Save failed: ' + error.message); return; }
    setProfile(update);
    setPhase('main');
  };

  const saveProfileData = async (patch) => {
    if (!session || !profile) return;
    const merged = { ...(profile.data || {}), ...patch };
    const { error } = await supabase
      .from('profiles')
      .update({ data: merged, updated_at: new Date().toISOString() })
      .eq('id', session.user.id);
    if (error) { console.error(error); return; }
    setProfile(p => ({ ...p, data: merged }));
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setTab('home');
  };

  const phoneStyle = {
    width: '100%', maxWidth: 430, height: '100vh', maxHeight: 920,
    margin: '0 auto', background: t.bg, color: t.text,
    fontFamily: '"DM Sans", -apple-system, system-ui, sans-serif',
    position: 'relative', overflow: 'hidden',
    boxShadow: '0 0 80px rgba(0,0,0,0.5)',
    display: 'flex', flexDirection: 'column',
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundImage: `radial-gradient(circle at 20% 20%, rgba(34,197,94,0.06), transparent 50%), radial-gradient(circle at 80% 80%, rgba(249,115,22,0.06), transparent 50%)`,
    }}>
      <div style={phoneStyle}>
        <LangContext.Provider value={{ lang, setLang }}>
          <AppContext.Provider value={{ session, profile, signOut, saveProfileData }}>
            {phase === 'loading' && <LoadingScreen />}
            {phase === 'config' && <ConfigError />}
            {phase === 'auth' && <AuthFlow />}
            {phase === 'onboarding' && <Onboarding onComplete={completeOnboarding} />}
            {phase === 'main' && (
              <SwipeTabs tab={tab} setTab={setTab}>
                <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                  {tab === 'home' && <Home onOpenCheckIn={() => setShowCheckIn(true)} />}
                  {tab === 'nutrition' && <Nutrition />}
                  {tab === 'workouts' && <Workouts />}
                  {tab === 'settings' && <Settings />}
                </div>
                <BottomNav tab={tab} setTab={setTab} />
                <CheckIn visible={showCheckIn} onClose={() => setShowCheckIn(false)} />
              </SwipeTabs>
            )}
          </AppContext.Provider>
        </LangContext.Provider>
      </div>
    </div>
  );
}
