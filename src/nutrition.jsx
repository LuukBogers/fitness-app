import { useState, useMemo } from "react";
import { t, STATUS, WEEK, SLOTS, useApp, useT, useLang, todayIdx, weekDates, todayKey, monthName, monthShort, weekDayShort, slotKey, fmtKey, dayStatus } from './lib';
import { Icon, Card, Label, Btn, Chip, Modal, Field, Ring, MacroRing } from './shared';
import { CreateProductModal, CreateRecipeModal, CreateConceptModal, ProductActionsModal, EditPhotoModal, Toast } from './modals';
import { ProductDetailModal } from './logflow';
import { LogLibrary } from './loglibrary';
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
  const [showLegend, setShowLegend] = useState(false);
  const [openProduct, setOpenProduct] = useState(null);
  const [grocMode, setGrocMode] = useState('smart');
  const [showScanner, setShowScanner] = useState(false);
  const [scannedCode, setScannedCode] = useState(null);
  const [toast, setToast] = useState('');
  const [activeSlot, setActiveSlot] = useState(null); // slot pre-selected when opening LogLibrary from a section "+"

  // Module C — actions menu state
  const [actionsTarget, setActionsTarget] = useState(null); // { kind: 'product'|'recipe', item }
  const [editingProduct, setEditingProduct] = useState(null);
  const [photoEditing, setPhotoEditing] = useState(null); // { kind, id, currentImage }

  // Create modals
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [productPrefill, setProductPrefill] = useState(null);
  const [showCreateRecipe, setShowCreateRecipe] = useState(false);
  const [conceptType, setConceptType] = useState(null); // 'day' | 'week' | null
  // Edit-mode for recipes/concepts
  const [editingRecipe, setEditingRecipe] = useState(null); // recipe being edited
  const [editingConcept, setEditingConcept] = useState(null); // concept being edited
  // ⋯ actions menu for recipe/concept cards
  const [recipeActions, setRecipeActions] = useState(null); // recipe whose menu is open
  const [conceptActions, setConceptActions] = useState(null); // concept whose menu is open
  // Confirm-delete dialog (shared)
  const [confirmDelete, setConfirmDelete] = useState(null); // { kind: 'recipe'|'concept', item }
  // Planning slot-item actions (⋯ on items in day-overview)
  const [planningItemActions, setPlanningItemActions] = useState(null); // { slot, idx, item }
  const [editingPlanningItem, setEditingPlanningItem] = useState(null); // { slot, idx, item }
  // Groceries skip-list per week (items hidden this week)
  const [groceriesItemActions, setGroceriesItemActions] = useState(null); // { key, item, isCustom }
  // Add-grocery modal
  const [showAddGrocery, setShowAddGrocery] = useState(false);
  const [newGrocName, setNewGrocName] = useState('');
  const [newGrocQty, setNewGrocQty] = useState('');
  const [newGrocStore, setNewGrocStore] = useState('');

  // Selected day key
  const selDate = (() => { const dt = new Date(); dt.setDate(dt.getDate() - ti + selectedDay); return fmtKey(dt); })();
  const selMeals = meals[selDate] || SLOTS.map(slot => ({ slot, items: [], itemsFull: [], kcal: 0, p:0, c:0, f:0, locked: false, eaten: false }));
  // Ensure all 6 slots exist
  const slotMeals = SLOTS.map(slot => selMeals.find(m => m.slot === slot) || { slot, items: [], itemsFull: [], kcal: 0, p:0, c:0, f:0, locked: false, eaten: false });

  // Day-level totals = all items unless explicitly unchecked (eaten === false).
  // Newly logged items default to eaten=true; users uncheck only to remove from day total.
  const eatenTotals = useMemo(() => {
    let kcal = 0, p = 0, c = 0, f = 0;
    slotMeals.forEach(m => {
      (m.itemsFull || []).forEach(it => {
        if (it.eaten !== false) { kcal += it.kcal || 0; p += it.p || 0; c += it.c || 0; f += it.f || 0; }
      });
    });
    return { kcal: Math.round(kcal), p: Math.round(p), c: Math.round(c), f: Math.round(f) };
  }, [slotMeals]);

  // Toggle a single item's eaten state — recomputes slot totals
  const toggleItemEaten = async (slot, itemIdx) => {
    const dayMeals = meals[selDate] || SLOTS.map(s => ({ slot: s, items: [], itemsFull: [], kcal: 0, p:0, c:0, f:0, locked: false, eaten: false }));
    const ensured = SLOTS.map(s => dayMeals.find(m => m.slot === s) || { slot: s, items: [], itemsFull: [], kcal: 0, p:0, c:0, f:0, locked: false, eaten: false });
    const updated = ensured.map(m => {
      if (m.slot !== slot) return m;
      const newItems = (m.itemsFull || []).map((it, i) => {
        if (i !== itemIdx) return it;
        // Flip: explicit false → true, anything else → false
        return { ...it, eaten: it.eaten === false };
      });
      const eat = newItems.filter(it => it.eaten !== false);
      return {
        ...m,
        itemsFull: newItems,
        kcal: eat.reduce((s, it) => s + (it.kcal || 0), 0),
        p:    eat.reduce((s, it) => s + (it.p || 0), 0),
        c:    eat.reduce((s, it) => s + (it.c || 0), 0),
        f:    eat.reduce((s, it) => s + (it.f || 0), 0),
        eaten: eat.length > 0,
      };
    });
    await saveProfileData({ meals: { ...meals, [selDate]: updated } });
  };

  // Delete product / recipe (called from ProductActionsModal)
  const deleteProduct = async (id) => {
    await saveProfileData({ products: products.filter(p => p.id !== id) });
    setToast(T('product.deleted'));
    setTimeout(() => setToast(''), 1600);
  };
  const deleteRecipe = async (id) => {
    await saveProfileData({ recipes: recipes.filter(r => r.id !== id) });
    setToast(T('recipe.deleted'));
    setTimeout(() => setToast(''), 1600);
  };
  // Save edited product
  const updateProduct = async (updated) => {
    await saveProfileData({ products: products.map(p => p.id === updated.id ? updated : p) });
    setEditingProduct(null);
    setToast(T('scan.toast.saved', { name: updated.name }));
    setTimeout(() => setToast(''), 1600);
  };
  // Save edited photo (product OR recipe)
  const saveEditedPhoto = async (newImage) => {
    if (!photoEditing) return;
    if (photoEditing.kind === 'product') {
      await saveProfileData({ products: products.map(p => p.id === photoEditing.id ? { ...p, image: newImage } : p) });
    } else if (photoEditing.kind === 'recipe') {
      await saveProfileData({ recipes: recipes.map(r => r.id === photoEditing.id ? { ...r, image: newImage } : r) });
    }
    setPhotoEditing(null);
  };

  // Day status colors for week strip
  const dayStatuses = WEEK.map((_, i) => {
    const dt = new Date(); dt.setDate(dt.getDate() - ti + i);
    return dayStatus(fmtKey(dt), meals, calories);
  });

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
      // Note: lookupBarcode returns `protein/carbs/fat`; map to internal `p/c/f` keys
      setProductPrefill({
        name: p.name, brand: p.brand || '', store: 'AH', shelf: 'shelf',
        kcal: p.kcal,
        p: p.protein != null ? p.protein : (p.p || 0),
        c: p.carbs   != null ? p.carbs   : (p.c || 0),
        f: p.fat     != null ? p.fat     : (p.f || 0),
        image: p.image,
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
    const existing = recipes.findIndex(r => r.id === newRecipe.id);
    const newList = existing >= 0
      ? recipes.map(r => r.id === newRecipe.id ? newRecipe : r)
      : [...recipes, newRecipe];
    await saveProfileData({ recipes: newList });
    setShowCreateRecipe(false); setEditingRecipe(null);
    setToast(T('scan.toast.recipesaved', { name: newRecipe.name }));
    setTimeout(() => setToast(''), 2200);
  };

  const saveConcept = async (newConcept) => {
    const existing = concepts.findIndex(c => c.id === newConcept.id);
    const newList = existing >= 0
      ? concepts.map(c => c.id === newConcept.id ? newConcept : c)
      : [...concepts, newConcept];
    await saveProfileData({ concepts: newList });
    setConceptType(null); setEditingConcept(null);
    setToast(T('scan.toast.conceptsaved', { name: newConcept.name }));
    setTimeout(() => setToast(''), 2200);
  };

  const deleteConcept = async (id) => {
    await saveProfileData({ concepts: concepts.filter(c => c.id !== id) });
    setToast(T('concept.deleted'));
    setTimeout(() => setToast(''), 1600);
  };

  const duplicateConcept = async (c) => {
    const copy = { ...c, id: c.id + '_' + Date.now(), name: c.name + ' (kopie)', createdAt: new Date().toISOString() };
    await saveProfileData({ concepts: [...concepts, copy] });
    setToast(T('concept.duplicated', { name: copy.name }));
    setTimeout(() => setToast(''), 1600);
  };

  const duplicateRecipe = async (r) => {
    const copy = { ...r, id: r.id + '_' + Date.now(), name: r.name + ' (kopie)', createdAt: new Date().toISOString() };
    await saveProfileData({ recipes: [...recipes, copy] });
    setToast(T('recipe.duplicated', { name: copy.name }));
    setTimeout(() => setToast(''), 1600);
  };

  // — PLANNING ITEM helpers (⋯ on slot items in day-overview) —
  const recalcSlotTotals = (slotItems) => {
    const eaten = slotItems.filter(it => it.eaten !== false);
    return {
      kcal: eaten.reduce((s, it) => s + (it.kcal || 0), 0),
      p:    eaten.reduce((s, it) => s + (it.p || 0), 0),
      c:    eaten.reduce((s, it) => s + (it.c || 0), 0),
      f:    eaten.reduce((s, it) => s + (it.f || 0), 0),
      eaten: eaten.length > 0,
    };
  };
  const updatePlanningItem = async (slot, itemIdx, newGrams) => {
    // Per-item recompute: kcal/macros scale with grams ratio vs the originally-logged grams
    // We use stored "kcal per logged unit" — if it.grams==0, fall back to existing kcal
    const dayMeals = meals[selDate] || SLOTS.map(s => ({ slot: s, items: [], itemsFull: [], kcal: 0, p:0, c:0, f:0, locked: false, eaten: false }));
    const ensured = SLOTS.map(s => dayMeals.find(m => m.slot === s) || { slot: s, items: [], itemsFull: [], kcal: 0, p:0, c:0, f:0, locked: false, eaten: false });
    const updated = ensured.map(m => {
      if (m.slot !== slot) return m;
      const newItems = (m.itemsFull || []).map((it, i) => {
        if (i !== itemIdx) return it;
        const oldG = parseFloat(it.grams) || 100;
        const newG = parseFloat(newGrams) || 100;
        const ratio = newG / oldG;
        return {
          ...it,
          grams: newG,
          kcal: (it.kcal || 0) * ratio,
          p: (it.p || 0) * ratio,
          c: (it.c || 0) * ratio,
          f: (it.f || 0) * ratio,
        };
      });
      return { ...m, itemsFull: newItems, items: newItems.map(it => it.name), ...recalcSlotTotals(newItems) };
    });
    await saveProfileData({ meals: { ...meals, [selDate]: updated } });
  };
  const deletePlanningItem = async (slot, itemIdx) => {
    const dayMeals = meals[selDate] || SLOTS.map(s => ({ slot: s, items: [], itemsFull: [], kcal: 0, p:0, c:0, f:0, locked: false, eaten: false }));
    const ensured = SLOTS.map(s => dayMeals.find(m => m.slot === s) || { slot: s, items: [], itemsFull: [], kcal: 0, p:0, c:0, f:0, locked: false, eaten: false });
    const updated = ensured.map(m => {
      if (m.slot !== slot) return m;
      const newItems = (m.itemsFull || []).filter((_, i) => i !== itemIdx);
      return { ...m, itemsFull: newItems, items: newItems.map(it => it.name), ...recalcSlotTotals(newItems) };
    });
    await saveProfileData({ meals: { ...meals, [selDate]: updated } });
  };

  // — GROCERY SKIP-LIST helpers (per-week skip for items "already in house") —
  const weekKey = (() => {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ti);
    return fmtKey(monday);
  })();
  const grocerySkips = profile?.data?.grocerySkips || {};
  const skippedKeys = new Set(grocerySkips[weekKey] || []);
  const groceryChecked = profile?.data?.groceryChecked || {};
  const checkedKeys = new Set(groceryChecked[weekKey] || []);
  const groceryCustom = profile?.data?.groceryCustom || {};
  const customItems = Array.isArray(groceryCustom[weekKey]) ? groceryCustom[weekKey] : [];
  const groceryItemKey = (it) => `${it.name}|${it.store || ''}`;
  const skipGroceryItem = async (it) => {
    const key = groceryItemKey(it);
    const current = grocerySkips[weekKey] || [];
    if (current.includes(key)) return;
    const newSkips = { ...grocerySkips, [weekKey]: [...current, key] };
    await saveProfileData({ grocerySkips: newSkips });
    setToast(T('grocery.removed', { name: it.name }));
    setTimeout(() => setToast(''), 1800);
  };
  const unskipGroceryItem = async (it) => {
    const key = groceryItemKey(it);
    const current = grocerySkips[weekKey] || [];
    const newSkips = { ...grocerySkips, [weekKey]: current.filter(k => k !== key) };
    await saveProfileData({ grocerySkips: newSkips });
  };
  const toggleGroceryChecked = async (it) => {
    const key = groceryItemKey(it);
    const current = groceryChecked[weekKey] || [];
    const exists = current.includes(key);
    const next = exists ? current.filter(k => k !== key) : [...current, key];
    const newChecked = { ...groceryChecked, [weekKey]: next };
    await saveProfileData({ groceryChecked: newChecked });
  };
  const addCustomGrocery = async () => {
    const name = newGrocName.trim();
    if (!name) return;
    const item = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name,
      qty: newGrocQty.trim(),
      store: newGrocStore.trim(),
      createdAt: new Date().toISOString(),
    };
    const current = Array.isArray(groceryCustom[weekKey]) ? groceryCustom[weekKey] : [];
    const newCustom = { ...groceryCustom, [weekKey]: [...current, item] };
    await saveProfileData({ groceryCustom: newCustom });
    setNewGrocName(''); setNewGrocQty(''); setNewGrocStore('');
    setShowAddGrocery(false);
    setToast(T('grocery.added', { name }));
    setTimeout(() => setToast(''), 1800);
  };
  const removeCustomGrocery = async (id, name) => {
    const current = Array.isArray(groceryCustom[weekKey]) ? groceryCustom[weekKey] : [];
    const newCustom = { ...groceryCustom, [weekKey]: current.filter(c => c.id !== id) };
    await saveProfileData({ groceryCustom: newCustom });
    setToast(T('grocery.removed', { name }));
    setTimeout(() => setToast(''), 1800);
  };

  const tabs = [
    { k: 'week', l: T('nutr.tab.planning') },
    { k: 'products', l: T('nutr.tab.products') },
    { k: 'groceries', l: T('nutr.tab.groceries') },
    { k: 'concepts', l: T('nutr.tab.concepts') },
  ];

  // + button context-aware: opens correct create flow per sub-tab
  const handlePlus = () => {
    if (sub === 'products') { setProductPrefill(null); setShowCreateProduct(true); }
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTop: `1px solid ${t.border}`, fontSize: 11, color: t.muted }}>
                <div>{T('nutr.target')} {calories || '—'} kcal</div>
                <div onClick={(e) => { e.stopPropagation(); setShowLegend(true); }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 8, background: t.card2, border: `1px solid ${t.border}`, cursor: 'pointer', color: t.soft }}>
                  <span style={{ width: 14, height: 14, borderRadius: 7, border: `1.2px solid ${t.soft}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>i</span>
                  <span style={{ fontSize: 10.5, fontWeight: 600 }}>{T('status.info')}</span>
                </div>
              </div>
            </Card>

            {/* Day label + eaten kcal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 4px 12px' }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: t.text }}>{weekDayShort(lang, selectedDay).charAt(0) + weekDayShort(lang, selectedDay).slice(1).toLowerCase()}, {dates[selectedDay]} {monthShort(lang)}</div>
              <div style={{ fontSize: 12, color: t.soft }}>{eatenTotals.kcal} / {calories || '—'} kcal</div>
            </div>

            {/* 3 macro rings — Yazio-style */}
            <Card style={{ padding: 16 }}>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
                {[
                  { label: T('macros.protein'), color: t.protein, target: d.protein || 0, value: eatenTotals.p, icon: 'egg' },
                  { label: T('macros.carbs'),   color: t.carbs,   target: d.carbs   || 0, value: eatenTotals.c, icon: 'wheat' },
                  { label: T('macros.fat'),     color: t.fat,     target: d.fat     || 0, value: eatenTotals.f, icon: 'drop' },
                ].map(macro => {
                  const noTarget = !macro.target;
                  const ratio = noTarget ? 0 : macro.value / macro.target;
                  const pct = Math.round(ratio * 100);
                  const diff = Math.round(macro.value - macro.target);
                  return (
                    <div key={macro.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ fontSize: 10.5, color: macro.color, fontWeight: 700, marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{macro.label}</div>
                      <MacroRing percent={pct} color={macro.color} size={68} value={Math.round(macro.value)} noTarget={noTarget} />
                      <div style={{ fontSize: 11, color: noTarget ? t.muted : (ratio > 1 ? t.warning : t.muted), fontWeight: 700, marginTop: 8 }}>
                        {noTarget
                          ? T('day.macros.eaten', { g: Math.round(macro.value) })
                          : ratio > 1
                            ? T('day.macros.over', { g: Math.abs(diff) })
                            : T('day.macros.left', { g: Math.max(0, -diff) })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Meal sections — Yazio-style (replaces old slot cards) */}
            <div style={{ marginTop: 18 }}>
              {slotMeals.map((m, i) => {
                const items = m.itemsFull || [];
                const sectionKcal = items.reduce((s, it) => s + (it.eaten !== false ? (it.kcal || 0) : 0), 0);
                const pctOfDay = calories ? Math.round((sectionKcal / calories) * 100) : 0;
                return (
                  <div key={i} style={{ marginBottom: 18 }}>
                    {/* Section header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 4px 8px', borderBottom: `1px solid ${t.border}` }}>
                      <div>
                        <div style={{ fontSize: 17, fontWeight: 800, color: t.text, letterSpacing: '-0.01em' }}>{T(slotKey(m.slot))}</div>
                        {items.length > 0 && (
                          <div style={{ fontSize: 12, color: t.green, fontWeight: 600, marginTop: 2 }}>
                            {T('day.section.kcal', { kcal: sectionKcal, pct: pctOfDay })}
                          </div>
                        )}
                      </div>
                      <div onClick={() => { setActiveSlot(m.slot); setSub('products'); }} style={{
                        width: 32, height: 32, borderRadius: 16,
                        border: `1.5px solid ${t.green}`, color: t.green,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, fontWeight: 700, cursor: 'pointer',
                      }}>+</div>
                    </div>

                    {/* Items list (or empty hint) */}
                    {items.length === 0 ? (
                      <div onClick={() => { setActiveSlot(m.slot); setSub('products'); }} style={{
                        padding: '14px', textAlign: 'center', color: t.muted, fontSize: 12,
                        cursor: 'pointer',
                      }}>
                        {T('day.section.empty')}
                      </div>
                    ) : (
                      <div style={{ marginTop: 8, background: t.card, borderRadius: 14, border: `1px solid ${t.border}`, boxShadow: t.cardShadow, overflow: 'hidden' }}>
                        {items.map((it, idx) => {
                          const isEaten = it.eaten !== false;
                          return (
                            <div key={idx} onClick={() => setPlanningItemActions({ slot: m.slot, idx, item: it })} style={{
                              display: 'flex', alignItems: 'center', gap: 12, padding: 12,
                              borderBottom: idx < items.length - 1 ? `1px solid ${t.border}` : 'none',
                              opacity: isEaten ? 1 : 0.5, cursor: 'pointer',
                            }}>
                              {it.image ? (
                                <img src={it.image} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', background: '#fff', flexShrink: 0 }} />
                              ) : (
                                <div style={{ width: 36, height: 36, borderRadius: 8, background: t.card3, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <Icon name="apple" size={18} color={t.green} />
                                </div>
                              )}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13.5, fontWeight: 700, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: isEaten ? 'none' : 'line-through' }}>{it.name}</div>
                                <div style={{ fontSize: 11.5, color: t.muted, marginTop: 2 }}>
                                  {it.kcal} kcal · {it.count || 1}× ({Math.round(it.grams || 0)}g)
                                </div>
                              </div>
                              <div onClick={(e) => { e.stopPropagation(); toggleItemEaten(m.slot, idx); }} style={{
                                width: 22, height: 22, borderRadius: 11, flexShrink: 0, cursor: 'pointer',
                                border: `2px solid ${isEaten ? t.green : t.muted}`,
                                background: isEaten ? t.green : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                {isEaten && <Icon name="check" size={12} color="#0A0A0B" stroke={3} />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Floating + button — Yazio-style */}
            <div onClick={() => setSub('products')} style={{
              position: 'sticky', bottom: 18, marginLeft: 'auto', marginRight: 4,
              width: 56, height: 56, borderRadius: 28,
              background: t.metalGreen,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: '0 12px 28px rgba(34,197,94,0.45), inset 0 1px 0 rgba(255,255,255,0.2)',
              zIndex: 10,
            }}>
              <Icon name="plus" size={28} color="#0A0A0B" stroke={2.6} />
            </div>
          </>
        )}

        {sub === 'products' && (
          <LogLibrary
            onProductTap={async (p) => {
              // Auto-save remote hits (OFF, USDA, NEVO) to local library on first tap
              if ((p.source === 'openfoodfacts' || p.source === 'usda' || p.source === 'nevo') && !products.find(x => x.id === p.id)) {
                const saved = { ...p, createdAt: new Date().toISOString() };
                await saveProfileData({ products: [...products, saved] });
                setOpenProduct(saved);
              } else {
                setOpenProduct(p);
              }
            }}
            onOpenBarcode={() => setShowScanner(true)}
            onProductActions={(p) => setActionsTarget({ kind: 'product', item: p })}
            onRecipeActions={(r) => setRecipeActions(r)}
            onAddProduct={() => { setProductPrefill(null); setShowCreateProduct(true); }}
            onAddMeal={() => setShowCreateRecipe(true)}
          />
        )}

        {sub === 'groceries' && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
              <Chip active={grocMode === 'simple'} onClick={() => setGrocMode('simple')}>{T('nutr.simple')}</Chip>
              <Chip active={grocMode === 'smart'} onClick={() => setGrocMode('smart')}>{T('nutr.smart')}</Chip>
              <div style={{ flex: 1 }} />
              <div onClick={() => setShowAddGrocery(true)} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 16,
                background: t.greenBg, border: `1px solid ${t.greenBorder}`, color: t.green,
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>
                + {T('grocery.add')}
              </div>
            </div>
            {(!hasGroceries && customItems.length === 0) ? (
              <div style={{ padding: 40, textAlign: 'center', borderRadius: 16, background: t.card, border: `1px dashed ${t.border}` }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🛒</div>
                <div style={{ fontSize: 14, color: t.text, fontWeight: 600, marginBottom: 6 }}>{T('nutr.emptygroceries')}</div>
                <div style={{ fontSize: 12, color: t.muted, lineHeight: 1.5, marginBottom: 14 }}>{T('nutr.emptygroceriesbody')}</div>
                <Btn small variant="ghost" onClick={() => setShowAddGrocery(true)}>+ {T('grocery.add')}</Btn>
              </div>
            ) : grocMode === 'smart' ? (
              <>
                {Object.entries(groceriesByShelf).map(([cat, allItems]) => {
                  const items = allItems.filter(it => !skippedKeys.has(groceryItemKey(it)));
                  if (items.length === 0) return null;
                  return (
                    <Card key={cat} style={{ padding: 14 }}>
                      <Label color={cat === 'fresh' ? t.green : cat === 'refrigerated' ? t.protein : t.muted}>
                        {cat === 'shelf' ? T('nutr.shelfstable') : cat === 'refrigerated' ? T('nutr.refrigerated') : T('nutr.fresh')}
                      </Label>
                      {items.map((it, i) => {
                        const itKey = groceryItemKey(it);
                        const isChecked = checkedKeys.has(itKey);
                        return (
                          <div key={i} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0',
                            borderBottom: i < items.length - 1 ? `1px solid ${t.border}` : 'none',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                              <div onClick={(e) => { e.stopPropagation(); toggleGroceryChecked(it); }} style={{
                                width: 22, height: 22, borderRadius: 6,
                                border: `1.5px solid ${isChecked ? t.green : t.border}`,
                                background: isChecked ? t.green : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0, cursor: 'pointer',
                              }}>
                                {isChecked && <Icon name="check" size={14} color="#0A0A0B" stroke={3} />}
                              </div>
                              <div onClick={() => setGroceriesItemActions({ key: itKey, item: it, isCustom: false })} style={{ minWidth: 0, flex: 1, cursor: 'pointer' }}>
                                <div style={{ fontSize: 14, color: isChecked ? t.muted : t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: isChecked ? 'line-through' : 'none' }}>{it.name}</div>
                                <div style={{ fontSize: 11, color: t.muted }}>{it.store}</div>
                              </div>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: t.soft, flexShrink: 0, opacity: isChecked ? 0.4 : 1 }}>{it.amt}</div>
                          </div>
                        );
                      })}
                    </Card>
                  );
                })}
                {customItems.length > 0 && (
                  <Card style={{ padding: 14 }}>
                    <Label color={t.green}>{T('grocery.custom.section')}</Label>
                    {customItems.map((it, i) => {
                      const itKey = `custom:${it.id}`;
                      const isChecked = checkedKeys.has(itKey);
                      return (
                        <div key={it.id} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0',
                          borderBottom: i < customItems.length - 1 ? `1px solid ${t.border}` : 'none',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                            <div onClick={(e) => { e.stopPropagation(); toggleGroceryChecked({ name: itKey, store: '' }); }} style={{
                              width: 22, height: 22, borderRadius: 6,
                              border: `1.5px solid ${isChecked ? t.green : t.border}`,
                              background: isChecked ? t.green : 'transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0, cursor: 'pointer',
                            }}>
                              {isChecked && <Icon name="check" size={14} color="#0A0A0B" stroke={3} />}
                            </div>
                            <div onClick={() => setGroceriesItemActions({ key: itKey, item: it, isCustom: true })} style={{ minWidth: 0, flex: 1, cursor: 'pointer' }}>
                              <div style={{ fontSize: 14, color: isChecked ? t.muted : t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: isChecked ? 'line-through' : 'none' }}>{it.name}</div>
                              {it.store && <div style={{ fontSize: 11, color: t.muted }}>{it.store}</div>}
                            </div>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: t.soft, flexShrink: 0, opacity: isChecked ? 0.4 : 1 }}>{it.qty}</div>
                        </div>
                      );
                    })}
                  </Card>
                )}
                {skippedKeys.size > 0 && (
                  <div style={{ fontSize: 11, color: t.muted, textAlign: 'center', marginTop: 8 }}>
                    {T('grocery.skippedhint', { count: skippedKeys.size })}
                  </div>
                )}
              </>
            ) : (
              <Card style={{ padding: 14 }}>
                {[...Object.values(groceriesByShelf).flat().filter(it => !skippedKeys.has(groceryItemKey(it))).map(it => ({ ...it, _isCustom: false, _key: groceryItemKey(it) })),
                  ...customItems.map(it => ({ name: it.name, store: it.store, amt: it.qty, _isCustom: true, _key: `custom:${it.id}`, _id: it.id }))
                ].map((it, i, arr) => {
                  const isChecked = checkedKeys.has(it._key);
                  return (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0',
                      borderBottom: i < arr.length - 1 ? `1px solid ${t.border}` : 'none',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                        <div onClick={(e) => { e.stopPropagation(); toggleGroceryChecked(it._isCustom ? { name: it._key, store: '' } : it); }} style={{
                          width: 22, height: 22, borderRadius: 6,
                          border: `1.5px solid ${isChecked ? t.green : t.border}`,
                          background: isChecked ? t.green : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, cursor: 'pointer',
                        }}>
                          {isChecked && <Icon name="check" size={14} color="#0A0A0B" stroke={3} />}
                        </div>
                        <div onClick={() => setGroceriesItemActions({ key: it._key, item: it._isCustom ? { ...it, id: it._id } : it, isCustom: it._isCustom })} style={{ minWidth: 0, flex: 1, cursor: 'pointer' }}>
                          <div style={{ fontSize: 14, color: isChecked ? t.muted : t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: isChecked ? 'line-through' : 'none' }}>{it.name}</div>
                          {it.store && <div style={{ fontSize: 11, color: t.muted }}>{it.store}</div>}
                        </div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: t.soft, flexShrink: 0, opacity: isChecked ? 0.4 : 1 }}>{it.amt}</div>
                    </div>
                  );
                })}
              </Card>
            )}
          </>
        )}

        {sub === 'concepts' && (
          <>
            {(() => {
              const dayConcepts = concepts.filter(c => c.type === 'day');
              const canMakeWeek = dayConcepts.length > 0;
              return (
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  <Btn small full variant="ghost" onClick={() => setConceptType('day')}>{T('nutr.adddayconcept')}</Btn>
                  <Btn small full variant="ghost"
                    onClick={() => {
                      if (canMakeWeek) setConceptType('week');
                      else { setToast(T('modal.needdayconcept')); setTimeout(() => setToast(''), 2200); }
                    }}
                    style={{ opacity: canMakeWeek ? 1 : 0.4 }}
                  >{T('nutr.addweekconcept')}</Btn>
                </div>
              );
            })()}
            {concepts.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', borderRadius: 16, background: t.card, border: `1px dashed ${t.border}` }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
                <div style={{ fontSize: 14, color: t.text, fontWeight: 600, marginBottom: 6 }}>{T('nutr.noconcepts')}</div>
                <div style={{ fontSize: 12, color: t.muted, lineHeight: 1.5 }}>{T('nutr.noconceptsbody')}</div>
              </div>
            ) : concepts.map((c) => (
              <Card key={c.id} style={{ padding: 14, cursor: 'pointer' }} onClick={() => setConceptActions(c)}>
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
                    <div style={{ fontSize: 11.5, color: t.muted }}>{c.kcal} kcal{c.type === 'week' ? '/' + T('common.dayshort') + ' ' + T('common.avg') : ''}</div>
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
        <Btn full variant="ghost" style={{ marginBottom: 8 }} onClick={() => {
          const slotName = showMealOptions !== null ? slotMeals[showMealOptions].slot : 'Lunch';
          setShowMealOptions(null);
          setSub('products');
          setToast(T('nutr.tab.products') + ' — ' + T(slotKey(slotName)));
          setTimeout(() => setToast(''), 2000);
        }}>{T('nutr.choosereciple')}</Btn>
        <Btn full variant="ghost" style={{ marginBottom: 8 }} onClick={() => {
          setShowMealOptions(null);
          setShowScanner(true);
        }}>{T('nutr.scanproduct')}</Btn>
        <Btn full variant="ghost" style={{ marginBottom: 8 }}>{showMealOptions !== null && slotMeals[showMealOptions].locked ? T('nutr.unlockmeal') : T('nutr.lockmeal')}</Btn>
        <Btn full variant="outline">{showMealOptions !== null && slotMeals[showMealOptions].eaten ? T('nutr.marknoteaten') : T('nutr.markeaten')}</Btn>
      </Modal>

      {/* Color legend */}
      <Modal visible={showLegend} onClose={() => setShowLegend(false)} title={T('status.title')}>
        {['green','yellow','orange','red'].map(s => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: s !== 'red' ? `1px solid ${t.border}` : 'none' }}>
            <div style={{ width: 14, height: 14, borderRadius: 7, background: STATUS[s].dot, flexShrink: 0, boxShadow: `0 0 12px ${STATUS[s].dot}55` }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: STATUS[s].label }}>{T('status.' + s)}</div>
              <div style={{ fontSize: 12, color: t.soft, marginTop: 2 }}>{T('status.' + s + '.desc')}</div>
            </div>
          </div>
        ))}
        <Btn full variant="outline" onClick={() => setShowLegend(false)} style={{ marginTop: 14 }}>{T('common.close')}</Btn>
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
      <CreateRecipeModal
        visible={showCreateRecipe || !!editingRecipe}
        onClose={() => { setShowCreateRecipe(false); setEditingRecipe(null); }}
        onSave={saveRecipe}
        products={products}
        editing={editingRecipe}
        onCreateProduct={(p) => saveProfileData({ products: [...products, p] })}
      />
      <CreateConceptModal
        visible={conceptType !== null || !!editingConcept}
        onClose={() => { setConceptType(null); setEditingConcept(null); }}
        onSave={saveConcept}
        type={editingConcept ? editingConcept.type : conceptType}
        recipes={recipes}
        products={products}
        dayConcepts={concepts.filter(c => c.type === 'day')}
        editing={editingConcept}
        onCreateProduct={(p) => saveProfileData({ products: [...products, p] })}
      />

      {/* Barcode scanner */}
      <BarcodeScanner visible={showScanner} onClose={() => setShowScanner(false)} onResult={handleScanResult} />
      <ScannedProductModal barcode={scannedCode} onClose={() => setScannedCode(null)} onSave={handleProductSave} />

      {/* Product detail (Module A: log flow) */}
      <ProductDetailModal
        visible={!!openProduct}
        product={openProduct}
        onClose={() => setOpenProduct(null)}
        defaultSlot={activeSlot || (showMealOptions !== null ? slotMeals[showMealOptions]?.slot : 'Lunch')}
        onLogged={({ kcal, slot }) => {
          setActiveSlot(null);
          setSub('week'); // jump back to day overview so user sees what was added
          setToast(T('product.logged.toast', { kcal, slot }));
          setTimeout(() => setToast(''), 2400);
        }}
        onEditPhoto={openProduct ? () => setPhotoEditing({ kind: 'product', id: openProduct.id, currentImage: openProduct.image }) : null}
        onEditProduct={openProduct ? () => { setEditingProduct(openProduct); setOpenProduct(null); } : null}
      />

      {/* Actions menu (⋯) for products & recipes in list view */}
      <ProductActionsModal
        visible={!!actionsTarget}
        onClose={() => setActionsTarget(null)}
        title={actionsTarget?.item?.name || ''}
        onEdit={() => {
          if (actionsTarget?.kind === 'product') setEditingProduct(actionsTarget.item);
          else if (actionsTarget?.kind === 'recipe') setShowCreateRecipe(true); // recipe edit reuses create modal — extend later
        }}
        onChangePhoto={() => {
          if (!actionsTarget) return;
          setPhotoEditing({ kind: actionsTarget.kind, id: actionsTarget.item.id, currentImage: actionsTarget.item.image });
        }}
        onDelete={() => {
          if (!actionsTarget) return;
          if (actionsTarget.kind === 'product') deleteProduct(actionsTarget.item.id);
          else if (actionsTarget.kind === 'recipe') deleteRecipe(actionsTarget.item.id);
        }}
      />

      {/* Edit product modal — reuses CreateProductModal with `editing` */}
      <CreateProductModal
        visible={!!editingProduct}
        editing={editingProduct}
        onClose={() => setEditingProduct(null)}
        onSave={updateProduct}
      />

      {/* Edit photo modal */}
      <EditPhotoModal
        visible={!!photoEditing}
        onClose={() => setPhotoEditing(null)}
        currentImage={photoEditing?.currentImage}
        onSave={saveEditedPhoto}
      />

      {/* RECIPE actions menu (⋯) */}
      <Modal visible={!!recipeActions} onClose={() => setRecipeActions(null)} title={recipeActions?.name || ''}>
        <Btn full variant="ghost" style={{ marginBottom: 8 }} onClick={() => {
          const r = recipeActions; setRecipeActions(null); setEditingRecipe(r);
        }}>{T('common.edit')}</Btn>
        <Btn full variant="ghost" style={{ marginBottom: 8 }} onClick={() => {
          duplicateRecipe(recipeActions); setRecipeActions(null);
        }}>{T('common.duplicate')}</Btn>
        <Btn full variant="outline" style={{ color: '#F87171', borderColor: 'rgba(248,113,113,0.3)' }} onClick={() => {
          setConfirmDelete({ kind: 'recipe', item: recipeActions }); setRecipeActions(null);
        }}>{T('common.delete')}</Btn>
      </Modal>

      {/* CONCEPT actions menu (⋯) */}
      <Modal visible={!!conceptActions} onClose={() => setConceptActions(null)} title={conceptActions?.name || ''}>
        <Btn full variant="ghost" style={{ marginBottom: 8 }} onClick={() => {
          const c = conceptActions; setConceptActions(null); setEditingConcept(c);
        }}>{T('common.edit')}</Btn>
        <Btn full variant="ghost" style={{ marginBottom: 8 }} onClick={() => {
          duplicateConcept(conceptActions); setConceptActions(null);
        }}>{T('common.duplicate')}</Btn>
        <Btn full variant="outline" style={{ color: '#F87171', borderColor: 'rgba(248,113,113,0.3)' }} onClick={() => {
          setConfirmDelete({ kind: 'concept', item: conceptActions }); setConceptActions(null);
        }}>{T('common.delete')}</Btn>
      </Modal>

      {/* CONFIRM DELETE (shared) */}
      <Modal visible={!!confirmDelete} onClose={() => setConfirmDelete(null)} title={T('confirm.delete.title')}>
        <div style={{ fontSize: 14, color: t.text, marginBottom: 8 }}>{T('confirm.delete.body', { name: confirmDelete?.item?.name || '' })}</div>
        <div style={{ fontSize: 12, color: t.muted, marginBottom: 18 }}>{T('confirm.delete.irreversible')}</div>
        <Btn full onClick={async () => {
          if (!confirmDelete) return;
          if (confirmDelete.kind === 'recipe') await deleteRecipe(confirmDelete.item.id);
          else if (confirmDelete.kind === 'concept') await deleteConcept(confirmDelete.item.id);
          setConfirmDelete(null);
        }} style={{ background: '#DC2626', color: '#fff', marginBottom: 8 }}>{T('common.delete')}</Btn>
        <Btn full variant="outline" onClick={() => setConfirmDelete(null)}>{T('common.cancel')}</Btn>
      </Modal>

      {/* PLANNING SLOT-ITEM actions menu (⋯) */}
      <Modal visible={!!planningItemActions} onClose={() => setPlanningItemActions(null)} title={planningItemActions?.item?.name || ''}>
        <Btn full variant="ghost" style={{ marginBottom: 8 }} onClick={() => {
          const a = planningItemActions; setPlanningItemActions(null); setEditingPlanningItem(a);
        }}>{T('common.edit')} ({T('modal.edit.grams').toLowerCase()})</Btn>
        <Btn full variant="outline" style={{ color: '#F87171', borderColor: 'rgba(248,113,113,0.3)' }} onClick={async () => {
          const a = planningItemActions; setPlanningItemActions(null);
          if (a) await deletePlanningItem(a.slot, a.idx);
        }}>{T('common.delete')}</Btn>
      </Modal>

      {/* PLANNING ITEM edit modal — adjust grams */}
      <Modal visible={!!editingPlanningItem} onClose={() => setEditingPlanningItem(null)} title={editingPlanningItem?.item?.name || ''}>
        {editingPlanningItem && (() => {
          const it = editingPlanningItem.item;
          return (
            <PlanningGramEditor
              initialGrams={parseFloat(it.grams) || 100}
              currentKcal={it.kcal || 0}
              onSave={async (newGrams) => {
                const a = editingPlanningItem;
                setEditingPlanningItem(null);
                await updatePlanningItem(a.slot, a.idx, newGrams);
              }}
              onCancel={() => setEditingPlanningItem(null)}
              T={T}
            />
          );
        })()}
      </Modal>

      {/* GROCERIES item actions */}
      <Modal visible={!!groceriesItemActions} onClose={() => setGroceriesItemActions(null)} title={groceriesItemActions?.item?.name || ''}>
        <div style={{ fontSize: 12, color: t.muted, marginBottom: 14, lineHeight: 1.5 }}>
          {groceriesItemActions?.isCustom ? T('grocery.removehint.custom') : T('grocery.removehint.auto')}
        </div>
        <Btn full variant="ghost" style={{ marginBottom: 8 }} onClick={async () => {
          const a = groceriesItemActions; setGroceriesItemActions(null);
          if (!a) return;
          if (a.isCustom) await removeCustomGrocery(a.item.id, a.item.name);
          else await skipGroceryItem(a.item);
        }}>{T('grocery.remove')}</Btn>
        <Btn full variant="outline" onClick={() => setGroceriesItemActions(null)}>{T('common.cancel')}</Btn>
      </Modal>

      {/* GROCERIES add custom item */}
      <Modal visible={showAddGrocery} onClose={() => setShowAddGrocery(false)} title={T('grocery.add.title')}>
        <Field label={T('grocery.add.name')}>
          <input
            type="text"
            value={newGrocName}
            onChange={(e) => setNewGrocName(e.target.value)}
            placeholder={T('grocery.add.name.ph')}
            autoFocus
            style={{ width: '100%', padding: '12px 14px', borderRadius: 10, background: t.card2, border: `1px solid ${t.border}`, color: t.text, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
        </Field>
        <Field label={T('grocery.add.qty')}>
          <input
            type="text"
            value={newGrocQty}
            onChange={(e) => setNewGrocQty(e.target.value)}
            placeholder={T('grocery.add.qty.ph')}
            style={{ width: '100%', padding: '12px 14px', borderRadius: 10, background: t.card2, border: `1px solid ${t.border}`, color: t.text, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
        </Field>
        <Field label={T('grocery.add.store')}>
          <input
            type="text"
            value={newGrocStore}
            onChange={(e) => setNewGrocStore(e.target.value)}
            placeholder={T('grocery.add.store.ph')}
            style={{ width: '100%', padding: '12px 14px', borderRadius: 10, background: t.card2, border: `1px solid ${t.border}`, color: t.text, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
        </Field>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <Btn full variant="outline" onClick={() => { setShowAddGrocery(false); setNewGrocName(''); setNewGrocQty(''); setNewGrocStore(''); }}>{T('common.cancel')}</Btn>
          <Btn full onClick={addCustomGrocery} disabled={!newGrocName.trim()}>{T('common.save')}</Btn>
        </div>
      </Modal>

      {/* Toast */}
      <Toast message={toast} visible={!!toast} />
    </div>
  );
}

/* ─────────────────────── PlanningGramEditor ─────────────────────── */
function PlanningGramEditor({ initialGrams, currentKcal, onSave, onCancel, T }) {
  const [g, setG] = useState(String(initialGrams));
  const oldG = parseFloat(initialGrams) || 100;
  const newG = parseFloat(g) || 0;
  const ratio = oldG > 0 ? newG / oldG : 0;
  const newKcal = Math.round((currentKcal || 0) * ratio);
  return (
    <>
      <div style={{ padding: 12, background: t.card3, borderRadius: 12, marginBottom: 14, border: `1px solid ${t.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: t.muted }}>{T('common.newtotal')}</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: t.green }}>{newKcal} kcal</div>
        </div>
      </div>
      <Field label={T('modal.edit.grams')} value={g} onChange={v => setG(v.replace(',', '.'))} placeholder="100" type="number" unit="g" />
      <Btn full onClick={() => onSave(newG)} style={{ marginTop: 8 }}>{T('common.save')}</Btn>
      <Btn full variant="outline" onClick={onCancel} style={{ marginTop: 8 }}>{T('common.cancel')}</Btn>
    </>
  );
}
