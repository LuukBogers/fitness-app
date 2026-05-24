import { useState, useEffect, useMemo } from "react";
import { t, useT, SLOTS, GLOBAL_PORTIONS, newId, slotKey, todayKey, useApp } from './lib';
import { Icon, Btn, Modal, Toggle, Field } from './shared';

/* ═══════════════════════════ MODULE A: PRODUCT LOG FLOW ═══════════════════════════
 * - ProductDetailModal: open a product, set quantity × portion, choose meal slot, log it
 * - PortionBottomSheet: bottom-sheet picker with product-specific portions + gram/ml + create-new
 * - CreatePortionModal: define a custom portion ("1 scoop = 30g") based on a global portion
 * ════════════════════════════════════════════════════════════════════════════════════ */

// Helper: translate a portion id to its localized label
export const portionLabel = (T, portion) => {
  if (!portion) return '';
  if (portion.custom) return portion.name;
  if (portion.id === 'gramml') return T('portion.gramml');
  return T('portion.' + portion.id);
};

// Helper: grams (or ml as grams equivalent for liquids) for a portion entry
export const portionGrams = (portion) => {
  if (!portion) return 0;
  return portion.g != null ? portion.g : (portion.ml != null ? portion.ml : 0);
};

// Builds the full ordered portion list for a product:
// [product-specific customs..., gram/ml universal, ...all globals]
const buildPortionList = (product) => {
  const customs = Array.isArray(product?.customPortions) ? product.customPortions : [];
  return [
    ...customs.map(c => ({ ...c, custom: true })),
    { id: 'gramml', g: 1 }, // 1g per 1x → user enters grams directly
    ...GLOBAL_PORTIONS,
  ];
};

const findPortionByKey = (product, key) => {
  if (!key) return null;
  const list = buildPortionList(product);
  return list.find(p => (p.custom ? p.id : p.id) === key) || list[0];
};

/* ───────────────────────────── PortionBottomSheet ─────────────────────────────
 * Slides up from the bottom. Shows custom (product-specific) portions on top,
 * then "gram / ml" universal escape, then all globals, finally "+ Add new".
 */
