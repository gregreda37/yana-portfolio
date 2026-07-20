import { useState, useEffect, useRef } from 'react';
import { FiEye, FiEyeOff, FiSearch, FiX } from 'react-icons/fi';
import { useData } from '../contexts/DataContext';
import { YanaField } from './YanaField';

function BookSearch({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const abortRef = useRef(null);

  useEffect(() => {
    const q = query.trim();
    if (!q) { setResults([]); setNoResults(false); return; }

    setSearching(true);
    setNoResults(false);

    // Cancel any in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=7&fields=key,title,author_name,first_publish_year,cover_i,isbn`;
        const r = await fetch(url, { signal: abortRef.current.signal });
        const data = await r.json();
        const docs = data.docs ?? [];
        setResults(docs);
        setNoResults(docs.length === 0);
      } catch (e) {
        if (e.name !== 'AbortError') { setResults([]); setNoResults(true); }
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => { clearTimeout(timer); abortRef.current?.abort(); };
  }, [query]);

  const handleSelect = (fields) => {
    onSelect(fields);
    setQuery('');
    setResults([]);
    setNoResults(false);
  };

  return (
    <div className="bg-blush-50 border border-blush-100 rounded-2xl p-4 space-y-3">
      <p className="font-body text-xs font-semibold text-gray-500 uppercase tracking-widest">Find Book</p>
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-blush-300 border-t-transparent rounded-full animate-spin" />
        )}
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by title or author..."
          className="admin-input pl-9 pr-8"
        />
      </div>

      {results.length > 0 && (
        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          {results.map(r => {
            const thumbUrl = r.cover_i ? `https://covers.openlibrary.org/b/id/${r.cover_i}-S.jpg` : null;
            const coverImageUrl = r.cover_i ? `https://covers.openlibrary.org/b/id/${r.cover_i}-L.jpg` : '';
            const isbn = r.isbn?.find(i => i.length === 13) ?? r.isbn?.[0] ?? '';
            const amazonUrl = isbn
              ? `https://www.amazon.com/dp/${isbn}`
              : `https://www.amazon.com/s?k=${encodeURIComponent(`${r.title} ${r.author_name?.[0] ?? ''}`)}`;
            return (
              <button
                key={r.key}
                onClick={() => handleSelect({
                  title: r.title ?? '',
                  author: r.author_name?.[0] ?? '',
                  year: r.first_publish_year ?? new Date().getFullYear(),
                  coverImageUrl,
                  amazonUrl,
                })}
                className="w-full text-left flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-blush-200 hover:shadow-sm transition-all group"
              >
                {thumbUrl ? (
                  <img src={thumbUrl} alt={r.title} className="w-8 h-12 object-cover rounded shadow-sm shrink-0" />
                ) : (
                  <div className="w-8 h-12 bg-gradient-to-b from-blush-200 to-blush-400 rounded shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-body text-sm font-semibold text-gray-800 truncate group-hover:text-blush-600 transition-colors">{r.title}</p>
                  <p className="font-body text-xs text-gray-400 truncate">
                    {r.author_name?.[0] ?? 'Unknown author'}{r.first_publish_year ? ` · ${r.first_publish_year}` : ''}
                  </p>
                </div>
                <span className="font-body text-xs text-blush-400 shrink-0">Select →</span>
              </button>
            );
          })}
        </div>
      )}

      {noResults && !searching && (
        <p className="font-body text-xs text-gray-400">No results — try a different title or author.</p>
      )}
    </div>
  );
}

const COVER_COLORS = [
  'from-accent-400 to-accent-600', 'from-lavender-300 to-lavender-500',
  'from-teal-400 to-teal-600', 'from-purple-300 to-purple-500', 'from-rose-300 to-rose-500',
];
const TAG_COLORS = [
  'bg-accent-100 text-accent-600', 'bg-lavender-100 text-purple-600',
  'bg-teal-100 text-teal-600', 'bg-rose-100 text-rose-600', 'bg-purple-100 text-purple-600',
];
const GENRES = [
  'Business', 'Sales Strategy', 'Leadership', 'Negotiation', 'Productivity',
  'Personal Development', 'Biography', 'Self-Help', 'Fiction', 'Psychology',
  'Health / Science', 'Other',
];
const blankTakeaway = () => ({ heading: '', body: '' });
const blank = () => ({
  id: Date.now(), title: '', author: '', year: new Date().getFullYear(),
  rating: 5, genre: '', hidden: false, synopsis: '', applyToSales: '',
  coverColor: COVER_COLORS[0], tagColor: TAG_COLORS[0],
  coverImageUrl: '', amazonUrl: '',
  takeaways: [blankTakeaway()],
});

export default function EditBooks({ onToast }) {
  const { books, saveSection } = useData();
  const [items, setItems] = useState(books.items.map((b, i) => ({ ...b, id: b.id ?? i })));
  const [editIdx, setEditIdx] = useState(null);
  const [editBook, setEditBook] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveCount, setSaveCount] = useState(0);

  const openEdit = (idx) => { setEditIdx(idx); setEditBook({ ...items[idx], takeaways: items[idx].takeaways.map(t => ({ ...t })) }); };
  const applyEdit = () => { setItems(p => p.map((b, i) => i === editIdx ? editBook : b)); setEditIdx(null); };
  const set = (k, v) => setEditBook(b => ({ ...b, [k]: v }));
  const applyBookSearch = (fields) => setEditBook(b => ({
    ...b,
    title: fields.title || b.title,
    author: fields.author || b.author,
    year: fields.year || b.year,
    coverImageUrl: fields.coverImageUrl ?? b.coverImageUrl,
    amazonUrl: fields.amazonUrl ?? b.amazonUrl,
  }));
  const setTakeaway = (ti, k, v) => setEditBook(b => ({ ...b, takeaways: b.takeaways.map((t, i) => i === ti ? { ...t, [k]: v } : t) }));
  const addTakeaway = () => setEditBook(b => ({ ...b, takeaways: [...b.takeaways, blankTakeaway()] }));
  const removeTakeaway = (ti) => setEditBook(b => ({ ...b, takeaways: b.takeaways.filter((_, i) => i !== ti) }));
  const addBook = () => { const b = blank(); setItems(p => [...p, b]); setEditIdx(items.length); setEditBook(b); };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSection('books', { items });
      onToast('Books saved!');
      setSaveCount(c => c + 1);
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
                {/* Book search */}
                <BookSearch onSelect={applyBookSearch} />

                {/* Cover image preview + controls */}
                {editBook.coverImageUrl ? (
                  <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-3">
                    <img
                      src={editBook.coverImageUrl}
                      alt="Cover"
                      className="w-14 h-20 object-cover rounded-lg shadow-sm shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-xs font-semibold text-gray-700 mb-0.5">Cover image found</p>
                      <p className="font-body text-[10px] text-gray-400 truncate">{editBook.coverImageUrl}</p>
                    </div>
                    <button
                      onClick={() => set('coverImageUrl', '')}
                      className="shrink-0 w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors"
                      title="Remove cover image"
                    >
                      <FiX size={12} />
                    </button>
                  </div>
                ) : null}

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
                    <YanaField label="Synopsis" rows={3} value={editBook.synopsis} onChange={e => set('synopsis', e.target.value)} yanaField={`book-synopsis-${editIdx}`} yana saveCount={saveCount} />
                  </div>
                  <div className="sm:col-span-2">
                    <YanaField label="How I Apply This" rows={3} value={editBook.applyToSales} onChange={e => set('applyToSales', e.target.value)} yanaField={`book-apply-${editIdx}`} yana saveCount={saveCount} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="admin-label">Amazon Link <span className="text-gray-300 font-normal">(auto-filled by search, or paste manually)</span></label>
                    <input
                      type="url"
                      value={editBook.amazonUrl ?? ''}
                      onChange={e => set('amazonUrl', e.target.value)}
                      className="admin-input"
                      placeholder="https://www.amazon.com/dp/..."
                    />
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
                        <YanaField label={`Takeaway ${ti + 1} Body`} rows={3} value={t.body} onChange={e => setTakeaway(ti, 'body', e.target.value)} yanaField={`book-takeaway-${editIdx}-${ti}`} yana saveCount={saveCount} />
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
