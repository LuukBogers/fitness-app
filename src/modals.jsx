import { useState, useEffect, useRef } from "react";
import { t, newId, useT, resizeImage, slotKey, SLOTS, WEEK, CAT_OPTS, SHELF_OPTS, STORE_OPTS } from './lib';
import { Icon, Btn, Modal, Field, Select } from './shared';

/* ═══════════════════════════ PHOTO PICKER ═══════════════════════════ */
export const PhotoPicker = ({ value, onChange, accent = 'green' }) => {
  const T = useT();
  const inputRef = useRef();
  const acc = accent === 'orange' ? t.orange : t.green;
  const accBg = accent === 'orange' ? t.orangeBg : t.greenBg;
  const accBorder = accent === 'orange' ? t.orangeBorder : t.greenBorder;

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await resizeImage(file);
      onChange(data);
    } catch (err) { console.error('Photo resize failed:', err); }
    e.target.value = ''; // allow same file re-pick
  };

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, color: t.soft, fontWeight: 600, marginBottom: 6 }}>{T('modal.photooptional')}</div>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: 'none' }} />
      {value ? (
        <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: `1px solid ${t.border}` }}>
          <img src={value} alt="" style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }} />
          <div onClick={() => onChange(null)} style={{
            position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 16,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <Icon name="x" size={16} color="#fff" />
          </div>
          <div onClick={() => inputRef.current?.click()} style={{
            position: 'absolute', bottom: 10, right: 10, padding: '6px 12px', borderRadius: 10,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            fontSize: 12, color: '#fff', fontWeight: 600, cursor: 'pointer',
          }}>{T('common.replace')}</div>
        </div>
      ) : (
        <div onClick={() => inputRef.current?.click()} style={{
          padding: '24px 14px', borderRadius: 14, background: accBg, border: `1px dashed ${accBorder}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer',
        }}>
          <Icon name="photo" size={28} color={acc} />
          <div style={{ fontSize: 13, color: acc, fontWeight: 600 }}>{T('modal.taptoaddphoto')}</div>
          <div style={{ fontSize: 11, color: t.muted }}>{T('modal.photohint')}</div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════ CREATE PRODUCT MODAL ═══════════════════════════ */
export function CreateProductModal({ visible, onClose, onSave, prefill }) {
  const T = useT();
  const [form, setForm] = useState({
    name: '', brand: '', store: 'AH', shelf: 'shelf',
    kcal: '', p: '', c: '', f: '', image: null,
  });
  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    if (visible) {
      setForm({
        name: prefill?.name || '', brand: prefill?.brand || '',
        store: prefill?.store || 'AH', shelf: prefill?.shelf || 'shelf',
        kcal: prefill?.kcal || '', p: prefill?.p || '', c: prefill?.c || '', f: prefill?.f || '',
        image: prefill?.image || null,
      });
    }
  }, [visible, prefill]);

  const canSave = form.name.trim() && form.kcal !== '';

  const save = () => {
    if (!canSave) return;
    onSave({
      id: newId(),
      name: form.name.trim(),
      brand: form.brand.trim(),
      store: form.store,
      shelf: form.shelf,
      kcal: parseFloat(form.kcal) || 0,
      p: parseFloat(form.p) || 0,
      c: parseFloat(form.c) || 0,
      f: parseFloat(form.f) || 0,
      image: form.image,
      createdAt: new Date().toISOString(),
    });
    setForm({ name:'', brand:'', store:'AH', shelf:'shelf', kcal:'', p:'', c:'', f:'', image:null });
  };

  return (
    <Modal visible={visible} onClose={onClose} title={T('modal.addproduct')}>
      <PhotoPicker value={form.image} onChange={v => upd('image', v)} />
      <Field label={T('modal.field.name')} value={form.name} onChange={v => upd('name', v)} placeholder={T('modal.ph.productname')} />
      <Field label={T('modal.field.brand')} value={form.brand} onChange={v => upd('brand', v)} placeholder={T('modal.ph.brandname')} />
      <Select label={T('modal.field.store')} value={form.store} onChange={v => upd('store', v)} options={STORE_OPTS} />
      <Select label={T('modal.field.shelf')} value={form.shelf} onChange={v => upd('shelf', v)} options={SHELF_OPTS} />

      <div style={{ fontSize: 12, color: t.soft, fontWeight: 600, marginTop: 8, marginBottom: 6 }}>{T('common.per100g')}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label={T('macros.calories')} value={form.kcal} onChange={v => upd('kcal', v)} type="number" placeholder="0" unit="kcal" />
        <Field label={T('macros.protein')} value={form.p} onChange={v => upd('p', v)} type="number" placeholder="0" unit="g" />
        <Field label={T('macros.carbs')} value={form.c} onChange={v => upd('c', v)} type="number" placeholder="0" unit="g" />
        <Field label={T('macros.fat')} value={form.f} onChange={v => upd('f', v)} type="number" placeholder="0" unit="g" />
      </div>

      <Btn full onClick={save} style={{ marginTop: 8, opacity: canSave ? 1 : 0.4, pointerEvents: canSave ? 'auto' : 'none' }}>{T('modal.saveproduct')}</Btn>
      <Btn full variant="outline" onClick={onClose} style={{ marginTop: 8 }}>{T('common.cancel')}</Btn>
    </Modal>
  );
}

/* ═══════════════════════════ CREATE RECIPE MODAL ═══════════════════════════ */
export function CreateRecipeModal({ visible, onClose, onSave, products }) {
  const T = useT();
  const [form, setForm] = useState({ name: '', cat: 'Breakfast', image: null, items: [] }); // items: [{productId, grams}]
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');
  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    if (visible) setForm({ name: '', cat: 'Breakfast', image: null, items: [] });
  }, [visible]);

  const totals = form.items.reduce((acc, it) => {
    const p = products.find(x => x.id === it.productId);
    if (!p) return acc;
    const r = (parseFloat(it.grams) || 0) / 100;
    return { kcal: acc.kcal + p.kcal * r, p: acc.p + p.p * r, c: acc.c + p.c * r, f: acc.f + p.f * r };
  }, { kcal: 0, p: 0, c: 0, f: 0 });

  const addItem = (p) => {
    setForm(prev => ({ ...prev, items: [...prev.items, { productId: p.id, grams: '100' }] }));
    setShowPicker(false); setSearch('');
  };
  const updItem = (idx, grams) => setForm(p => ({ ...p, items: p.items.map((it, i) => i === idx ? { ...it, grams } : it) }));
  const removeItem = (idx) => setForm(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));

  const canSave = form.name.trim() && form.items.length > 0;

  const save = () => {
    if (!canSave) return;
    onSave({
      id: newId(),
      name: form.name.trim(),
      cat: form.cat,
      image: form.image,
      items: form.items.map(it => ({ productId: it.productId, grams: parseFloat(it.grams) || 0 })),
      kcal: Math.round(totals.kcal),
      p: Math.round(totals.p),
      c: Math.round(totals.c),
      f: Math.round(totals.f),
      createdAt: new Date().toISOString(),
    });
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <Modal visible={visible && !showPicker} onClose={onClose} title={T('modal.createrecipe')}>
        <PhotoPicker value={form.image} onChange={v => upd('image', v)} />
        <Field label={T('modal.field.name')} value={form.name} onChange={v => upd('name', v)} placeholder={T('modal.ph.recipename')} />
        <Select label={T('modal.field.category')} value={form.cat} onChange={v => upd('cat', v)} options={CAT_OPTS} />

        <div style={{ fontSize: 12, color: t.soft, fontWeight: 600, marginTop: 8, marginBottom: 8 }}>{T('modal.ingredients')} ({form.items.length})</div>

        {form.items.length === 0 ? (
          <div style={{ padding: 18, borderRadius: 14, background: t.card2, border: `1px dashed ${t.border}`, textAlign: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 13, color: t.muted, marginBottom: 8 }}>{T('modal.noingredients')}</div>
            <div style={{ fontSize: 11, color: t.dim }}>{T('modal.noingredientsbody')}</div>
          </div>
        ) : (
          <div style={{ marginBottom: 10 }}>
            {form.items.map((it, i) => {
              const p = products.find(x => x.id === it.productId);
              if (!p) return null;
              const r = (parseFloat(it.grams) || 0) / 100;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, background: t.card2, borderRadius: 12, marginBottom: 6, border: `1px solid ${t.border}` }}>
                  {p.image
                    ? <img src={p.image} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} />
                    : <div style={{ width: 36, height: 36, borderRadius: 8, background: t.card3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>
                  }
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: t.text, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: t.muted }}>{Math.round(p.kcal * r)} kcal</div>
                  </div>
                  <input type="number" value={it.grams} onChange={e => updItem(i, e.target.value)} placeholder="100" style={{
                    width: 60, padding: '8px 6px', borderRadius: 8, border: `1px solid ${t.border}`,
                    background: t.card3, color: t.text, fontSize: 13, textAlign: 'center', outline: 'none', fontFamily: 'inherit',
                  }} />
                  <span style={{ fontSize: 11, color: t.muted }}>g</span>
                  <div onClick={() => removeItem(i)} style={{ cursor: 'pointer', padding: 4 }}>
                    <Icon name="x" size={14} color={t.muted} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Btn full variant="ghost" small onClick={() => setShowPicker(true)} style={{ marginBottom: 14 }}>
          {products.length === 0 ? T('modal.addproductfirst') : T('modal.addingredient')}
        </Btn>

        {form.items.length > 0 && (
          <div style={{ background: t.greenBg, borderRadius: 14, padding: 12, marginBottom: 14, border: `1px solid ${t.greenBorder}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: t.green, fontWeight: 700 }}>{T('common.total')}</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: t.green }}>{Math.round(totals.kcal)} kcal</span>
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 11.5 }}>
              <span><span style={{ color: t.protein, fontWeight: 700 }}>{Math.round(totals.p)}g</span> <span style={{ color: t.muted }}>P</span></span>
              <span><span style={{ color: t.carbs, fontWeight: 700 }}>{Math.round(totals.c)}g</span> <span style={{ color: t.muted }}>C</span></span>
              <span><span style={{ color: t.fat, fontWeight: 700 }}>{Math.round(totals.f)}g</span> <span style={{ color: t.muted }}>F</span></span>
            </div>
          </div>
        )}

        <Btn full onClick={save} style={{ opacity: canSave ? 1 : 0.4, pointerEvents: canSave ? 'auto' : 'none' }}>{T('modal.saverecipe')}</Btn>
        <Btn full variant="outline" onClick={onClose} style={{ marginTop: 8 }}>{T('common.cancel')}</Btn>
      </Modal>

      {/* Product picker sub-modal */}
      <Modal visible={showPicker} onClose={() => setShowPicker(false)} title={T('modal.pickingredient')}>
        {products.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: t.muted, marginBottom: 8 }}>{T('modal.noproductsadded')}</div>
            <div style={{ fontSize: 11, color: t.dim, marginBottom: 14 }}>{T('modal.noproductsaddedbody')}</div>
            <Btn full variant="outline" onClick={() => setShowPicker(false)}>{T('common.back')}</Btn>
          </div>
        ) : (
          <>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={T('modal.ph.searchproducts')} style={{
              width: '100%', padding: '12px 14px', borderRadius: 12,
              border: `1px solid ${t.border}`, fontSize: 14, fontFamily: 'inherit',
              color: t.text, background: t.card2, boxSizing: 'border-box', outline: 'none', marginBottom: 12,
            }} />
            {filtered.length === 0 ? (
              <div style={{ padding: 18, textAlign: 'center', fontSize: 13, color: t.muted }}>{T('modal.nomatches')}</div>
            ) : (
              filtered.map(p => (
                <div key={p.id} onClick={() => addItem(p)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12,
                  background: t.card2, marginBottom: 6, cursor: 'pointer', border: `1px solid ${t.border}`,
                }}>
                  {p.image
                    ? <img src={p.image} alt="" style={{ width: 40, height: 40, borderRadius: 9, objectFit: 'cover' }} />
                    : <div style={{ width: 40, height: 40, borderRadius: 9, background: t.card3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>
                  }
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: t.text, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: t.muted }}>{p.kcal} kcal · {p.p}P / {p.c}C / {p.f}F per 100g</div>
                  </div>
                  <Icon name="plus" size={16} color={t.green} />
                </div>
              ))
            )}
          </>
        )}
      </Modal>
    </>
  );
}