export function PortionBottomSheet({ visible, onClose, product, selectedKey, onSelect, onCreateNew }) {
  const T = useT();
  if (!visible) return null;
  const list = buildPortionList(product || {});

  return (
    <>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
        zIndex: 300, animation: 'fadeIn 0.2s ease',
      }} />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: t.card, borderTopLeftRadius: 22, borderTopRightRadius: 22,
        zIndex: 301, padding: '8px 0 20px', maxHeight: '78vh', overflowY: 'auto',
        animation: 'slideUpSheet 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: '0 -20px 60px rgba(0,0,0,0.5)', border: `1px solid ${t.border}`,
      }}>
        <div style={{ width: 40, height: 4, background: t.border, borderRadius: 2, margin: '8px auto 14px' }} />
        <div style={{ fontSize: 20, fontWeight: 800, color: t.text, padding: '0 22px 12px', letterSpacing: '-0.01em' }}>{T('portion.choose')}</div>

        {list.map((p, i) => {
          const isSelected = (p.custom ? p.id : p.id) === selectedKey;
          const grams = portionGrams(p);
          const unit = p.ml != null ? 'ml' : 'gram';
          const label = portionLabel(T, p);
          return (
            <div key={(p.custom ? 'c:' : 'g:') + p.id + i} onClick={() => onSelect(p)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 22px', cursor: 'pointer',
              borderBottom: i < list.length - 1 ? `1px solid ${t.border}` : 'none',
            }}>
              <div style={{ fontSize: 15, color: t.text }}>
                {label}{p.id !== 'gramml' && ` (${grams} ${unit})`}
              </div>
              {isSelected && <Icon name="check" size={18} color={t.green} stroke={2.5} />}
            </div>
          );
        })}

        <div onClick={onCreateNew} style={{
          padding: '16px 22px', cursor: 'pointer',
          color: t.green, fontWeight: 700, fontSize: 15,
          borderTop: `1px solid ${t.border}`, marginTop: 4,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: 11, background: t.greenBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${t.greenBorder}`,
          }}>
            <Icon name="plus" size={14} color={t.green} stroke={3} />
          </div>
          {T('portion.addnew')}
        </div>
      </div>
    </>
  );
}

/* ───────────────────────────── CreatePortionModal ─────────────────────────────
 * Form: pick a base (global portion), give it a custom name, optionally set as default.
 */
export function CreatePortionModal({ visible, onClose, onSave, product }) {
  const T = useT();
  const [name, setName] = useState('');
  const [baseId, setBaseId] = useState('eetlepel');
  const [makeDefault, setMakeDefault] = useState(false);

  useEffect(() => {
    if (visible) { setName(''); setBaseId('eetlepel'); setMakeDefault(false); }
  }, [visible]);

  const baseList = useMemo(() => GLOBAL_PORTIONS, []);
  const base = baseList.find(b => b.id === baseId) || baseList[0];
  const grams = portionGrams(base);
  const unit = base.ml != null ? 'ml' : 'gram';

  const canSave = name.trim().length > 0;
  const save = () => {
    if (!canSave) return;
    onSave({
      id: 'c_' + newId(),
      name: name.trim(),
      g: base.g, ml: base.ml,
      makeDefault,
      baseId,
    });
  };

  return (
    <Modal visible={visible} onClose={onClose} title={T('portion.create')}>
      <div style={{ fontSize: 12, color: t.soft, fontWeight: 600, marginBottom: 6 }}>{T('modal.field.name')}</div>
      <input
        type="text" value={name} onChange={e => setName(e.target.value)}
        placeholder={T('portion.nameplaceholder')} autoFocus
        style={{
          width: '100%', padding: '13px 14px', borderRadius: 12,
          border: `1px solid ${t.border}`, fontSize: 15, color: t.text,
          background: t.card2, outline: 'none', fontFamily: 'inherit',
          boxSizing: 'border-box', marginBottom: 14,
        }}
      />

      <div style={{ fontSize: 12, color: t.soft, fontWeight: 600, marginBottom: 6 }}>{T('portion.basedon')}</div>
      <select
        value={baseId} onChange={e => setBaseId(e.target.value)}
        style={{
          width: '100%', padding: '13px 14px', borderRadius: 12,
          border: `1px solid ${t.border}`, fontSize: 15, color: t.text,
          background: t.card2, outline: 'none', fontFamily: 'inherit',
          boxSizing: 'border-box', marginBottom: 14, appearance: 'none',
        }}
      >
        {baseList.map(b => (
          <option key={b.id} value={b.id} style={{ background: t.card2 }}>
            {T('portion.' + b.id)} ({portionGrams(b)} {b.ml != null ? 'ml' : 'gram'})
          </option>
        ))}
      </select>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0 14px' }}>
        <div style={{ fontSize: 14, color: t.text, fontWeight: 600 }}>{T('portion.makedefault')}</div>
        <Toggle on={makeDefault} onChange={setMakeDefault} />
      </div>

      <Btn full onClick={save} style={{ opacity: canSave ? 1 : 0.4, pointerEvents: canSave ? 'auto' : 'none' }}>
        {T('portion.saveportion')}
      </Btn>
      <Btn full variant="outline" onClick={onClose} style={{ marginTop: 8 }}>{T('common.cancel')}</Btn>
    </Modal>
  );
}

/* ───────────────────────────── ProductDetailModal ─────────────────────────────
 * The main "log a product" experience. Mirrors the food-app screenshot:
 *   - Big rounded product photo
 *   - Optional "Created by me" / "Verified" badge
 *   - Name + (optional) brand subtitle
 *   - 4 flat macro cards (Calories / Carbs / Protein / Fat)
 *   - 1x × portion-dropdown selector
 *   - "Eaten as" slot dropdown
 *   - "Add to diary" CTA
 */
export function ProductDetailModal({ visible, product, onClose, defaultSlot, onLogged }) {
  const T = useT();
  const { profile, saveProfileData } = useApp();
  const [count, setCount] = useState(1);
  const [portionKey, setPortionKey] = useState('gramml');
  const [grams, setGrams] = useState(100);
  const [slot, setSlot] = useState(defaultSlot || 'Lunch');
  const [showPortionSheet, setShowPortionSheet] = useState(false);
  const [showCreatePortion, setShowCreatePortion] = useState(false);

  // Resolve current portion + compute effective grams for macro calc
  const portion = useMemo(() => findPortionByKey(product, portionKey), [product, portionKey]);
  const gramsPerUnit = portion?.id === 'gramml' ? grams : portionGrams(portion);
  const totalGrams = count * gramsPerUnit;
  const factor = (product?.kcal != null ? totalGrams / 100 : 0);

  const tKcal = Math.round((product?.kcal || 0) * factor);
  const tP    = Math.round((product?.p    || 0) * factor * 10) / 10;
  const tC    = Math.round((product?.c    || 0) * factor * 10) / 10;
  const tF    = Math.round((product?.f    || 0) * factor * 10) / 10;

  // Initialize portion + slot when modal opens
  useEffect(() => {
    if (!visible || !product) return;
    setCount(1);
    setSlot(defaultSlot || 'Lunch');
    setGrams(100);
    const customs = product.customPortions || [];
    const def = customs.find(c => c.makeDefault);
    setPortionKey(def ? def.id : 'gramml');
  }, [visible, product?.id, defaultSlot]);

  if (!visible || !product) return null;

  const onCreatePortion = async (newPortion) => {
    // Persist on product
    const products = profile?.data?.products || [];
    const updatedProducts = products.map(p => {
      if (p.id !== product.id) return p;
      const others = (p.customPortions || []).map(c => ({ ...c, makeDefault: newPortion.makeDefault ? false : c.makeDefault }));
      return { ...p, customPortions: [...others, newPortion] };
    });
    await saveProfileData({ products: updatedProducts });
    setShowCreatePortion(false);
    setShowPortionSheet(false);
    setPortionKey(newPortion.id);
  };

  const log = async () => {
    if (!product) return;
    const tKey = todayKey();
    const meals = profile?.data?.meals || {};
    const dayMeals = meals[tKey] || SLOTS.map(s => ({
      slot: s, items: [], itemsFull: [], kcal: 0, p: 0, c: 0, f: 0, locked: false, eaten: false,
    }));
    const ensured = SLOTS.map(s => dayMeals.find(m => m.slot === s) || {
      slot: s, items: [], itemsFull: [], kcal: 0, p: 0, c: 0, f: 0, locked: false, eaten: false,
    });
    const portionLbl = portionLabel(T, portion);
    const itemNameStr = `${count}× ${product.name} (${portionLbl}${portion?.id !== 'gramml' ? '' : ` ${gramsPerUnit}g`})`;
    const itemFull = {
      productId: product.id, name: product.name,
      grams: totalGrams, count, portionKey,
      kcal: tKcal, p: tP, c: tC, f: tF,
      store: product.store, shelf: product.shelf,
    };
    const updated = ensured.map(m => m.slot === slot ? {
      ...m,
      items:     [...(m.items || []), itemNameStr],
      itemsFull: [...(m.itemsFull || []), itemFull],
      kcal: (m.kcal || 0) + tKcal,
      p:    (m.p    || 0) + tP,
      c:    (m.c    || 0) + tC,
      f:    (m.f    || 0) + tF,
      eaten: true,
    } : m);
    await saveProfileData({ meals: { ...meals, [tKey]: updated } });
    if (onLogged) onLogged({ kcal: tKcal, slot: T(slotKey(slot)) });
    onClose();
  };

  const macros = [
    { key: 'kcal', label: T('macros.calories'),  value: tKcal,           color: t.green,   icon: 'flame'   },
    { key: 'c',    label: T('macros.carbs'),     value: `${tC}`, suffix: 'g', color: t.carbs,   icon: 'wheat'   },
    { key: 'p',    label: T('macros.protein'),   value: `${tP}`, suffix: 'g', color: t.protein, icon: 'egg' },
    { key: 'f',    label: T('macros.fat'),       value: `${tF}`, suffix: 'g', color: t.fat,     icon: 'drop'    },
  ];

  return (
    <div style={{
      position: 'absolute', inset: 0, background: t.bg, zIndex: 200,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 14px 0' }}>
        <div onClick={onClose} style={{
          width: 38, height: 38, borderRadius: 12, background: t.card2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px solid ${t.border}`, cursor: 'pointer',
        }}>
          <Icon name="chevL" size={20} color={t.text} />
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 16px 16px' }}>
        {/* Hero photo with glow */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 18px', position: 'relative' }}>
          <div style={{
            position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
            width: 220, height: 220, background: `radial-gradient(circle, ${t.greenBg}, transparent 70%)`,
            pointerEvents: 'none',
          }} />
          {product.image ? (
            <img src={product.image} alt="" style={{
              width: 140, height: 140, borderRadius: 28, objectFit: 'cover',
              background: '#fff', position: 'relative', zIndex: 1,
              boxShadow: `0 10px 30px rgba(0,0,0,0.4)`,
            }} />
          ) : (
            <div style={{
              width: 140, height: 140, borderRadius: 28,
              background: t.card2, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px solid ${t.border}`, position: 'relative', zIndex: 1,
              boxShadow: `0 10px 30px rgba(0,0,0,0.4)`,
            }}>
              <Icon name="apple" size={60} color={t.green} />
            </div>
          )}
        </div>

        {/* Badge: created-by-me */}
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <span style={{
            display: 'inline-block', padding: '6px 14px', borderRadius: 20,
            background: t.card2, border: `1px solid ${t.border}`,
            fontSize: 10.5, fontWeight: 800, color: t.soft, letterSpacing: '0.1em',
          }}>{T('product.detail.bymyself')}</span>
        </div>

        {/* Name + brand */}
        <div style={{ textAlign: 'center', marginBottom: 4 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: t.text, letterSpacing: '-0.02em', lineHeight: 1.15 }}>{product.name}</div>
          {product.brand && <div style={{ fontSize: 14, color: t.soft, marginTop: 4 }}>{product.brand}</div>}
        </div>

        {/* 4 flat macro cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 22, marginBottom: 18 }}>
          {macros.map(m => (
            <div key={m.key} style={{
              background: t.card, borderRadius: 16, padding: '12px 6px',
              border: `1px solid ${t.border}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
              minHeight: 90,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: `${m.color}15`, border: `1.5px solid ${m.color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name={m.icon} size={15} color={m.color} stroke={2.4} />
              </div>
              <div style={{ fontSize: 10.5, color: m.color, fontWeight: 700, marginTop: 4, textAlign: 'center' }}>{m.label}</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: t.text, marginTop: 2 }}>
                {m.value}{m.suffix && <span style={{ fontSize: 10.5, color: t.muted, marginLeft: 1 }}>{m.suffix}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Quantity × portion selector */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {/* Count badge */}
          <div style={{
            background: t.card, border: `1px solid ${t.border}`, borderRadius: 14,
            padding: '12px 0', minWidth: 72, textAlign: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
            <div onClick={() => setCount(Math.max(0.25, +(count - 0.25).toFixed(2)))} style={{
              position: 'absolute', left: 4, top: 4, bottom: 4, width: 22,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: t.muted, fontSize: 18, fontWeight: 700, cursor: 'pointer',
            }}>−</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: t.text }}>{count}×</div>
            <div onClick={() => setCount(+(count + 0.25).toFixed(2))} style={{
              position: 'absolute', right: 4, top: 4, bottom: 4, width: 22,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: t.muted, fontSize: 18, fontWeight: 700, cursor: 'pointer',
            }}>+</div>
          </div>
          {/* Portion dropdown trigger */}
          <div onClick={() => setShowPortionSheet(true)} style={{
            flex: 1, background: t.card, border: `1px solid ${t.border}`, borderRadius: 14,
            padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', minHeight: 50,
          }}>
            <div style={{ fontSize: 15, color: t.text, fontWeight: 600 }}>
              {portionLabel(T, portion)}{portion?.id !== 'gramml' && ` (${portionGrams(portion)} ${portion?.ml != null ? 'ml' : 'gram'})`}
            </div>
            <Icon name="chevD" size={18} color={t.muted} />
          </div>
        </div>

        {/* When gram/ml is selected → show direct grams input */}
        {portion?.id === 'gramml' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
            <div onClick={() => setGrams(Math.max(0, grams - 10))} style={{
              width: 50, height: 50, background: t.card, border: `1px solid ${t.border}`, borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              color: t.text, fontSize: 22, fontWeight: 700,
            }}>−</div>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="number" inputMode="numeric" value={grams}
                onChange={e => setGrams(parseInt(e.target.value) || 0)}
                style={{
                  width: '100%', padding: '14px 14px', paddingRight: 50, borderRadius: 14,
                  border: `1px solid ${t.border}`, fontSize: 18, color: t.text, background: t.card,
                  outline: 'none', fontFamily: 'inherit', textAlign: 'center', fontWeight: 700,
                  boxSizing: 'border-box',
                }}
              />
              <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', color: t.muted, fontSize: 14, fontWeight: 600 }}>g</span>
            </div>
            <div onClick={() => setGrams(grams + 10)} style={{
              width: 50, height: 50, background: t.card, border: `1px solid ${t.border}`, borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              color: t.text, fontSize: 22, fontWeight: 700,
            }}>+</div>
          </div>
        )}

        {/* "Eaten as" slot dropdown */}
        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: '10px 16px', marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: t.muted, fontWeight: 600, marginBottom: 4, letterSpacing: '0.03em' }}>{T('product.detail.eatenas')}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <select
              value={slot} onChange={e => setSlot(e.target.value)}
              style={{
                appearance: 'none', background: 'transparent', border: 'none',
                color: t.text, fontSize: 16, fontWeight: 700, outline: 'none',
                fontFamily: 'inherit', padding: 0, width: '100%', cursor: 'pointer',
              }}
            >
              {SLOTS.map(s => <option key={s} value={s} style={{ background: t.card2 }}>{T(slotKey(s))}</option>)}
            </select>
            <Icon name="chevD" size={18} color={t.muted} />
          </div>
        </div>
      </div>

      {/* Sticky bottom CTA */}
      <div style={{ padding: '14px 16px 22px', borderTop: `1px solid ${t.border}`, background: t.bg }}>
        <Btn full onClick={log}>
          <span style={{ fontWeight: 700 }}>{T('product.detail.addtodiary')}</span>
        </Btn>
      </div>

      {/* Portion bottom-sheet */}
      <PortionBottomSheet
        visible={showPortionSheet}
        onClose={() => setShowPortionSheet(false)}
        product={product}
        selectedKey={portionKey}
        onSelect={(p) => { setPortionKey(p.id); setShowPortionSheet(false); }}
        onCreateNew={() => { setShowPortionSheet(false); setShowCreatePortion(true); }}
      />

      {/* Create-portion modal */}
      <CreatePortionModal
        visible={showCreatePortion}
        onClose={() => setShowCreatePortion(false)}
        onSave={onCreatePortion}
        product={product}
      />
    </div>
  );
}
