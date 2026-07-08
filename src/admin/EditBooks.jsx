import { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { useData } from '../contexts/DataContext';

const COVER_COLORS = [
  'from-blush-400 to-blush-600', 'from-lavender-300 to-lavender-500',
  'from-pink-300 to-rose-400', 'from-purple-300 to-blush-400', 'from-rose-300 to-blush-500',
];
const TAG_COLORS = [
  'bg-blush-100 text-blush-600', 'bg-lavender-100 text-purple-600',
  'bg-pink-100 text-pink-600', 'bg-rose-100 text-rose-600', 'bg-purple-100 text-purple-600',
];
const GENRES = [
  'Business', 'Sales Strategy', 'Leadership', 'Negotiation', 'Productivity',
  'Personal Development', 'Biography', 'Self-Help', 'Fiction', 'Psychology', 'Other',
];
const blankTakeaway = () => ({ heading: '', body: '' });
const blank = () => ({
  id: Date.now(), title: '', author: '', year: new Date().getFullYear(),
  rating: 5, genre: '', hidden: false, synopsis: '', applyToSales: '',
  coverColor: COVER_COLORS[0], tagColor: TAG_COLORS[0],
  takeaways: [blankTakeaway()],
});

export default function EditBooks({ onToast }) {
  const { books, saveSection } = useData();
  const [items, setItems] = useState(books.items.map((b, i) => ({ ...b, id: b.id ?? i })));
  const [editIdx, setEditIdx] = useState(null);
  const [editBook, setEditBook] = useState(null);
  const [saving, setSaving] = useState(false);

  const openEdit = (idx) => { setEditIdx(idx); setEditBook({ ...items[idx], takeaways: items[idx].takeaways.map(t => ({ ...t })) }); };
  const applyEdit = () => { setItems(p => p.map((b, i) => i === editIdx ? editBook : b)); setEditIdx(null); };
  const set = (k, v) => setEditBook(b => ({ ...b, [k]: v }));
  const setTakeaway = (ti, k, v) => setEditBook(b => ({ ...b, takeaways: b.takeaways.map((t, i) => i === ti ? { ...t, [k]: v } : t) }));
  const addTakeaway = () => setEditBook(b => ({ ...b, takeaways: [...b.takeaways, blankTakeaway()] }));
  const removeTakeaway = (ti) => setEditBook(b => ({ ...b, takeaways: b.takeaways.filter((_, i) => i !== ti) }));
  const addBook = () => { const b = blank(); setItems(p => [...p, b]); setEditIdx(items.length); setEditBook(b); };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSection('books', { items });
      onToast('Books saved!');
    } catch {
      onToast('Save failed — check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="admin-section-title">Recent Reads</h2>
      <p className="admin-section-desc">Books shown in the Insights section with takeaways and application notes.</p>

      <div className="mt-6 space-y-3">
        {items.map((book, idx) => (
          <div key={book.id}>
            {editIdx === idx ? (
              <div className="admin-card border-2 border-blush-300 space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="admin-label">Title</label>
                    <input value={editBook.title} onChange={e => set('title', e.target.value)} className="admin-input" />
                  </div>
                  <div>
                    <label className="admin-label">Author</label>
                    <input value={editBook.author} onChange={e => set('author', e.target.value)} className="admin-input" />
                  </div>
                  <div>
                    <label className="admin-label">Year</label>
                    <input type="number" value={editBook.year} onChange={e => set('year', parseInt(e.target.value))} className="admin-input" />
                  </div>
                  <div>
                    <label className="admin-label">Genre</label>
                    <select value={editBook.genre} onChange={e => set('genre', e.target.value)} className="admin-input">
                      <option value="">— Select genre —</option>
                      {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="admin-label">Rating (1–5)</label>
                    <input type="number" min={1} max={5} value={editBook.rating} onChange={e => set('rating', parseInt(e.target.value))} className="admin-input" />
                  </div>
                  <div>
                    <label className="admin-label">Cover Color</label>
                    <select value={editBook.coverColor} onChange={e => set('coverColor', e.target.value)} className="admin-input">
                      {COVER_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="admin-label">Tag Color</label>
                    <select value={editBook.tagColor} onChange={e => set('tagColor', e.target.value)} className="admin-input">
                      {TAG_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="admin-label">Synopsis</label>
                    <textarea rows={3} className="admin-input resize-none" value={editBook.synopsis} onChange={e => set('synopsis', e.target.value)} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="admin-label">How I Apply This</label>
                    <textarea rows={3} className="admin-input resize-none" value={editBook.applyToSales} onChange={e => set('applyToSales', e.target.value)} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="admin-label mb-0">Takeaways</label>
                    <button onClick={addTakeaway} className="admin-btn-sm">+ Add</button>
                  </div>
                  <div className="space-y-3">
                    {editBook.takeaways.map((t, ti) => (
                      <div key={ti} className="bg-blush-50 rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-body text-xs font-semibold text-blush-500">#{ti + 1}</span>
                          {editBook.takeaways.length > 1 && (
                            <button onClick={() => removeTakeaway(ti)} className="font-body text-xs text-red-400 hover:text-red-600">Remove</button>
                          )}
                        </div>
                        <input placeholder="Heading" value={t.heading} onChange={e => setTakeaway(ti, 'heading', e.target.value)} className="admin-input" />
                        <textarea placeholder="Body" rows={3} className="admin-input resize-none" value={t.body} onChange={e => setTakeaway(ti, 'body', e.target.value)} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={applyEdit} className="btn-primary text-xs px-4 py-2">Apply</button>
                  <button onClick={() => setEditIdx(null)} className="btn-outline text-xs px-4 py-2">Cancel</button>
                </div>
              </div>
            ) : (
              <div className={`admin-card flex items-start justify-between gap-4 ${book.hidden ? 'opacity-50' : ''}`}>
                <div className="flex gap-3">
                  <div className={`w-8 self-stretch rounded-lg bg-gradient-to-b ${book.coverColor} shrink-0`} />
                  <div>
                    <p className="font-body font-semibold text-sm text-gray-800">{book.title}</p>
                    <p className="font-body text-xs text-gray-400">{book.author} · {book.year}{book.genre ? ` · ${book.genre}` : ''}</p>
                    <p className="font-body text-xs text-gray-500 mt-0.5">{book.takeaways.length} takeaway{book.takeaways.length !== 1 ? 's' : ''} · {'★'.repeat(book.rating)}</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 items-center">
                  <button
                    onClick={() => setItems(p => p.map((b, i) => i === idx ? { ...b, hidden: !b.hidden } : b))}
                    className="admin-btn-sm"
                    title={book.hidden ? 'Show on portfolio' : 'Hide from portfolio'}
                  >
                    {book.hidden ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                  </button>
                  <button onClick={() => openEdit(idx)} className="admin-btn-sm">Edit</button>
                  <button onClick={() => setItems(p => p.filter((_, i) => i !== idx))} className="admin-btn-sm text-red-500">Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-4">
        <button onClick={addBook} className="btn-outline text-sm">+ Add Book</button>
        <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">
          {saving ? 'Saving…' : 'Save Books'}
        </button>
      </div>
    </div>
  );
}
