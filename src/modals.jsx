import { useState, useEffect, useRef, useMemo } from "react";
import { t, newId, useT, resizeImage, slotKey, SLOTS, WEEK, CAT_OPTS, SHELF_OPTS, STORE_OPTS } from './lib';
import { Icon, Btn, Modal, Field, Select } from './shared';
import { LOCAL_FOODS } from './local_foods';
import { OFF_NL } from './local_off_nl';

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
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
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

/* ═══════════════════════════ CREATE PRODUCT MODAL ═══════════════════════════
 * Used for both creating new products AND editing existing ones (via `editing` prop).
 * Now requires a default portion (name + size in grams/ml) so users can log
 * "1× Tub" or "1× Slice" instead of guessing grams every time.
 */
export function CreateProductModal({ visible, onClose, onSave, prefill, editing }) {
  const T = useT();
  const [form, setForm] = useState({
    name: '', brand: '', store: 'AH', shelf: 'shelf',
    kcal: '', p: '', c: '', f: '', image: null,
    portionName: '', portionSize: '100', portionLiquid: false,
  });
  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!visible) return;
    // Determine starting portion from prefill (OFF quantity) or existing defaultPortion
    let portionName = '';
    let portionSize = '100';
    let portionLiquid = false;
    const editDp = editing?.defaultPortion;
    if (editDp) {
      portionName = editDp.name || '';
      portionSize = String(editDp.g != null ? editDp.g : (editDp.ml != null ? editDp.ml : 100));
      portionLiquid = editDp.ml != null;
    } else if (prefill?.defaultPortion) {
      portionName = prefill.defaultPortion.name || '';
      portionSize = String(prefill.defaultPortion.g != null ? prefill.defaultPortion.g : (prefill.defaultPortion.ml != null ? prefill.defaultPortion.ml : 100));
      portionLiquid = prefill.defaultPortion.ml != null;
    } else if (prefill?.quantity) {
      // Parse OFF quantity like "500 g", "1 kg", "1.5 L", "330ml"
      const q = String(prefill.quantity).toLowerCase().replace(',', '.');
      const m = q.match(/([\d.]+)\s*(kg|g|gram|l|liter|ml|cl)/);
      if (m) {
        let val = parseFloat(m[1]);
        const unit = m[2];
        if (unit === 'kg') { val *= 1000; portionLiquid = false; }
        else if (unit === 'l' || unit === 'liter') { val *= 1000; portionLiquid = true; }
        else if (unit === 'cl') { val *= 10; portionLiquid = true; }
        else if (unit === 'ml') { portionLiquid = true; }
        portionSize = String(Math.round(val));
        portionName = portionLiquid ? T('portion.fles.500').split(' ')[0] : T('modal.portionname.ph').split(',')[0].replace('bijv. ','').replace('e.g. ','').replace('z.B. ','').replace('ex. ','').replace('ej. ','').replace('es. ','').replace('np. ','');
      }
    }
    setForm({
      name: editing?.name || prefill?.name || '',
      brand: editing?.brand || prefill?.brand || '',
      store: editing?.store || prefill?.store || 'AH',
      shelf: editing?.shelf || prefill?.shelf || 'shelf',
      kcal: editing?.kcal ?? prefill?.kcal ?? '',
      p: editing?.p ?? prefill?.p ?? '',
      c: editing?.c ?? prefill?.c ?? '',
      f: editing?.f ?? prefill?.f ?? '',
      image: editing?.image || prefill?.image || null,
      portionName, portionSize, portionLiquid,
    });
  }, [visible, prefill, editing]);

  const canSave = form.name.trim() && form.kcal !== '' && form.portionName.trim() && form.portionSize !== '' && parseFloat(form.portionSize) > 0;

  const save = () => {
    if (!canSave) return;
    const sz = parseFloat(form.portionSize) || 100;
    const defaultPortion = {
      id: 'default',
      name: form.portionName.trim(),
      ...(form.portionLiquid ? { ml: sz } : { g: sz }),
      makeDefault: true,
    };
    const baseFields = {
      name: form.name.trim(),
      brand: form.brand.trim(),
      store: form.store,
      shelf: form.shelf,
      kcal: parseFloat(form.kcal) || 0,
      p: parseFloat(form.p) || 0,
      c: parseFloat(form.c) || 0,
      f: parseFloat(form.f) || 0,
      image: form.image,
      defaultPortion,
    };
    if (editing) {
      onSave({ ...editing, ...baseFields });
    } else {
      onSave({
        id: newId(),
        ...baseFields,
        favorite: false,
        createdAt: new Date().toISOString(),
      });
    }
    setForm({ name:'', brand:'', store:'AH', shelf:'shelf', kcal:'', p:'', c:'', f:'', image:null, portionName:'', portionSize:'100', portionLiquid:false });
  };

  return (
    <Modal visible={visible} onClose={onClose} title={editing ? T('modal.editproduct') : T('modal.addproduct')}>
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

      {/* MANDATORY default portion */}
      <div style={{ marginTop: 16, padding: 14, borderRadius: 14, background: t.greenBg, border: `1px solid ${t.greenBorder}` }}>
        <div style={{ fontSize: 13, color: t.green, fontWeight: 700, marginBottom: 4 }}>{T('modal.defaultportion')}</div>
        <div style={{ fontSize: 11.5, color: t.soft, marginBottom: 12, lineHeight: 1.4 }}>{T('modal.defaultportion.hint')}</div>
        <Field label={T('modal.portionname')} value={form.portionName} onChange={v => upd('portionName', v)} placeholder={T('modal.portionname.ph')} />
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <div onClick={() => upd('portionLiquid', false)} style={{
            flex: 1, padding: '10px', borderRadius: 10, textAlign: 'center', cursor: 'pointer',
            background: !form.portionLiquid ? t.green : t.card2,
            color: !form.portionLiquid ? '#0A0A0B' : t.soft,
            fontSize: 12.5, fontWeight: 700,
            border: `1px solid ${!form.portionLiquid ? t.green : t.border}`,
          }}>{T('modal.portion.solid')}</div>
          <div onClick={() => upd('portionLiquid', true)} style={{
            flex: 1, padding: '10px', borderRadius: 10, textAlign: 'center', cursor: 'pointer',
            background: form.portionLiquid ? t.green : t.card2,
            color: form.portionLiquid ? '#0A0A0B' : t.soft,
            fontSize: 12.5, fontWeight: 700,
            border: `1px solid ${form.portionLiquid ? t.green : t.border}`,
          }}>{T('modal.portion.liquid')}</div>
        </div>
        <Field label={T('modal.portion.size')} value={form.portionSize} onChange={v => upd('portionSize', v)} type="number" placeholder="100" unit={form.portionLiquid ? 'ml' : 'g'} />
      </div>

      <Btn full onClick={save} style={{ marginTop: 12, opacity: canSave ? 1 : 0.4, pointerEvents: canSave ? 'auto' : 'none' }}>{editing ? T('modal.saveproductedit') : T('modal.saveproduct')}</Btn>
      <Btn full variant="outline" onClick={onClose} style={{ marginTop: 8 }}>{T('common.cancel')}</Btn>
    </Modal>
  );
}

