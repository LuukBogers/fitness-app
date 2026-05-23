import { useState } from "react";
import { t, supabase } from './lib';
import { Btn, Field } from './shared';

/* ═══════════════════════════ LOADING / CONFIG / AUTH SCREENS ═══════════════════════════ */
export function LoadingScreen() {
  return (
    <div style={{ background: t.bg, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14 }}>
      <div style={{ width: 36, height: 36, borderRadius: 18, border: `3px solid ${t.border}`, borderTopColor: t.green, animation: 'spin 0.8s linear infinite' }} />
      <div style={{ fontSize: 12, color: t.muted, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>Loading</div>
    </div>
  );
}

export function ConfigError() {
  return (
    <div style={{ background: t.bg, height: '100%', padding: '40px 24px', overflowY: 'auto' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>⚙️</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: t.text, marginBottom: 8, letterSpacing: '-0.02em' }}>Setup needed</div>
      <div style={{ fontSize: 14, color: t.soft, marginBottom: 22, lineHeight: 1.5 }}>Connect your Supabase project to enable accounts, login and data persistence.</div>

      <Card style={{ background: t.greenBg, border: `1px solid ${t.greenBorder}`, padding: 16 }}>
        <Label color={t.green}>1 · Create Supabase project</Label>
        <div style={{ fontSize: 13, color: t.soft, lineHeight: 1.5, marginBottom: 10 }}>Go to <span style={{ color: t.green, fontWeight: 600 }}>supabase.com</span> → "New project" (free).</div>
        <Label color={t.green}>2 · Copy URL + anon key</Label>
        <div style={{ fontSize: 13, color: t.soft, lineHeight: 1.5, marginBottom: 10 }}>Dashboard → Settings → API → copy <strong>Project URL</strong> and <strong>anon public key</strong>.</div>
        <Label color={t.green}>3 · Paste into FitnessApp.jsx</Label>
        <div style={{ fontSize: 13, color: t.soft, lineHeight: 1.5, marginBottom: 12 }}>Lines 5-6 — replace the placeholder values.</div>

        <div style={{ background: t.card2, borderRadius: 10, padding: 12, fontFamily: 'monospace', fontSize: 11.5, color: t.text, border: `1px solid ${t.border}`, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
{`const SUPABASE_URL = "https://abc...supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGc...";`}
        </div>
      </Card>

      <Card style={{ padding: 16 }}>
        <Label>4 · Run SQL schema</Label>
        <div style={{ fontSize: 13, color: t.soft, lineHeight: 1.5, marginBottom: 10 }}>Dashboard → SQL Editor → paste the schema (see chat) → Run.</div>
        <Label>5 · Enable providers</Label>
        <div style={{ fontSize: 13, color: t.soft, lineHeight: 1.5 }}>Authentication → Providers → enable Email + Google (OAuth setup steps in chat).</div>
      </Card>

      <div style={{ fontSize: 11, color: t.muted, textAlign: 'center', marginTop: 18, lineHeight: 1.6 }}>
        After saving the file, this screen will be replaced by the Welcome screen automatically.
      </div>
    </div>
  );
}

const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export function AuthFlow() {
  const [view, setView] = useState('welcome'); // welcome | email | otp
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const oauth = async (provider) => {
    setLoading(true); setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (error) { setError(error.message); setLoading(false); }
    // else: browser redirects to Google
  };

  const sendCode = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email address.'); return; }
    setLoading(true); setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setView('otp');
  };

  const verifyCode = async () => {
    if (code.replace(/\D/g, '').length !== 6) { setError('Enter the 6-digit code from your email.'); return; }
    setLoading(true); setError('');
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
    if (error) { setError(error.message); setLoading(false); }
    // onAuthStateChange in App handles success
  };

  if (view === 'welcome') return (
    <div style={{ background: t.bg, height: '100%', display: 'flex', flexDirection: 'column', padding: '60px 24px 28px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -100, left: -100, width: 300, height: 300, background: `radial-gradient(circle, ${t.greenBg}, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -100, right: -100, width: 300, height: 300, background: `radial-gradient(circle, ${t.orangeBg}, transparent 70%)`, pointerEvents: 'none' }} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
        <div style={{
          width: 76, height: 76, borderRadius: 22,
          background: `linear-gradient(135deg, ${t.green}, ${t.orange})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 16px 48px rgba(34,197,94,0.35), 0 8px 28px rgba(249,115,22,0.25)`,
          marginBottom: 28,
        }}>
          <Icon name="flame" size={38} color="#0A0A0B" stroke={2.2} />
        </div>
        <div style={{ fontSize: 34, fontWeight: 800, color: t.text, letterSpacing: '-0.03em', marginBottom: 10 }}>Welcome</div>
        <div style={{ fontSize: 15, color: t.soft, textAlign: 'center', lineHeight: 1.5, maxWidth: 280 }}>Your structured coach for nutrition and training.</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, position: 'relative' }}>
        <button onClick={() => oauth('google')} disabled={loading} style={{
          background: '#fff', color: '#1F1F1F', border: 'none', borderRadius: 14,
          padding: '14px 20px', fontSize: 15, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          fontFamily: 'inherit', opacity: loading ? 0.6 : 1,
        }}>
          <GoogleLogo /> Continue with Google
        </button>
        <button onClick={() => { setView('email'); setError(''); }} disabled={loading} style={{
          background: t.green, color: '#0A0A0B', border: 'none', borderRadius: 14,
          padding: '14px 20px', fontSize: 15, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'inherit', opacity: loading ? 0.6 : 1,
        }}>
          Continue with Email
        </button>

        {error && <div style={{ fontSize: 12, color: '#FCA5A5', textAlign: 'center', padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: 10 }}>{error}</div>}

        <div style={{ fontSize: 11, color: t.muted, textAlign: 'center', marginTop: 14, lineHeight: 1.6 }}>
          🔒 Privacy-first. Your data stays yours.<br />
          By continuing you agree to our Terms.
        </div>
      </div>
    </div>
  );

  if (view === 'email') return (
    <div style={{ background: t.bg, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 20px 0' }}>
        <div onClick={() => { setView('welcome'); setError(''); }} style={{ display: 'flex', alignItems: 'center', gap: 6, color: t.soft, cursor: 'pointer', padding: 4, marginLeft: -4 }}>
          <Icon name="chevL" size={20} /> <span style={{ fontSize: 14 }}>Back</span>
        </div>
      </div>

      <div style={{ flex: 1, padding: '32px 24px', overflowY: 'auto' }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: t.text, letterSpacing: '-0.02em', marginBottom: 8 }}>What's your email?</div>
        <div style={{ fontSize: 14, color: t.soft, marginBottom: 28, lineHeight: 1.5 }}>We'll send you a 6-digit code. No password needed.</div>

        <input
          type="email" inputMode="email" autoCapitalize="none" autoComplete="email"
          value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
          placeholder="you@example.com" autoFocus
          style={{ width: '100%', padding: '15px 16px', borderRadius: 14, border: `1px solid ${t.border}`, fontSize: 16, color: t.text, background: t.card2, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 14 }}
        />
        {error && <div style={{ fontSize: 12.5, color: '#FCA5A5', padding: '10px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: 10, marginBottom: 14 }}>{error}</div>}
      </div>

      <div style={{ padding: '16px 20px', borderTop: `1px solid ${t.border}` }}>
        <Btn full onClick={sendCode} style={{ opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Sending...' : 'Send code →'}
        </Btn>
      </div>
    </div>
  );

  // OTP view
  return (
    <div style={{ background: t.bg, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 20px 0' }}>
        <div onClick={() => { setView('email'); setError(''); setCode(''); }} style={{ display: 'flex', alignItems: 'center', gap: 6, color: t.soft, cursor: 'pointer', padding: 4, marginLeft: -4 }}>
          <Icon name="chevL" size={20} /> <span style={{ fontSize: 14 }}>Back</span>
        </div>
      </div>

      <div style={{ flex: 1, padding: '32px 24px', overflowY: 'auto' }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: t.text, letterSpacing: '-0.02em', marginBottom: 8 }}>Check your email</div>
        <div style={{ fontSize: 14, color: t.soft, marginBottom: 6, lineHeight: 1.5 }}>We sent a 6-digit code to</div>
        <div style={{ fontSize: 14, color: t.green, fontWeight: 600, marginBottom: 28 }}>{email}</div>

        <input
          type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6}
          value={code} onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
          placeholder="000000" autoFocus
          style={{ width: '100%', padding: '18px 16px', borderRadius: 14, border: `1px solid ${t.border}`, fontSize: 28, color: t.text, background: t.card2, outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '0.4em', fontWeight: 700, marginBottom: 14 }}
        />
        {error && <div style={{ fontSize: 12.5, color: '#FCA5A5', padding: '10px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: 10, marginBottom: 14 }}>{error}</div>}

        <div onClick={sendCode} style={{ fontSize: 13, color: t.green, fontWeight: 600, cursor: 'pointer', textAlign: 'center', padding: 8 }}>
          Didn't get it? Resend code
        </div>
      </div>

      <div style={{ padding: '16px 20px', borderTop: `1px solid ${t.border}` }}>
        <Btn full onClick={verifyCode} style={{ opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Verifying...' : 'Verify & continue →'}
        </Btn>
      </div>
    </div>
  );
}