/* ═══════════════════════════ CREATE CONCEPT MODAL ═══════════════════════════ */
export function CreateConceptModal({ visible, onClose, onSave, type, recipes }) {
  const T = useT();
  // type: 'day' or 'week'
  const [name, setName] = useState('');
  const [image, setImage] = useState(null);
  const [dayMeals, setDayMeals] = useState({}); // { slotName: recipeId }
  const [weekDays, setWeekDays] = useState({}); // { dayName: { slotName: recipeId } }
  const [showPicker, setShowPicker] = useState(null); // { slot, day? }

  useEffect(() => {
    if (visible) {
      setName(''); setImage(null); setDayMeals({}); setWeekDays({}); setShowPicker(null);
    }
  }, [visible, type]);

  const pickRecipe = (recipe) => {
    if (!showPicker) return;
    if (type === 'day') {
      setDayMeals(p => ({ ...p, [showPicker.slot]: recipe.id }));
    } else {
      setWeekDays(p => ({
        ...p,
        [showPicker.day]: { ...(p[showPicker.day] || {}), [showPicker.slot]: recipe.id }
      }));
    }
    setShowPicker(null);
  };

  const dayKcal = (slots) => Object.values(slots || {}).reduce((s, rid) => {
    const r = recipes.find(x => x.id === rid);
    return s + (r ? r.kcal : 0);
  }, 0);

  const totalKcal = type === 'day' ? dayKcal(dayMeals) : Object.values(weekDays).reduce((s, d) => s + dayKcal(d), 0);

  const canSave = name.trim() && (type === 'day' ? Object.keys(dayMeals).length > 0 : Object.keys(weekDays).length > 0);

  const save = () => {
    if (!canSave) return;
    onSave({
      id: newId(),
      name: name.trim(),
      type,
      image,
      meals: type === 'day' ? dayMeals : weekDays,
      kcal: type === 'day' ? dayKcal(dayMeals) : Math.round(totalKcal / 7),
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <>
      <Modal visible={visible && !showPicker} onClose={onClose} title={type === 'day' ? T('modal.createdayconcept') : T('modal.createweekconcept')}>
        <PhotoPicker value={image} onChange={setImage} />
        <Field label={T('modal.field.name')} value={name} onChange={setName} placeholder={type === 'day' ? T('modal.ph.dayconceptname') : T('modal.ph.weekconceptname')} />

        {recipes.length === 0 && (
          <div style={{ padding: 14, borderRadius: 12, background: t.card2, border: `1px dashed ${t.border}`, marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: t.muted, textAlign: 'center' }}>{T('modal.needrecipes')}<br/>{T('modal.needrecipesbody')}</div>
          </div>
        )}

        {type === 'day' ? (
          <>
            <div style={{ fontSize: 12, color: t.soft, fontWeight: 600, marginBottom: 8 }}>{T('modal.meals')}</div>
            {SLOTS.map(slot => {
              const rid = dayMeals[slot];
              const r = recipes.find(x => x.id === rid);
              return (
                <div key={slot} onClick={() => recipes.length > 0 && setShowPicker({ slot })} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12,
                  background: t.card2, marginBottom: 6, cursor: recipes.length > 0 ? 'pointer' : 'default',
                  border: `1px solid ${r ? t.greenBorder : t.border}`, opacity: recipes.length > 0 ? 1 : 0.4,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: t.text, fontWeight: 600 }}>{T(slotKey(slot))}</div>
                    <div style={{ fontSize: 11, color: r ? t.green : t.muted, marginTop: 2 }}>{r ? `${r.name} · ${r.kcal} kcal` : T('modal.taptopickrecipe')}</div>
                  </div>
                  <Icon name={r ? 'check' : 'plus'} size={16} color={r ? t.green : t.muted} />
                </div>
              );
            })}
          </>
        ) : (
          <>
            <div style={{ fontSize: 12, color: t.soft, fontWeight: 600, marginBottom: 8 }}>{T('modal.days')}</div>
            {WEEK.map(day => {
              const dayK = dayKcal(weekDays[day]);
              const count = Object.keys(weekDays[day] || {}).length;
              return (
                <div key={day} style={{ padding: 10, borderRadius: 12, background: t.card2, marginBottom: 6, border: `1px solid ${t.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: count > 0 ? 8 : 0 }}>
                    <div style={{ fontSize: 13, color: t.text, fontWeight: 700 }}>{day}</div>
                    <div style={{ fontSize: 11, color: t.muted }}>{count > 0 ? T('modal.mealscount', { count, kcal: dayK }) : T('modal.nomeals')}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {SLOTS.map(slot => {
                      const rid = weekDays[day]?.[slot];
                      const r = recipes.find(x => x.id === rid);
                      return (
                        <div key={slot} onClick={() => recipes.length > 0 && setShowPicker({ slot, day })} style={{
                          padding: '5px 8px', borderRadius: 7, fontSize: 10, fontWeight: 600,
                          background: r ? t.greenBg : t.card3, color: r ? t.green : t.muted,
                          border: `1px solid ${r ? t.greenBorder : t.border}`,
                          cursor: recipes.length > 0 ? 'pointer' : 'default',
                        }}>{T(slotKey(slot)).slice(0, 8)}{r ? ' ✓' : ''}</div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {totalKcal > 0 && (
          <div style={{ background: t.greenBg, borderRadius: 14, padding: 12, marginTop: 10, marginBottom: 14, border: `1px solid ${t.greenBorder}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: t.green, fontWeight: 700 }}>{type === 'day' ? T('common.daytotal') : T('common.avgday')}</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: t.green }}>{type === 'day' ? Math.round(totalKcal) : Math.round(totalKcal/7)} kcal</span>
            </div>
          </div>
        )}

        <Btn full onClick={save} style={{ marginTop: 8, opacity: canSave ? 1 : 0.4, pointerEvents: canSave ? 'auto' : 'none' }}>{T('modal.saveconcept')}</Btn>
        <Btn full variant="outline" onClick={onClose} style={{ marginTop: 8 }}>{T('common.cancel')}</Btn>
      </Modal>

      {/* Recipe picker */}
      <Modal visible={!!showPicker} onClose={() => setShowPicker(null)} title={T('modal.pickrecipefor', { slot: showPicker?.slot ? T(slotKey(showPicker.slot)) : '' })}>
        {recipes.map(r => (
          <div key={r.id} onClick={() => pickRecipe(r)} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12,
            background: t.card2, marginBottom: 6, cursor: 'pointer', border: `1px solid ${t.border}`,
          }}>
            {r.image
              ? <img src={r.image} alt="" style={{ width: 40, height: 40, borderRadius: 9, objectFit: 'cover' }} />
              : <div style={{ width: 40, height: 40, borderRadius: 9, background: t.card3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🍽️</div>
            }
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, color: t.text, fontWeight: 600 }}>{r.name}</div>
              <div style={{ fontSize: 11, color: t.muted }}>{r.cat} · {r.kcal} kcal</div>
            </div>
            <Icon name="chevR" size={14} color={t.muted} />
          </div>
        ))}
      </Modal>
    </>
  );
}
/* ═══════════════════════════ TOAST ═══════════════════════════ */
export function Toast({ message, visible }) {
  if (!visible) return null;
  return (
    <div style={{ position: 'absolute', bottom: 90, left: 16, right: 16, zIndex: 400, background: t.card2, borderRadius: 14, padding: '12px 16px', border: `1px solid ${t.greenBorder}`, boxShadow: '0 8px 30px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: 10, animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
      <div style={{ width: 24, height: 24, borderRadius: 12, background: t.greenBg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${t.greenBorder}` }}>
        <Icon name="check" size={14} color={t.green} stroke={3} />
      </div>
      <div style={{ fontSize: 13, color: t.text, fontWeight: 600 }}>{message}</div>
    </div>
  );
}