/* ═══════════════════════════ PRODUCT/RECIPE ACTIONS MODAL ═══════════════════════════
 * The "⋯" menu attached to product/recipe rows: Edit / Change photo / Delete.
 */
export function ProductActionsModal({ visible, onClose, onEdit, onChangePhoto, onDelete, title }) {
  const T = useT();
  return (
    <Modal visible={visible} onClose={onClose} title={title || T('actions.title')}>
      <Btn full variant="ghost" style={{ marginBottom: 8 }} onClick={() => { onEdit?.(); onClose(); }}>{T('actions.edit')}</Btn>
      <Btn full variant="ghost" style={{ marginBottom: 8 }} onClick={() => { onChangePhoto?.(); onClose(); }}>{T('actions.changephoto')}</Btn>
      <Btn full variant="ghost" accent="orange" style={{ marginBottom: 8 }} onClick={() => {
        if (window.confirm(T('actions.deleteconfirm'))) { onDelete?.(); onClose(); }
      }}>{T('actions.delete')}</Btn>
      <Btn full variant="outline" onClick={onClose}>{T('common.cancel')}</Btn>
    </Modal>
  );
}

/* ═══════════════════════════ EDIT PHOTO MODAL ═══════════════════════════
 * Mini modal that only swaps the photo (used by ⋯ → "Change photo").
 */
