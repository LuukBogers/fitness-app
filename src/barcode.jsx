import { useState, useEffect, useRef } from "react";
import { t, useT } from './lib';
import { Icon, Btn, Modal, Field, Label } from './shared';

/* ═══════════════════════════ BARCODE SCANNER ═══════════════════════════ */
// Loads ZXing-js dynamically (no npm install needed). Works iOS Safari + Android Chrome.
let _zxingPromise = null;
const loadZXing = () => {
  if (window.ZXingBrowser) return Promise.resolve(window.ZXingBrowser);
  if (_zxingPromise) return _zxingPromise;
  _zxingPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/@zxing/browser@0.1.5/umd/zxing-browser.min.js';
    s.async = true;
    s.onload = () => resolve(window.ZXingBrowser);
    s.onerror = () => { _zxingPromise = null; reject(new Error('Failed to load scanner library')); };
    document.head.appendChild(s);
  });
  return _zxingPromise;
};

export function BarcodeScanner({ visible, onClose, onResult }) {
  const T = useT();
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const [status, setStatus] = useState('init'); // init | loading | scanning | denied | error
  const [errMsg, setErrMsg] = useState('');
  const [manual, setManual] = useState('');
  const [showManual, setShowManual] = useState(false);

  // Hard-stop the active camera stream + ZXing controls.
  // Without this, on some browsers the <video> element keeps its (now-frozen)
  // last frame or shows a default blue background, leaving the UI stuck.
  const stopStream = () => {
    try { controlsRef.current?.stop(); } catch(e) {}
    controlsRef.current = null;
    try {
      const v = videoRef.current;
      if (v) {
        const s = v.srcObject;
        if (s && s.getTracks) s.getTracks().forEach(tr => { try { tr.stop(); } catch(e) {} });
        v.srcObject = null;
        v.pause?.();
        v.removeAttribute('src');
        v.load?.();
      }
    } catch(e) {}
  };

  useEffect(() => {
    if (!visible) {
      stopStream();
      setStatus('init'); setErrMsg(''); setShowManual(false); setManual('');
      return;
    }

    let cancelled = false;
    const start = async () => {
      try {
        setStatus('loading');
        const ZX = await loadZXing();
        if (cancelled) return;
        setStatus('scanning');

        const reader = new ZX.BrowserMultiFormatReader();
        const constraints = { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } };

        const controls = await reader.decodeFromConstraints(
          constraints,
          videoRef.current,
          (result, err, ctrls) => {
            if (cancelled) { try { ctrls?.stop(); } catch(e) {} return; }
            if (result) {
              const code = result.getText();
              try { navigator.vibrate?.(80); } catch(e) {}
              // Stop EVERYTHING before bubbling up so the modal opens on a clean screen
              stopStream();
              // Defer to next tick so React unmounts the video before parent flips state
              setTimeout(() => { try { onResult(code); } catch(e) {} }, 0);
            }
          }
        );
        controlsRef.current = controls;
      } catch (e) {
        if (cancelled) return;
        if (e.name === 'NotAllowedError' || /permission/i.test(e.message)) setStatus('denied');
        else { setStatus('error'); setErrMsg(e.message || String(e)); }
      }
    };
    start();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [visible, onResult]);

  if (!visible) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000', zIndex: 200, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <video ref={videoRef} autoPlay playsInline muted style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />

      {/* Top bar */}
      <div style={{ position: 'relative', zIndex: 3, padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(180deg, rgba(0,0,0,0.65), transparent)' }}>
        <div>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{T('scan.title')}</div>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 2 }}>{T('scan.formats')}</div>
        </div>
        <div onClick={onClose} style={{ width: 38, height: 38, borderRadius: 19, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.15)' }}>
          <Icon name="x" size={18} color="#fff" />
        </div>
      </div>

      {/* Viewfinder */}
      <div style={{ flex: 1, position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: '78%', maxWidth: 300, height: 180, position: 'relative', zIndex: 2,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)', borderRadius: 16,
        }}>
          {/* Corner brackets */}
          {[
            { top: -2, left: -2, borderTop: `3px solid ${t.green}`, borderLeft: `3px solid ${t.green}`, borderTopLeftRadius: 14 },
            { top: -2, right: -2, borderTop: `3px solid ${t.green}`, borderRight: `3px solid ${t.green}`, borderTopRightRadius: 14 },
            { bottom: -2, left: -2, borderBottom: `3px solid ${t.green}`, borderLeft: `3px solid ${t.green}`, borderBottomLeftRadius: 14 },
            { bottom: -2, right: -2, borderBottom: `3px solid ${t.green}`, borderRight: `3px solid ${t.green}`, borderBottomRightRadius: 14 },
          ].map((s, i) => <div key={i} style={{ position: 'absolute', width: 30, height: 30, ...s }} />)}
          {status === 'scanning' && (
            <div style={{ position: 'absolute', left: 8, right: 8, top: '50%', height: 2, background: `linear-gradient(90deg, transparent, ${t.green}, transparent)`, animation: 'scanline 2s ease-in-out infinite', boxShadow: `0 0 10px ${t.green}` }} />
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ position: 'relative', zIndex: 3, padding: '18px 18px 32px', background: 'linear-gradient(0deg, rgba(0,0,0,0.75), transparent)' }}>
        {status === 'loading' && (
          <div style={{ textAlign: 'center', color: '#fff', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <div style={{ width: 16, height: 16, borderRadius: 8, border: `2px solid rgba(255,255,255,0.3)`, borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
            {T('scan.loading')}
          </div>
        )}
        {status === 'scanning' && !showManual && (
          <>
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.9)', fontSize: 13, marginBottom: 14 }}>{T('scan.point')}</div>
            <div onClick={() => setShowManual(true)} style={{ textAlign: 'center', color: t.green, fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '8px 14px' }}>
              {T('scan.enterManual')}
            </div>
          </>
        )}
        {showManual && (
          <div style={{ background: 'rgba(0,0,0,0.7)', borderRadius: 14, padding: 14, border: '1px solid rgba(255,255,255,0.15)' }}>
            <div style={{ color: '#fff', fontSize: 13, marginBottom: 8, fontWeight: 600 }}>{T('scan.enterbarcode')}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text" inputMode="numeric" value={manual} onChange={e => setManual(e.target.value.replace(/\D/g, ''))}
                placeholder={T('scan.ph.barcode')} autoFocus
                style={{ flex: 1, padding: '11px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', fontSize: 14, color: '#fff', background: 'rgba(255,255,255,0.08)', outline: 'none', fontFamily: 'monospace' }}
              />
              <Btn small onClick={() => { if (manual.length >= 6) { onResult(manual); setShowManual(false); } }}>{T('scan.go')}</Btn>
            </div>
          </div>
        )}
        {status === 'denied' && (
          <div style={{ textAlign: 'center', color: '#FCA5A5', fontSize: 13, padding: '12px 14px', background: 'rgba(239,68,68,0.2)', borderRadius: 12, border: '1px solid rgba(239,68,68,0.3)', lineHeight: 1.5 }}>
            {T('scan.denied')}
          </div>
        )}
        {status === 'error' && (
          <div style={{ textAlign: 'center', color: '#FCA5A5', fontSize: 13, padding: '12px 14px', background: 'rgba(239,68,68,0.15)', borderRadius: 12, lineHeight: 1.5 }}>
            {errMsg || T('scan.errfallback')}
            <div onClick={() => setShowManual(true)} style={{ color: '#fff', marginTop: 8, fontWeight: 600, cursor: 'pointer' }}>{T('scan.entermanualarrow')}</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════ SCANNED PRODUCT MODAL ═══════════════════════════ */
// Looks up the barcode in Open Food Facts (free, no API key, ~3M products worldwide)
async function lookupBarcode(barcode) {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=product_name,product_name_en,brands,image_front_url,image_url,nutriments,quantity`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Network error');
  const data = await res.json();
  if (data.status !== 1 || !data.product) return null;
  const p = data.product;
  const n = p.nutriments || {};
  let kcal = n['energy-kcal_100g'];
  if (kcal == null && n['energy_100g']) kcal = n['energy_100g'] / 4.184;
  return {
    barcode,
    name: p.product_name || p.product_name_en || 'Unknown product',
    brand: Array.isArray(p.brands) ? (p.brands[0] || '') : (p.brands || ''),
    image: p.image_front_url || p.image_url || null,
    quantity: p.quantity || '',
    kcal: Math.round(kcal || 0),
    protein: Math.round((n.proteins_100g || 0) * 10) / 10,
    carbs: Math.round((n.carbohydrates_100g || 0) * 10) / 10,
    fat: Math.round((n.fat_100g || 0) * 10) / 10,
  };
}

export function ScannedProductModal({ barcode, onClose, onSave }) {
  const T = useT();
  const visible = barcode !== null && barcode !== undefined;
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [grams, setGrams] = useState(100);

  useEffect(() => {
    if (!visible) { setProduct(null); setNotFound(false); setGrams(100); return; }
    let cancelled = false;
    setLoading(true); setNotFound(false); setProduct(null);
    lookupBarcode(barcode)
      .then(p => { if (cancelled) return; if (p) setProduct(p); else setNotFound(true); })
      .catch(() => { if (!cancelled) setNotFound(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [visible, barcode]);

  const tKcal = product ? Math.round((product.kcal * grams) / 100) : 0;
  const tP = product ? Math.round((product.protein * grams) / 10) / 10 : 0;
  const tC = product ? Math.round((product.carbs * grams) / 10) / 10 : 0;
  const tF = product ? Math.round((product.fat * grams) / 10) / 10 : 0;

  return (
    <Modal visible={visible} onClose={onClose} title={loading ? T('scan.lookup') : product ? T('scan.productfound') : T('scan.notfound')}>
      {loading && (
        <div style={{ padding: '32px 0', textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, borderRadius: 16, border: `3px solid ${t.border}`, borderTopColor: t.green, margin: '0 auto', animation: 'spin 0.8s linear infinite' }} />
          <div style={{ marginTop: 16, fontSize: 13, color: t.soft }}>{T('scan.barcode')}</div>
          <div style={{ fontSize: 14, color: t.text, fontFamily: 'monospace', marginTop: 2 }}>{barcode}</div>
        </div>
      )}

      {notFound && !loading && (
        <>
          <div style={{ padding: '24px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: t.text, marginBottom: 6 }}>{T('scan.notindb')}</div>
            <div style={{ fontSize: 12.5, color: t.soft }}>{T('scan.notindbbody', { barcode })}</div>
          </div>
          <Btn full style={{ marginBottom: 8 }} onClick={() => { onSave({ barcode, manual: true, action: 'addManual' }); onClose(); }}>{T('scan.addmanually')}</Btn>
          <Btn full variant="outline" onClick={onClose}>{T('common.cancel')}</Btn>
        </>
      )}

      {product && !loading && (
        <>
          {/* Header */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 18, padding: 14, background: t.card2, borderRadius: 16, border: `1px solid ${t.border}` }}>
            {product.image ? (
              <img src={product.image} alt="" style={{ width: 68, height: 68, borderRadius: 12, objectFit: 'cover', background: '#fff', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 68, height: 68, borderRadius: 12, background: t.card3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>📦</div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: t.text, lineHeight: 1.3, marginBottom: 3, wordBreak: 'break-word' }}>{product.name}</div>
              {product.brand && <div style={{ fontSize: 12, color: t.soft, marginBottom: 4 }}>{product.brand}</div>}
              <div style={{ fontSize: 10, color: t.muted, fontFamily: 'monospace', display: 'inline-block', padding: '2px 6px', background: t.card3, borderRadius: 5 }}>{product.barcode}</div>
            </div>
          </div>

          {/* Per 100g */}
          <Label>{T('scan.nutr100g')}</Label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 18 }}>
            {[
              { l: 'kcal', v: product.kcal, c: t.green },
              { l: 'protein', v: product.protein + 'g', c: t.protein },
              { l: 'carbs', v: product.carbs + 'g', c: t.carbs },
              { l: 'fat', v: product.fat + 'g', c: t.fat },
            ].map(m => (
              <div key={m.l} style={{ background: t.card2, borderRadius: 10, padding: 10, textAlign: 'center', border: `1px solid ${t.border}` }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: m.c }}>{m.v}</div>
                <div style={{ fontSize: 9.5, color: t.muted, fontWeight: 700, marginTop: 2, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{m.l}</div>
              </div>
            ))}
          </div>

          {/* Quantity */}
          <Label>{T('scan.howmuch')}</Label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'stretch', marginBottom: 14 }}>
            <div onClick={() => setGrams(Math.max(0, grams - 10))} style={{ width: 44, background: t.card2, borderRadius: 12, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: t.text, fontSize: 18, fontWeight: 700 }}>−</div>
            <div style={{ flex: 1, position: 'relative' }}>
              <input type="number" inputMode="numeric" value={grams} onChange={e => setGrams(parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '12px 14px', paddingRight: 50, borderRadius: 12, border: `1px solid ${t.border}`, fontSize: 16, color: t.text, background: t.card2, outline: 'none', fontFamily: 'inherit', textAlign: 'center', fontWeight: 700, boxSizing: 'border-box' }} />
              <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: t.muted, fontSize: 13, fontWeight: 600 }}>g</span>
            </div>
            <div onClick={() => setGrams(grams + 10)} style={{ width: 44, background: t.card2, borderRadius: 12, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: t.text, fontSize: 18, fontWeight: 700 }}>+</div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
            {[50, 100, 150, 200].map(q => (
              <div key={q} onClick={() => setGrams(q)} style={{ flex: 1, padding: '8px', textAlign: 'center', borderRadius: 9, background: grams === q ? t.greenBg : t.card2, color: grams === q ? t.green : t.soft, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1px solid ${grams === q ? t.greenBorder : t.border}` }}>{q}g</div>
            ))}
          </div>

          {/* Total */}
          <div style={{ background: t.greenBg, borderRadius: 16, padding: 16, marginBottom: 16, border: `1px solid ${t.greenBorder}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <Label color={t.green} style={{ marginBottom: 0 }}>{T('scan.youlllog')}</Label>
              <div><span style={{ fontSize: 26, fontWeight: 800, color: t.green, letterSpacing: '-0.02em' }}>{tKcal}</span><span style={{ fontSize: 11, color: t.soft, marginLeft: 4 }}>kcal</span></div>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12.5 }}>
              <span><span style={{ color: t.protein, fontWeight: 700 }}>{tP}g</span> <span style={{ color: t.muted }}>P</span></span>
              <span><span style={{ color: t.carbs, fontWeight: 700 }}>{tC}g</span> <span style={{ color: t.muted }}>C</span></span>
              <span><span style={{ color: t.fat, fontWeight: 700 }}>{tF}g</span> <span style={{ color: t.muted }}>F</span></span>
            </div>
          </div>

          <Btn full style={{ marginBottom: 8 }} onClick={() => { onSave({ ...product, grams, totalKcal: tKcal, totalP: tP, totalC: tC, totalF: tF, action: 'log' }); onClose(); }}>{T('scan.logtoday')}</Btn>
          <Btn full variant="ghost" onClick={() => { onSave({ ...product, action: 'save' }); onClose(); }}>{T('scan.savetoproducts')}</Btn>
        </>
      )}
    </Modal>
  );
}
