import { useState } from "react";
import { t, STATUS, WEEK, SLOTS, useApp, useT, useLang, todayIdx, weekDates, todayKey, monthName, monthShort, weekDayShort, slotKey, fmtKey, dayStatus } from './lib';
import { Icon, Card, Label, Btn, Chip, Modal } from './shared';
import { CreateProductModal, CreateRecipeModal, CreateConceptModal, Toast } from './modals';
import { BarcodeScanner, ScannedProductModal } from './barcode';

/* ═══════════════════════════ NUTRITION ═══════════════════════════ */
export function Nutrition() {
  const T = useT();
  const { lang } = useLang();
  const { profile, saveProfileData } = useApp();
  const d = profile?.data || {};
  const products = Array.isArray(d.products) ? d.products : [];
  const recipes = Array.isArray(d.recipes) ? d.recipes : [];
  const concepts = Array.isArray(d.concepts) ? d.concepts : [];
  const meals = d.meals || {};
  const calories = d.calories || 0;

  const ti = todayIdx();
  const dates = weekDates();
  const tKey = todayKey();

  const [sub, setSub] = useState('week'); // week | products | recipes | groceries | concepts
  const [selectedDay, setSelectedDay] = useState(ti);
  const [showMealOptions, setShowMealOptions] = useState(null); // index in slotMeals
  const [showLockedDeviate, setShowLockedDeviate] = useState(false);
  const [grocMode, setGrocMode] = useState('smart');
  const [showScanner, setShowScanner] = useState(false);
  const [scannedCode, setScannedCode] = useState(null);
  const [toast, setToast] = useState('');

  // Create modals
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [productPrefill, setProductPrefill] = useState(null);
  const [showCreateRecipe, setShowCreateRecipe] = useState(false);
  const [conceptType, setConceptType] = useState(null); // 'day' | 'week' | null

  // Selected day key
  const selDate = (() => { const dt = new Date(); dt.setDate(dt.getDate() - ti + selectedDay); return fmtKey(dt); })();
  const selDayName = WEEK[selectedDay];
  const selMeals = meals[selDate] || SLOTS.map(slot => ({ slot, items: [], kcal: 0, p:0, c:0, f:0, locked: false, eaten: false }));
  // Ensure all 6 slots exist
  const slotMeals = SLOTS.map(slot => selMeals.find(m => m.slot === slot) || { slot, items: [], kcal: 0, p:0, c:0, f:0, locked: false, eaten: false });
  const todayEaten = slotMeals.reduce((s, m) => s + (m.eaten ? m.kcal : 0), 0);

  // Day status colors for week strip
  const dayStatuses = WEEK.map((_, i) => {
    const dt = new Date(); dt.setDate(dt.getDate() - ti + i);
    return dayStatus(fmtKey(dt), meals, calories);
  });

  // Smart groceries derived from recipes assigned to meals this week
  const groceriesByShelf = (() => {
    const byProduct = new Map();
    Object.values(meals).forEach(dayList => {
      (dayList || []).forEach(m => {
        (m.itemsFull || []).forEach(it => {
          const cur = byProduct.get(it.productId) || { grams: 0, name: it.name, store: it.store, shelf: it.shelf };
          cur.grams += it.grams || 0;
          byProduct.set(it.productId, cur);
        });
      });
    });
    const result = { shelf: [], refrigerated: [], fresh: [] };
    byProduct.forEach(v => {
      result[v.shelf || 'shelf'].push({ name: v.name, amt: `${Math.round(v.grams)}g`, store: v.store });
    });
    return result;
  })();
  const hasGroceries = Object.values(groceriesByShelf).some(arr => arr.length > 0);

  // Handlers
  const handleScanResult = (code) => { setShowScanner(false); setScannedCode(code); };
  const handleProductSave = async (p) => {
    if (p.action === 'log') {
      // Log to today's meals as a quick scanned item
      const item = { name: p.name, grams: p.grams, kcal: p.totalKcal, p: p.totalP || 0, c: p.totalC || 0, f: p.totalF || 0 };
      const dayMeals = meals[tKey] || SLOTS.map(s => ({ slot: s, items: [], kcal: 0, p:0, c:0, f:0, locked: false, eaten: false }));
      const updated = dayMeals.map((m, i) => i === 1 ? {
        ...m, items: [...(m.items||[]), `${item.name} ${item.grams}g`],
        kcal: (m.kcal||0) + item.kcal, p: (m.p||0) + item.p, c: (m.c||0) + item.c, f: (m.f||0) + item.f,
        eaten: true,
      } : m);
      await saveProfileData({ meals: { ...meals, [tKey]: updated } });
      setToast(T('scan.toast.logged', { kcal: p.totalKcal, name: p.name }));
    } else if (p.action === 'save') {
      setProductPrefill({
        name: p.name, brand: p.brand || '', store: 'AH', shelf: 'shelf',
        kcal: p.kcal, p: p.p, c: p.c, f: p.f, image: p.image,
      });
      setShowCreateProduct(true);
    } else if (p.action === 'addManual') {
      setProductPrefill(null);
      setShowCreateProduct(true);
      setToast(T('scan.toast.addmanual', { barcode: p.barcode }));
    }
    setScannedCode(null);
    setTimeout(() => setToast(''), 2800);
  };

  const saveProduct = async (newProduct) => {
    const newList = [...products, newProduct];
    await saveProfileData({ products: newList });
    setShowCreateProduct(false); setProductPrefill(null);
    setToast(T('scan.toast.saved', { name: newProduct.name }));
    setTimeout(() => setToast(''), 2200);
  };

  const saveRecipe = async (newRecipe) => {
    const newList = [...recipes, newRecipe];
    await saveProfileData({ recipes: newList });
    setShowCreateRecipe(false);
    setToast(T('scan.toast.recipesaved', { name: newRecipe.name }));
    setTimeout(() => setToast(''), 2200);
  };

  const saveConcept = async (newConcept) => {
    const newList = [...concepts, newConcept];
    await saveProfileData({ concepts: newList });
    setConceptType(null);
    setToast(T('scan.toast.conceptsaved', { name: newConcept.name }));
    setTimeout(() => setToast(''), 2200);
  };

  const tabs = [
    { k: 'week', l: T('nutr.tab.planning') },
    { k: 'recipes', l: T('nutr.tab.recipes') },
    { k: 'products', l: T('nutr.tab.products') },
    { k: 'groceries', l: T('nutr.tab.groceries') },
    { k: 'concepts', l: T('nutr.tab.concepts') },
  ];

  // + button context-aware: opens correct create flow per sub-tab
  const handlePlus = () => {
    if (sub === 'products') { setProductPrefill(null); setShowCreateProduct(true); }
    else if (sub === 'recipes') setShowCreateRecipe(true);
    else if (sub === 'concepts') setConceptType('day');
    else { setProductPrefill(null); setShowCreateProduct(true); }
  };

  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <Label color={t.green}>{T('nutr.title')}</Label>
            <div style={{ fontSize: 24, fontWeight: 800, color: t.text, letterSpacing: '-0.02em' }}>{T('nutr.thisweek')}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div onClick={() => setShowScanner(true)} style={{ width: 40, height: 40, borderRadius: 12, background: t.card2, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${t.border}`, cursor: 'pointer' }}>
              <Icon name="scan" size={18} color={t.text} />
            </div>
            <div onClick={handlePlus} style={{ width: 40, height: 40, borderRadius: 12, background: t.greenBg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${t.greenBorder}`, cursor: 'pointer' }}>
              <Icon name="plus" size={20} color={t.green} />
            </div>
          </div>
        </div>
        
        {/* Sub-tabs */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 14, paddingBottom: 4 }}>
          {tabs.map(tb => (
            <Chip key={tb.k} active={sub === tb.k} onClick={() => setSub(tb.k)}>
              <span style={{ padding: '2px 0' }}>{tb.l}</span>
            </Chip>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {sub === 'week' && (
          <>
            {/* Week strip */}
            <Card style={{ padding: 14 }}>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between' }}>
                {WEEK.map((day, i) => {
                  const sc = STATUS[dayStatuses[i]];
                  const isSel = i === selectedDay;
                  return (
                    <div key={day} onClick={() => setSelectedDay(i)} style={{
                      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                      padding: 8, borderRadius: 12, cursor: 'pointer',
                      background: isSel ? t.card3 : 'transparent',
                      border: `1px solid ${isSel ? t.border : 'transparent'}`,
                    }}>
                      <div style={{ fontSize: 9, color: t.muted, fontWeight: 700, letterSpacing: '0.05em' }}>{weekDayShort(lang, i)}</div>
                      <div style={{ fontSize: 14, color: t.text, fontWeight: 700 }}>{dates[i]}</div>
                      <div style={{ width: 24, height: 4, borderRadius: 2, background: sc.dot, opacity: dayStatuses[i] === 'gray' ? 0.4 : 1 }} />
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTop: `1px solid ${t.border}`, fontSize: 11, color: t.muted }}>
                <div>{T('nutr.target')} {calories || '—'} kcal</div>
                <div style={{ display: 'flex', gap: 10, fontSize: 10 }}>
                  {['green','yellow','orange','red'].map(s => (
                    <div key={s} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <div style={{ width: 6, height: 6, borderRadius: 3, background: STATUS[s].dot }} />
                      <span style={{ color: STATUS[s].label, textTransform: 'capitalize', fontWeight: 600 }}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 4px 12px' }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: t.text }}>{weekDayShort(lang, selectedDay).charAt(0) + weekDayShort(lang, selectedDay).slice(1).toLowerCase()}, {dates[selectedDay]} {monthShort(lang)}</div>
              <div style={{ fontSize: 12, color: t.soft }}>{slotMeals.reduce((s,m)=>s+(m.eaten?m.kcal:0),0)} / {calories || '—'} kcal</div>
            </div>

            {/* 6 meal slots */}
            {slotMeals.map((m, i) => (
              <Card key={i} onClick={() => m.locked && !m.eaten ? setShowLockedDeviate(true) : setShowMealOptions(i)}
                style={{ padding: 14, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                      background: m.eaten ? t.greenBg : m.locked ? t.orangeBg : t.card2,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: `1px solid ${m.eaten ? t.greenBorder : m.locked ? t.orangeBorder : t.border}`,
                    }}>
                      {m.eaten ? <Icon name="check" size={16} color={t.green} stroke={2.5} /> :
                       m.locked ? <Icon name="lock" size={14} color={t.orange} /> :
                       <Icon name="plus" size={16} color={t.muted} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{T(slotKey(m.slot))}</div>
                        {m.eaten && <span style={{ fontSize: 9, color: t.green, fontWeight: 700, background: t.greenBg, padding: '2px 6px', borderRadius: 5, letterSpacing: '0.05em' }}>{T('common.eaten')}</span>}
                      </div>
                      <div style={{ fontSize: 12, color: t.soft, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {(m.items||[]).length ? (m.items||[]).join(' · ') : T('nutr.nomealplanned')}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: m.kcal ? t.text : t.muted, marginLeft: 8 }}>{m.kcal || '—'}</div>
                </div>
              </Card>
            ))}
          </>
        )}

        {sub === 'recipes' && (
          <>
            <Btn full variant="ghost" style={{ marginBottom: 14 }} onClick={() => setShowCreateRecipe(true)}>{T('nutr.createrecipe')}</Btn>
            {recipes.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', borderRadius: 16, background: t.card, border: `1px dashed ${t.border}` }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🍽️</div>
                <div style={{ fontSize: 14, color: t.text, fontWeight: 600, marginBottom: 6 }}>{T('nutr.norecipes')}</div>
                <div style={{ fontSize: 12, color: t.muted, lineHeight: 1.5 }}>{T('nutr.norecipesbody')}</div>
              </div>
            ) : recipes.map(r => (
              <Card key={r.id} style={{ padding: 14 }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  {r.image
                    ? <img src={r.image} alt="" style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                    : <div style={{ width: 56, height: 56, borderRadius: 12, background: t.card3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🍽️</div>
                  }
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>{r.name}</div>
                        <div style={{ fontSize: 11, color: t.muted, fontWeight: 600, letterSpacing: '0.05em', marginTop: 2 }}>{(r.cat||'').toUpperCase()} · {(r.items||[]).length} {T('nutr.products')}</div>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: t.green }}>{r.kcal}<span style={{ fontSize: 10, color: t.muted, marginLeft: 2 }}>kcal</span></div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 11.5 }}>
                      <span><span style={{ color: t.protein, fontWeight: 700 }}>{r.p}g</span> <span style={{ color: t.muted }}>P</span></span>
                      <span><span style={{ color: t.carbs, fontWeight: 700 }}>{r.c}g</span> <span style={{ color: t.muted }}>C</span></span>
                      <span><span style={{ color: t.fat, fontWeight: 700 }}>{r.f}g</span> <span style={{ color: t.muted }}>F</span></span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </>
        )}

        {sub === 'products' && (
          <>
            <Btn full variant="ghost" style={{ marginBottom: 14 }} onClick={() => { setProductPrefill(null); setShowCreateProduct(true); }}>{T('nutr.addproduct')}</Btn>
            {products.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', borderRadius: 16, background: t.card, border: `1px dashed ${t.border}` }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📦</div>
                <div style={{ fontSize: 14, color: t.text, fontWeight: 600, marginBottom: 6 }}>{T('nutr.noproducts')}</div>
                <div style={{ fontSize: 12, color: t.muted, lineHeight: 1.5 }}>{T('nutr.noproductsbody')}</div>
              </div>
            ) : products.map(p => (
              <Card key={p.id} style={{ padding: 14 }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  {p.image
                    ? <img src={p.image} alt="" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                    : <div style={{ width: 48, height: 48, borderRadius: 10, background: t.card3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>📦</div>
                  }
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                          <span style={{ fontSize: 9, color: t.muted, fontWeight: 700, background: t.card2, padding: '2px 6px', borderRadius: 5, letterSpacing: '0.05em', border: `1px solid ${t.border}`, textTransform: 'uppercase', flexShrink: 0 }}>{p.shelf}</span>
                        </div>
                        <div style={{ fontSize: 11.5, color: t.muted }}>{T('common.per100g')} · {p.store}{p.brand ? ` · ${p.brand}` : ''}</div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: t.text, flexShrink: 0, marginLeft: 8 }}>{p.kcal}<span style={{ fontSize: 10, color: t.muted, marginLeft: 2 }}>kcal</span></div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 11.5, marginTop: 8 }}>
                      <span><span style={{ color: t.protein, fontWeight: 700 }}>{p.p}g</span> <span style={{ color: t.muted }}>P</span></span>
                      <span><span style={{ color: t.carbs, fontWeight: 700 }}>{p.c}g</span> <span style={{ color: t.muted }}>C</span></span>
                      <span><span style={{ color: t.fat, fontWeight: 700 }}>{p.f}g</span> <span style={{ color: t.muted }}>F</span></span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </>
        )}

        {sub === 'groceries' && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <Chip active={grocMode === 'simple'} onClick={() => setGrocMode('simple')}>{T('nutr.simple')}</Chip>
              <Chip active={grocMode === 'smart'} onClick={() => setGrocMode('smart')}>{T('nutr.smart')}</Chip>
            </div>
            {!hasGroceries ? (
              <div style={{ padding: 40, textAlign: 'center', borderRadius: 16, background: t.card, border: `1px dashed ${t.border}` }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🛒</div>
                <div style={{ fontSize: 14, color: t.text, fontWeight: 600, marginBottom: 6 }}>{T('nutr.emptygroceries')}</div>
                <div style={{ fontSize: 12, color: t.muted, lineHeight: 1.5 }}>{T('nutr.emptygroceriesbody')}</div>
              </div>
            ) : grocMode === 'smart' ? (
              <>
                {Object.entries(groceriesByShelf).map(([cat, items]) => items.length === 0 ? null : (
                  <Card key={cat} style={{ padding: 14 }}>
                    <Label color={cat === 'fresh' ? t.green : cat === 'refrigerated' ? t.protein : t.muted}>
                      {cat === 'shelf' ? T('nutr.shelfstable') : cat === 'refrigerated' ? T('nutr.refrigerated') : T('nutr.fresh')}
                    </Label>
                    {items.map((it, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < items.length - 1 ? `1px solid ${t.border}` : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 18, height: 18, borderRadius: 6, border: `1.5px solid ${t.border}` }} />
                          <div>
                            <div style={{ fontSize: 14, color: t.text }}>{it.name}</div>
                            <div style={{ fontSize: 11, color: t.muted }}>{it.store}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: t.soft }}>{it.amt}</div>
                      </div>
                    ))}
                  </Card>
                ))}
              </>
            ) : (
              <Card style={{ padding: 14 }}>
                {Object.values(groceriesByShelf).flat().map((it, i, arr) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < arr.length - 1 ? `1px solid ${t.border}` : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 18, height: 18, borderRadius: 6, border: `1.5px solid ${t.border}` }} />
                      <div>
                        <div style={{ fontSize: 14, color: t.text }}>{it.name}</div>
                        <div style={{ fontSize: 11, color: t.muted }}>{it.store}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: t.soft }}>{it.amt}</div>
                  </div>
                ))}
              </Card>
            )}
          </>
        )}

        {sub === 'concepts' && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <Btn small full variant="ghost" onClick={() => setConceptType('day')}>{T('nutr.adddayconcept')}</Btn>
              <Btn small full variant="ghost" onClick={() => setConceptType('week')}>{T('nutr.addweekconcept')}</Btn>
            </div>
            {concepts.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', borderRadius: 16, background: t.card, border: `1px dashed ${t.border}` }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
                <div style={{ fontSize: 14, color: t.text, fontWeight: 600, marginBottom: 6 }}>{T('nutr.noconcepts')}</div>
                <div style={{ fontSize: 12, color: t.muted, lineHeight: 1.5 }}>{T('nutr.noconceptsbody')}</div>
              </div>
            ) : concepts.map((c) => (
              <Card key={c.id} style={{ padding: 14 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {c.image
                    ? <img src={c.image} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                    : <div style={{ width: 44, height: 44, borderRadius: 10, background: t.card3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📋</div>
                  }
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                      <span style={{ fontSize: 9, color: t.green, fontWeight: 700, background: t.greenBg, padding: '2px 6px', borderRadius: 5, letterSpacing: '0.05em', flexShrink: 0 }}>{(c.type||'').toUpperCase()}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: t.muted }}>{c.kcal} kcal{c.type === 'week' ? '/day avg' : ''}</div>
                  </div>
                  <Icon name="chevR" size={16} color={t.muted} />
                </div>
              </Card>
            ))}
          </>
        )}
      </div>

      {/* Meal options */}
      <Modal visible={showMealOptions !== null} onClose={() => setShowMealOptions(null)} title={showMealOptions !== null ? T(slotKey(slotMeals[showMealOptions].slot)) : ''}>
        <Btn full variant="ghost" style={{ marginBottom: 8 }}>{T('nutr.choosereciple')}</Btn>
        <Btn full variant="ghost" style={{ marginBottom: 8 }}>{T('nutr.scanproduct')}</Btn>
        <Btn full variant="ghost" style={{ marginBottom: 8 }}>{showMealOptions !== null && slotMeals[showMealOptions].locked ? T('nutr.unlockmeal') : T('nutr.lockmeal')}</Btn>
        <Btn full variant="outline">{showMealOptions !== null && slotMeals[showMealOptions].eaten ? T('nutr.marknoteaten') : T('nutr.markeaten')}</Btn>
      </Modal>

      {/* Locked deviation */}
      <Modal visible={showLockedDeviate} onClose={() => setShowLockedDeviate(false)} title={T('nutr.deviating')}>
        <div style={{ fontSize: 14, color: t.soft, marginBottom: 18, lineHeight: 1.5 }}>{T('nutr.deviatingbody')}</div>
        <Btn full style={{ marginBottom: 8 }} onClick={() => setShowLockedDeviate(false)}>{T('nutr.keepplan')}</Btn>
        <Btn full variant="outline" style={{ marginBottom: 8 }} onClick={() => setShowLockedDeviate(false)}>{T('nutr.removeplan')}</Btn>
        <Btn full variant="ghost" onClick={() => setShowLockedDeviate(false)}>{T('nutr.remindlater')}</Btn>
      </Modal>

      {/* Create flows */}
      <CreateProductModal visible={showCreateProduct} onClose={() => { setShowCreateProduct(false); setProductPrefill(null); }} onSave={saveProduct} prefill={productPrefill} />
      <CreateRecipeModal visible={showCreateRecipe} onClose={() => setShowCreateRecipe(false)} onSave={saveRecipe} products={products} />
      <CreateConceptModal visible={conceptType !== null} onClose={() => setConceptType(null)} onSave={saveConcept} type={conceptType} recipes={recipes} />

      {/* Barcode scanner */}
      <BarcodeScanner visible={showScanner} onClose={() => setShowScanner(false)} onResult={handleScanResult} />
      <ScannedProductModal barcode={scannedCode} onClose={() => setScannedCode(null)} onSave={handleProductSave} />

      {/* Toast */}
      <Toast message={toast} visible={!!toast} />
    </div>
  );
}
