import { useState } from 'react';
import { useData } from '../contexts/DataContext';

const ICON_OPTIONS = ['target', 'dollar', 'users', 'heart'];
const blank = () => ({ id: Date.now(), value: 0, prefix: '', suffix: '%', label: 'New Metric', description: '', icon: 'target' });

export default function EditMetrics({ onToast }) {
  const { metrics, saveSection } = useData();
  const [items, setItems] = useState(metrics.items.map((m, i) => ({ ...m, id: m.id ?? i })));
  const [editIdx, setEditIdx] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);

  const openEdit = (idx) => { setEditIdx(idx); setEditItem({ ...items[idx] }); };
  const cancelEdit = () => { setEditIdx(null); setEditItem(null); };
  const applyEdit = () => {
    setItems(prev => prev.map((m, i) => i === editIdx ? editItem : m));
    cancelEdit();
  };
  const deleteItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));
  const addItem = () => { setItems(prev => [...prev, blank()]); setEditIdx(items.length); setEditItem(blank()); };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSection('metrics', { items });
      onToast('Metrics saved!');
    } catch {
      onToast('Save failed — check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const setEdit = (k, v) => setEditItem(e => ({ ...e, [k]: v }));

  return (
    <div>
      <h2 className="admin-section-title">Metrics</h2>
      <p className="admin-section-desc">The animated stat cards in the "By the Numbers" section.</p>

      <div className="mt-6 space-y-3">
        {items.map((m, idx) => (
          <div key={m.id}>
            {editIdx === idx ? (
              <div className="admin-card border-2 border-blush-300">
                <div className="grid sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="admin-label">Value</label>
                    <input type="number" value={editItem.value} onChange={e => setEdit('value', parseFloat(e.target.value))} className="admin-input" />
                  </div>
                  <div>
                    <label className="admin-label">Prefix (e.g. $)</label>
                    <input value={editItem.prefix ?? ''} onChange={e => setEdit('prefix', e.target.value)} className="admin-input" />
                  </div>
                  <div>
                    <label className="admin-label">Suffix (e.g. %)</label>
                    <input value={editItem.suffix ?? ''} onChange={e => setEdit('suffix', e.target.value)} className="admin-input" />
                  </div>
                  <div>
                    <label className="admin-label">Label</label>
                    <input value={editItem.label} onChange={e => setEdit('label', e.target.value)} className="admin-input" />
                  </div>
                  <div>
                    <label className="admin-label">Icon</label>
                    <select value={editItem.icon} onChange={e => setEdit('icon', e.target.value)} className="admin-input">
                      {ICON_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="admin-label">Description</label>
                    <input value={editItem.description} onChange={e => setEdit('description', e.target.value)} className="admin-input" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={applyEdit} className="btn-primary text-xs px-4 py-2">Apply</button>
                  <button onClick={cancelEdit} className="btn-outline text-xs px-4 py-2">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="admin-card flex items-center justify-between gap-4">
                <div>
                  <span className="font-display text-2xl text-blush-500">{m.prefix}{m.value}{m.suffix}</span>
                  <span className="font-body text-sm font-semibold text-gray-700 ml-3">{m.label}</span>
                  <p className="font-body text-xs text-gray-400 mt-0.5">{m.description}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => openEdit(idx)} className="admin-btn-sm">Edit</button>
                  <button onClick={() => deleteItem(idx)} className="admin-btn-sm text-red-500">Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-4">
        <button onClick={addItem} className="btn-outline text-sm">+ Add Metric</button>
        <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">
          {saving ? 'Saving…' : 'Save Metrics'}
        </button>
      </div>
    </div>
  );
}