export function EditPhotoModal({ visible, onClose, currentImage, onSave }) {
  const T = useT();
  const [image, setImage] = useState(currentImage || null);
  useEffect(() => { if (visible) setImage(currentImage || null); }, [visible, currentImage]);
  return (
    <Modal visible={visible} onClose={onClose} title={T('product.photo.edit')}>
      <PhotoPicker value={image} onChange={setImage} />
      <Btn full onClick={() => { onSave(image); onClose(); }}>{T('common.save')}</Btn>
      <Btn full variant="outline" onClick={onClose} style={{ marginTop: 8 }}>{T('common.cancel')}</Btn>
    </Modal>
  );
}

/* ═══════════════════════════ CREATE RECIPE MODAL ═══════════════════════════ */
export function CreateRecipeModal({ visible, onClose, onSave, products }) {
  const T = useT();
  const [form, setForm] = useState({ name: '', cat: 'Breakfast', image: null, items: [] }); // items: snapshot {productId, name, kcal, p, c, f, image, source, grams}
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');
  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    if (visible) setForm({ name: '', cat: 'Breakfast', image: null, items: [] });
  }, [visible]);

  // Combined searchable pool: own products + NEVO basis-foods + OFF_NL bulk
  // Each entry normalized to {id, name, brand, kcal, p, c, f, image, _src}
  const allSearchable = useMemo(() => {
    const own = (products || []).map(p => ({ ...p, _src: 'own' }));
    const nevo = LOCAL_FOODS.filter(f => (f.kcal || 0) > 0).map(f => ({
      id: f.id, name: f.name, brand: '', kcal: f.kcal, p: f.p, c: f.c, f: f.f, image: null, _src: 'nevo'
    }));
    const off = OFF_NL.map(it => ({
      id: 'offnl:' + it.c, name: it.n, brand: it.b || '',
      kcal: it.k, p: it.p, c: it.h, f: it.f,
      image: it.i ? 'https://images.openfoodfacts.org' + it.i : null,
      _src: 'offnl',
    }));
    return [...own, ...nevo, ...off];
  }, [products]);

  // Totals: use embedded snapshot data directly, fallback to product lookup for legacy items
  const totals = form.items.reduce((acc, it) => {
    const r = (parseFloat(it.grams) || 0) / 100;
    let kcal = it.kcal, prot = it.p, carb = it.c, fat = it.f;
    if (kcal == null) {
      const p = products.find(x => x.id === it.productId);
      if (!p) return acc;
      kcal = p.kcal; prot = p.p; carb = p.c; fat = p.f;
    }
    return { kcal: acc.kcal + (kcal||0) * r, p: acc.p + (prot||0) * r, c: acc.c + (carb||0) * r, f: acc.f + (fat||0) * r };
  }, { kcal: 0, p: 0, c: 0, f: 0 });

  const addItem = (p) => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, {
        productId: p.id,
        name: p.name,
        brand: p.brand || '',
        kcal: p.kcal || 0,
        p: p.p || 0,
        c: p.c || 0,
        f: p.f || 0,
        image: p.image || null,
        source: p._src,
        grams: '100',
      }]
    }));
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
      items: form.items.map(it => ({
        productId: it.productId,
        name: it.name,
        brand: it.brand || '',
        kcal: it.kcal || 0,
        p: it.p || 0,
        c: it.c || 0,
        f: it.f || 0,
        image: it.image || null,
        source: it.source,
        grams: parseFloat(it.grams) || 0,
      })),
      kcal: Math.round(totals.kcal),
      p: Math.round(totals.p),
      c: Math.round(totals.c),
      f: Math.round(totals.f),
      createdAt: new Date().toISOString(),
    });
  };

  // Filter combined pool by name OR brand
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return allSearchable.slice(0, 30);
    return allSearchable.filter(p =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.brand || '').toLowerCase().includes(q)
    ).slice(0, 60);
  }, [search, allSearchable]);

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
              // Use snapshot data directly (new format), fallback to product lookup (legacy)
              const fallback = it.kcal == null ? products.find(x => x.id === it.productId) : null;
              const name = it.name || fallback?.name;
              const image = it.image || fallback?.image;
              const kcal = it.kcal != null ? it.kcal : fallback?.kcal;
              if (!name) return null;
              const r = (parseFloat(it.grams) || 0) / 100;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, background: t.card2, borderRadius: 12, marginBottom: 6, border: `1px solid ${t.border}` }}>
                  {image
                    ? <img src={image} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', background: '#fff' }} />
                    : <div style={{ width: 36, height: 36, borderRadius: 8, background: t.card3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>
                  }
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: t.text, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                    <div style={{ fontSize: 10, color: t.muted }}>{Math.round((kcal || 0) * r)} kcal</div>
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

      {/* Product picker sub-modal — searches own products + NEVO + OFF_NL bulk */}
      <Modal visible={showPicker} onClose={() => setShowPicker(false)} title={T('modal.pickingredient')}>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={T('modal.ph.searchproducts')} style={{
          width: '100%', padding: '12px 14px', borderRadius: 12,
          border: `1px solid ${t.border}`, fontSize: 14, fontFamily: 'inherit',
          color: t.text, background: t.card2, boxSizing: 'border-box', outline: 'none', marginBottom: 12,
        }} autoFocus />
        {filtered.length === 0 ? (
          <div style={{ padding: 28, textAlign: 'center', fontSize: 13, color: t.muted }}>
            {search ? T('modal.nomatches') : T('modal.noingredients')}
          </div>
        ) : filtered.map(p => (
          <div key={p.id + ':' + p._src} onClick={() => addItem(p)} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12,
            background: t.card2, marginBottom: 6, cursor: 'pointer', border: `1px solid ${t.border}`,
          }}>
            {p.image
              ? <img src={p.image} alt="" style={{ width: 40, height: 40, borderRadius: 9, objectFit: 'cover', background: '#fff' }} />
              : <div style={{ width: 40, height: 40, borderRadius: 9, background: p._src === 'nevo' ? t.greenBg : t.card3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {p._src === 'nevo' ? '🥗' : '📦'}
                </div>
            }
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <div style={{ fontSize: 13.5, color: t.text, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>{p.name}</div>
                {p._src === 'nevo' && (
                  <span style={{ fontSize: 9, color: t.green, fontWeight: 700, background: t.greenBg, padding: '2px 5px', borderRadius: 4, flexShrink: 0, border: `1px solid ${t.greenBorder}` }}>NEVO</span>
                )}
                {p._src === 'offnl' && (
                  <span style={{ fontSize: 9, color: '#F97316', fontWeight: 700, background: 'rgba(249,115,22,0.12)', padding: '2px 5px', borderRadius: 4, flexShrink: 0, border: '1px solid rgba(249,115,22,0.35)' }}>NL</span>
                )}
              </div>
              <div style={{ fontSize: 11, color: t.muted }}>
                {p.brand ? `${p.brand} · ` : ''}{p.kcal} kcal · {p.p}P / {p.c}C / {p.f}F per 100g
              </div>
            </div>
            <Icon name="plus" size={16} color={t.green} />
          </div>
        ))}
      </Modal>
    </>
  );
}

/* ═══════════════════════════ CREATE CONCEPT MODAL ═══════════════════════════ */
export function CreateConceptModal({ visible, onClose, onSave, type, recipes = [], products = [], dayConcepts = [] }) {
  const T = useT();
  // type: 'day' = build day with multi-item slots; 'week' = pick a day-concept per weekday
  const [name, setName] = useState('');
  const [image, setImage] = useState(null);
  // Day-type: { slotName: [{itemType:'recipe'|'product', refId, name, kcal, p, c, f, image}] }
  const [slots, setSlots] = useState({});
  // Week-type: { dayName: dayConceptId | null }
  const [weekPicks, setWeekPicks] = useState({});
  // Picker state: { slot } for day, { day } for week, with optional tab
  const [picker, setPicker] = useState(null);
  const [pickerTab, setPickerTab] = useState('recipes'); // recipes | products

  useEffect(() => {
    if (visible) {
      setName(''); setImage(null); setSlots({}); setWeekPicks({}); setPicker(null); setPickerTab('recipes');
    }
  }, [visible, type]);

  // Build a snapshot item from a recipe or product
  const snapshotRecipe = (r) => ({ itemType: 'recipe', refId: r.id, name: r.name, kcal: r.kcal||0, p: r.p||0, c: r.c||0, f: r.f||0, image: r.image||null });
  const snapshotProduct = (p) => ({ itemType: 'product', refId: p.id, name: p.name, kcal: p.kcal||0, p: p.p||0, c: p.c||0, f: p.f||0, image: p.image||null });

  const addItemToSlot = (slot, item) => {
    setSlots(prev => ({ ...prev, [slot]: [...(prev[slot] || []), item] }));
    setPicker(null);
  };
  const removeItemFromSlot = (slot, idx) => {
    setSlots(prev => {
      const list = (prev[slot] || []).filter((_, i) => i !== idx);
      const next = { ...prev };
      if (list.length === 0) delete next[slot]; else next[slot] = list;
      return next;
    });
  };

  const pickDayConceptForDay = (day, dayConceptId) => {
    setWeekPicks(prev => ({ ...prev, [day]: dayConceptId }));
    setPicker(null);
  };

  // Macro totals
  const sumItems = (items) => (items || []).reduce(
    (acc, it) => ({ kcal: acc.kcal + (it.kcal||0), p: acc.p + (it.p||0), c: acc.c + (it.c||0), f: acc.f + (it.f||0) }),
    { kcal: 0, p: 0, c: 0, f: 0 }
  );
  const dayTotal = SLOTS.reduce((acc, slot) => {
    const s = sumItems(slots[slot]);
    return { kcal: acc.kcal + s.kcal, p: acc.p + s.p, c: acc.c + s.c, f: acc.f + s.f };
  }, { kcal: 0, p: 0, c: 0, f: 0 });

  // Week-type: derive total from chosen day-concepts
  const weekTotalKcal = Object.values(weekPicks).reduce((s, cid) => {
    if (!cid) return s;
    const dc = dayConcepts.find(c => c.id === cid);
    return s + (dc?.kcal || 0);
  }, 0);
  const filledDays = Object.values(weekPicks).filter(Boolean).length;

  const canSave = name.trim() && (
    type === 'day'
      ? Object.values(slots).some(items => items && items.length > 0)
      : filledDays > 0
  );

  const save = () => {
    if (!canSave) return;
    if (type === 'day') {
      onSave({
        id: newId(),
        name: name.trim(),
        type: 'day',
        image,
        slots, // {slot: [items]}
        kcal: Math.round(dayTotal.kcal),
        p: Math.round(dayTotal.p * 10) / 10,
        c: Math.round(dayTotal.c * 10) / 10,
        f: Math.round(dayTotal.f * 10) / 10,
        createdAt: new Date().toISOString(),
      });
    } else {
      onSave({
        id: newId(),
        name: name.trim(),
        type: 'week',
        image,
        days: weekPicks, // {dayName: dayConceptId}
        kcal: filledDays > 0 ? Math.round(weekTotalKcal / filledDays) : 0,
        createdAt: new Date().toISOString(),
      });
    }
  };

  // ──────────────────────────── RENDER ────────────────────────────
  const noDayConcepts = type === 'week' && dayConcepts.length === 0;

  return (
    <>
      <Modal visible={visible && !picker} onClose={onClose} title={type === 'day' ? T('modal.createdayconcept') : T('modal.createweekconcept')}>
        <PhotoPicker value={image} onChange={setImage} />
        <Field label={T('modal.field.name')} value={name} onChange={setName} placeholder={type === 'day' ? T('modal.ph.dayconceptname') : T('modal.ph.weekconceptname')} />

        {noDayConcepts && (
          <div style={{ padding: 14, borderRadius: 12, background: t.card2, border: `1px dashed ${t.orangeBorder}`, marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: t.orange, fontWeight: 700, marginBottom: 4 }}>{T('modal.needdayconcept')}</div>
            <div style={{ fontSize: 12, color: t.muted }}>{T('modal.needdayconceptbody')}</div>
          </div>
        )}

        {type === 'day' && !noDayConcepts && (
          <>
            <div style={{ fontSize: 12, color: t.soft, fontWeight: 600, marginBottom: 8 }}>{T('modal.meals')}</div>
            {SLOTS.map(slot => {
              const items = slots[slot] || [];
              const slotSum = sumItems(items);
              return (
                <div key={slot} style={{ padding: 10, borderRadius: 12, background: t.card2, marginBottom: 6, border: `1px solid ${items.length > 0 ? t.greenBorder : t.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: items.length > 0 ? 8 : 0 }}>
                    <div style={{ fontSize: 13, color: t.text, fontWeight: 700 }}>{T(slotKey(slot))}</div>
                    <div style={{ fontSize: 11, color: items.length > 0 ? t.green : t.muted }}>
                      {items.length > 0 ? `${items.length} · ${Math.round(slotSum.kcal)} kcal` : T('modal.emptyslot')}
                    </div>
                  </div>
                  {items.map((it, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: t.card3, borderRadius: 9, marginTop: idx === 0 ? 0 : 4 }}>
                      <div style={{ width: 22, height: 22, borderRadius: 6, background: it.itemType === 'recipe' ? t.orangeBg : t.greenBg, color: it.itemType === 'recipe' ? t.orange : t.green, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {it.itemType === 'recipe' ? 'R' : 'P'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, color: t.text, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.name}</div>
                        <div style={{ fontSize: 10.5, color: t.muted }}>{Math.round(it.kcal)} kcal</div>
                      </div>
                      <div onClick={() => removeItemFromSlot(slot, idx)} style={{ width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: t.muted, fontSize: 14, flexShrink: 0 }}>✕</div>
                    </div>
                  ))}
                  <div onClick={() => { setPickerTab(recipes.length > 0 ? 'recipes' : 'products'); setPicker({ slot }); }} style={{
                    marginTop: items.length > 0 ? 6 : 0, padding: '8px 10px', borderRadius: 9,
                    background: 'transparent', border: `1px dashed ${t.border}`, color: t.soft, fontSize: 12, fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer',
                  }}>+ {T('modal.addtoslot')}</div>
                </div>
              );
            })}
          </>
        )}

        {type === 'week' && !noDayConcepts && (
          <>
            <div style={{ fontSize: 12, color: t.soft, fontWeight: 600, marginBottom: 8 }}>{T('modal.days')}</div>
            {WEEK.map(day => {
              const cid = weekPicks[day];
              const dc = cid ? dayConcepts.find(c => c.id === cid) : null;
              return (
                <div key={day} onClick={() => setPicker({ day })} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12,
                  background: t.card2, marginBottom: 6, cursor: 'pointer',
                  border: `1px solid ${dc ? t.greenBorder : t.border}`,
                }}>
                  <div style={{ width: 38, fontSize: 11, color: t.muted, fontWeight: 700, flexShrink: 0 }}>{day}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: dc ? t.text : t.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {dc ? dc.name : T('modal.tappickdayconcept')}
                    </div>
                    {dc && <div style={{ fontSize: 11, color: t.green, marginTop: 2 }}>{dc.kcal} kcal</div>}
                  </div>
                  <Icon name={dc ? 'check' : 'plus'} size={16} color={dc ? t.green : t.muted} />
                </div>
              );
            })}
          </>
        )}

        {((type === 'day' && dayTotal.kcal > 0) || (type === 'week' && weekTotalKcal > 0)) && (
          <div style={{ background: t.greenBg, borderRadius: 14, padding: 12, marginTop: 10, marginBottom: 14, border: `1px solid ${t.greenBorder}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: t.green, fontWeight: 700 }}>{type === 'day' ? T('common.daytotal') : T('common.avgday')}</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: t.green }}>
                {type === 'day' ? Math.round(dayTotal.kcal) : (filledDays > 0 ? Math.round(weekTotalKcal / filledDays) : 0)} kcal
              </span>
            </div>
          </div>
        )}

        <Btn full onClick={save} style={{ marginTop: 8, opacity: canSave ? 1 : 0.4, pointerEvents: canSave ? 'auto' : 'none' }}>{T('modal.saveconcept')}</Btn>
        <Btn full variant="outline" onClick={onClose} style={{ marginTop: 8 }}>{T('common.cancel')}</Btn>
      </Modal>

      {/* Picker for day-type: tabs Recipes | Products */}
      <Modal visible={!!picker && type === 'day'} onClose={() => setPicker(null)} title={picker?.slot ? T('modal.addtoslotof', { slot: T(slotKey(picker.slot)) }) : ''}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, background: t.card3, padding: 4, borderRadius: 10 }}>
          <div onClick={() => setPickerTab('recipes')} style={{
            flex: 1, padding: '8px 10px', borderRadius: 7, textAlign: 'center', fontSize: 12, fontWeight: 700,
            background: pickerTab === 'recipes' ? t.card : 'transparent',
            color: pickerTab === 'recipes' ? t.green : t.muted, cursor: 'pointer',
          }}>{T('modal.tab.recipes')} ({recipes.length})</div>
          <div onClick={() => setPickerTab('products')} style={{
            flex: 1, padding: '8px 10px', borderRadius: 7, textAlign: 'center', fontSize: 12, fontWeight: 700,
            background: pickerTab === 'products' ? t.card : 'transparent',
            color: pickerTab === 'products' ? t.green : t.muted, cursor: 'pointer',
          }}>{T('modal.tab.products')} ({products.length})</div>
        </div>

        {pickerTab === 'recipes' && (
          recipes.length === 0 ? (
            <div style={{ padding: 28, textAlign: 'center', color: t.muted, fontSize: 12 }}>{T('modal.norecipesyet')}</div>
          ) : recipes.map(r => (
            <div key={r.id} onClick={() => addItemToSlot(picker.slot, snapshotRecipe(r))} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12,
              background: t.card2, marginBottom: 6, cursor: 'pointer', border: `1px solid ${t.border}`,
            }}>
              {r.image
                ? <img src={r.image} alt="" style={{ width: 40, height: 40, borderRadius: 9, objectFit: 'cover' }} />
                : <div style={{ width: 40, height: 40, borderRadius: 9, background: t.card3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🍽️</div>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, color: t.text, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                <div style={{ fontSize: 11, color: t.muted }}>{r.cat ? `${r.cat} · ` : ''}{r.kcal} kcal</div>
              </div>
              <Icon name="plus" size={14} color={t.muted} />
            </div>
          ))
        )}

        {pickerTab === 'products' && (
          products.length === 0 ? (
            <div style={{ padding: 28, textAlign: 'center', color: t.muted, fontSize: 12 }}>{T('modal.noproductsyet')}</div>
          ) : products.map(p => (
            <div key={p.id} onClick={() => addItemToSlot(picker.slot, snapshotProduct(p))} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12,
              background: t.card2, marginBottom: 6, cursor: 'pointer', border: `1px solid ${t.border}`,
            }}>
              {p.image
                ? <img src={p.image} alt="" style={{ width: 40, height: 40, borderRadius: 9, objectFit: 'cover', background: '#fff' }} />
                : <div style={{ width: 40, height: 40, borderRadius: 9, background: t.card3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🥫</div>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, color: t.text, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                <div style={{ fontSize: 11, color: t.muted }}>{p.brand ? `${p.brand} · ` : ''}{p.kcal} kcal</div>
              </div>
              <Icon name="plus" size={14} color={t.muted} />
            </div>
          ))
        )}
      </Modal>

      {/* Picker for week-type: choose day-concept */}
      <Modal visible={!!picker && type === 'week'} onClose={() => setPicker(null)} title={picker?.day ? T('modal.choosedayconceptfor', { day: picker.day }) : ''}>
        {dayConcepts.length === 0 ? (
          <div style={{ padding: 28, textAlign: 'center', color: t.muted, fontSize: 12 }}>{T('modal.norecipesyet')}</div>
        ) : (
          <>
            <div onClick={() => pickDayConceptForDay(picker.day, null)} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12,
              background: t.card2, marginBottom: 6, cursor: 'pointer', border: `1px dashed ${t.border}`,
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 9, background: t.card3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>—</div>
              <div style={{ flex: 1, fontSize: 14, color: t.muted, fontWeight: 600 }}>{T('modal.leaveempty')}</div>
            </div>
            {dayConcepts.map(dc => (
              <div key={dc.id} onClick={() => pickDayConceptForDay(picker.day, dc.id)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12,
                background: t.card2, marginBottom: 6, cursor: 'pointer', border: `1px solid ${t.border}`,
              }}>
                {dc.image
                  ? <img src={dc.image} alt="" style={{ width: 40, height: 40, borderRadius: 9, objectFit: 'cover' }} />
                  : <div style={{ width: 40, height: 40, borderRadius: 9, background: t.card3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📋</div>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, color: t.text, fontWeight: 600 }}>{dc.name}</div>
                  <div style={{ fontSize: 11, color: t.muted }}>{dc.kcal} kcal</div>
                </div>
                <Icon name="plus" size={14} color={t.muted} />
              </div>
            ))}
          </>
        )}
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

