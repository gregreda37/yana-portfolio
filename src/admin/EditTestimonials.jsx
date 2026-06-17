import { useState } from 'react';
import { useData } from '../contexts/DataContext';

const COLOR_OPTIONS = [
  'bg-lavender-200', 'bg-blush-200', 'bg-pink-200', 'bg-purple-100', 'bg-rose-100',
];
const blank = () => ({ id: Date.now(), quote: '', name: '', title: '', company: '', initials: '', color: 'bg-blush-200' });

export default function EditTestimonials({ onToast }) {
  const { testimonials, saveSection } = useData();
  const [items, setItems] = useState(testimonials.items.map((t, i) => ({ ...t, id: t.id ?? i })));
  const [editIdx, setEditIdx] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);

  const openEdit = (idx) => { setEditIdx(idx); setEditItem({ ...items[idx] }); };
  const applyEdit = () => { setItems(p => p.map((t, i) => i === editIdx ? editItem : t)); setEditIdx(null); };
  const set = (k, v) => setEditItem(e => ({ ...e, [k]: v }));
  const addItem = () => { const b = blank(); setItems(p => [...p, b]); setEditIdx(items.length); setEditItem(b); };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSection('testimonials', { items });
      onToast('Testimonials saved!');
    } catch {
      onToast('Save failed — check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="admin-section-title">Testimonials</h2>
      <p className="admin-section-desc">Client quotes shown in the carousel.</p>

      <div className="mt-6 space-y-3">
        {items.map((t, idx) => (
          <div key={t.id}>
            {editIdx === idx ? (
              <div className="admin-card border-2 border-blush-300 space-y-3">
                <div>
                  <label className="admin-label">Quote</label>
                  <textarea rows={4} className="admin-input resize-none" value={editItem.quote} onChange={e => set('quote', e.target.value)} />
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  {[['Name', 'name'], ['Title', 'title'], ['Company', 'company']].map(([label, key]) => (
                    <div key={key}>
                      <label className="admin-label">{label}</label>
                      <input value={editItem[key]} onChange={e => set(key, e.target.value)} className="admin-input" />
                    </div>
                  ))}
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="admin-label">Initials (2 chars)</label>
                    <input maxLength={2} value={editItem.initials} onChange={e => set('initials', e.target.value.toUpperCase())} className="admin-input" />
                  </div>
                  <div>
                    <label className="admin-label">Avatar Color</label>
                    <select value={editItem.color} onChange={e => set('color', e.target.value)} className="admin-input">
                      {COLOR_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={applyEdit} className="btn-primary text-xs px-4 py-2">Apply</button>
                  <button onClick={() => setEditIdx(null)} className="btn-outline text-xs px-4 py-2">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="admin-card flex items-start justify-between gap-4">
                <div className="flex gap-3 items-start">
                  <div className={`w-9 h-9 ${t.color} rounded-full flex items-center justify-center shrink-0`}>
                    <span className="font-display text-sm text-gray-700">{t.initials}</span>
                  </div>
                  <div>
                    <p className="font-body font-semibold text-sm text-gray-800">{t.name} <span className="font-normal text-gray-400">— {t.company}</span></p>
                    <p className="font-body text-xs text-gray-500 mt-1 line-clamp-2 italic">"{t.quote.slice(0, 100)}…"</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => openEdit(idx)} className="admin-btn-sm">Edit</button>
                  <button onClick={() => setItems(p => p.filter((_, i) => i !== idx))} className="admin-btn-sm text-red-500">Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-4">
        <button onClick={addItem} className="btn-outline text-sm">+ Add Testimonial</button>
        <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">
          {saving ? 'Saving…' : 'Save Testimonials'}
        </button>
      </div>
    </div>
  );
}
