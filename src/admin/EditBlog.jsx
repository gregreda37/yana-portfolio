import { useState, useRef } from 'react';
import { FiPlus, FiX, FiEye, FiEyeOff, FiUpload, FiImage } from 'react-icons/fi';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { uploadAsset } from '../firebase/storage';
import { YanaField } from './YanaField';

const DEFAULT_CATEGORIES = ['Prospecting', 'Sales Strategy', 'Relationship Building', 'Objection Handling', 'Leadership', 'Productivity'];

const blank = (categories) => ({
  id: Date.now(), slug: '', title: '', category: categories[0] ?? 'General',
  date: '', readTime: '5 min read', excerpt: '', body: '', tags: [],
  hidden: false, images: [],
});

export default function EditBlog({ onToast }) {
  const { blog, saveSection } = useData();
  const { user } = useAuth();

  const [sectionLabel, setSectionLabel] = useState(blog.sectionLabel ?? 'Insights');
  const [sectionTitle, setSectionTitle] = useState(blog.sectionTitle ?? 'Sales insights & strategy.');
  const [sectionDescription, setSectionDescription] = useState(blog.sectionDescription ?? 'Practical frameworks and lessons from years in the field.');

  const initialCategories = blog.categories?.length ? blog.categories : DEFAULT_CATEGORIES;
  const [categories, setCategories] = useState(initialCategories);
  const [newCategory, setNewCategory] = useState('');

  const [posts, setPosts] = useState(blog.posts.map((p, i) => ({ ...p, id: p.id ?? i })));
  const [editIdx, setEditIdx] = useState(null);
  const [editPost, setEditPost] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const addCategory = () => {
    const name = newCategory.trim();
    if (!name || categories.includes(name)) return;
    setCategories(prev => [...prev, name]);
    setNewCategory('');
  };

  const removeCategory = (cat) => {
    setCategories(prev => prev.filter(c => c !== cat));
  };

  const openEdit = (idx) => { setEditIdx(idx); setEditPost({ ...posts[idx], images: posts[idx].images ?? [] }); };
  const applyEdit = () => { setPosts(p => p.map((post, i) => i === editIdx ? editPost : post)); setEditIdx(null); };
  const set = (k, v) => setEditPost(p => ({ ...p, [k]: v }));
  const addPost = () => { const b = blank(categories); setPosts(p => [...p, b]); setEditIdx(posts.length); setEditPost(b); };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.map(f => uploadAsset(user.uid, f, 'blog')));
      set('images', [...(editPost.images ?? []), ...urls]);
      onToast(`${urls.length} image${urls.length > 1 ? 's' : ''} uploaded!`);
    } catch {
      onToast('Upload failed — please try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (i) => set('images', (editPost.images ?? []).filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSection('blog', { posts, categories, sectionLabel, sectionTitle, sectionDescription });
      onToast('Blog posts saved!');
      setSaveCount(c => c + 1);
    } catch {
      onToast('Save failed — check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="admin-section-title">Blog Posts</h2>
      <p className="admin-section-desc">Articles shown in the Insights section. Body supports **bold** markdown.</p>

      {/* ── Section Header ─────────────────────────────────────────────── */}
      <div className="mt-6 bg-gray-50 border border-gray-100 rounded-2xl p-5 space-y-3">
        <label className="admin-label mb-1 block">Section Header</label>
        <div>
          <label className="admin-label">Eyebrow Label</label>
          <input
            className="admin-input"
            placeholder="e.g. Insights, Thoughts, Resources"
            value={sectionLabel}
            onChange={e => setSectionLabel(e.target.value)}
          />
        </div>
        <div>
          <label className="admin-label">Section Title</label>
          <input
            className="admin-input"
            placeholder="e.g. Sales insights & strategy."
            value={sectionTitle}
            onChange={e => setSectionTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="admin-label">Description</label>
          <input
            className="admin-input"
            placeholder="One line shown below the title"
            value={sectionDescription}
            onChange={e => setSectionDescription(e.target.value)}
          />
        </div>
      </div>

      {/* ── Category Manager ───────────────────────────────────────────── */}
      <div className="mt-6 bg-gray-50 border border-gray-100 rounded-2xl p-5">
        <label className="admin-label mb-3 block">Categories</label>

        <div className="flex flex-wrap gap-2 mb-3">
          {categories.map(cat => (
            <span
              key={cat}
              className="inline-flex items-center gap-1.5 font-body text-xs font-semibold bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-full"
            >
              {cat}
              <button
                onClick={() => removeCategory(cat)}
                className="text-gray-300 hover:text-red-400 transition-colors"
                aria-label={`Remove ${cat}`}
              >
                <FiX size={11} />
              </button>
            </span>
          ))}
          {categories.length === 0 && (
            <p className="font-body text-xs text-gray-400">No categories yet — add one below.</p>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            className="admin-input flex-1"
            placeholder="e.g. Leadership, Mindset, Client Success…"
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCategory())}
          />
          <button
            onClick={addCategory}
            disabled={!newCategory.trim() || categories.includes(newCategory.trim())}
            className="btn-outline flex items-center gap-1.5 text-sm disabled:opacity-40"
          >
            <FiPlus size={13} /> Add
          </button>
        </div>
      </div>

      {/* ── Post List ──────────────────────────────────────────────────── */}
      <div className="mt-6 space-y-3">
        {posts.map((post, idx) => (
          <div key={post.id}>
            {editIdx === idx ? (
              <div className="admin-card border-2 border-blush-300 space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="admin-label">Title</label>
                    <input value={editPost.title} onChange={e => set('title', e.target.value)} className="admin-input" />
                  </div>
                  <div>
                    <label className="admin-label">Category</label>
                    <select value={editPost.category} onChange={e => set('category', e.target.value)} className="admin-input">
                      {categories.map(c => <option key={c}>{c}</option>)}
                      {!categories.includes(editPost.category) && editPost.category && (
                        <option value={editPost.category}>{editPost.category}</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="admin-label">Date (e.g. May 12, 2025)</label>
                    <input value={editPost.date} onChange={e => set('date', e.target.value)} className="admin-input" />
                  </div>
                  <div>
                    <label className="admin-label">Read Time</label>
                    <input value={editPost.readTime} onChange={e => set('readTime', e.target.value)} className="admin-input" />
                  </div>
                  <div>
                    <label className="admin-label">Tags (comma-separated)</label>
                    <input
                      value={Array.isArray(editPost.tags) ? editPost.tags.join(', ') : editPost.tags}
                      onChange={e => set('tags', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                      className="admin-input"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <YanaField label="Excerpt" rows={2} value={editPost.excerpt} onChange={e => set('excerpt', e.target.value)} yanaField={`blog-excerpt-${editIdx}`} yana saveCount={saveCount} />
                  </div>
                  <div className="sm:col-span-2">
                    <YanaField label="Body" rows={12} value={editPost.body} onChange={e => set('body', e.target.value)} yanaField={`blog-body-${editIdx}`} yana saveCount={saveCount} />
                  </div>
                </div>

                {/* ── Media Photos (optional) ─────────────────────────── */}
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-body text-xs font-semibold text-gray-500 uppercase tracking-widest">Media Photos <span className="text-gray-300 font-normal normal-case tracking-normal">— optional</span></p>
                      <p className="font-body text-[10px] text-gray-400 mt-0.5">Displayed as a gallery in the post modal. Up to 8 images.</p>
                    </div>
                    <label className={`inline-flex items-center gap-1.5 admin-btn-sm cursor-pointer ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
                      <FiUpload size={12} />
                      {uploading ? 'Uploading…' : 'Add photos'}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="sr-only"
                        onChange={handleImageUpload}
                        disabled={uploading || (editPost.images ?? []).length >= 8}
                      />
                    </label>
                  </div>

                  {(editPost.images ?? []).length > 0 ? (
                    <div className="grid grid-cols-4 gap-2">
                      {(editPost.images ?? []).map((url, i) => (
                        <div key={i} className="relative group aspect-video rounded-xl overflow-hidden border border-gray-100">
                          <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                          <button
                            onClick={() => removeImage(i)}
                            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            <FiX size={10} />
                          </button>
                          {i === 0 && (
                            <span className="absolute bottom-1.5 left-1.5 font-body text-[9px] font-semibold bg-black/50 text-white px-1.5 py-0.5 rounded-full">Cover</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blush-300 hover:bg-blush-50/30 transition-colors">
                      <FiImage className="text-gray-300 mb-1" size={18} />
                      <span className="font-body text-xs text-gray-400">Click to add photos</span>
                      <input type="file" accept="image/*" multiple className="sr-only" onChange={handleImageUpload} disabled={uploading} />
                    </label>
                  )}
                </div>

                <div className="flex gap-3">
                  <button onClick={applyEdit} className="btn-primary text-xs px-4 py-2">Apply</button>
                  <button onClick={() => setEditIdx(null)} className="btn-outline text-xs px-4 py-2">Cancel</button>
                </div>
              </div>
            ) : (
              <div className={`admin-card flex items-start justify-between gap-4 ${post.hidden ? 'opacity-50' : ''}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-body text-xs bg-blush-100 text-blush-600 px-2 py-0.5 rounded-full font-semibold">{post.category}</span>
                    {post.images?.length > 0 && (
                      <span className="inline-flex items-center gap-1 font-body text-[10px] text-gray-400"><FiImage size={10} />{post.images.length}</span>
                    )}
                  </div>
                  <p className="font-body font-semibold text-sm text-gray-800 mt-1">{post.title}</p>
                  <p className="font-body text-xs text-gray-400">{post.date} · {post.readTime}</p>
                </div>
                <div className="flex gap-2 shrink-0 items-center">
                  <button
                    onClick={() => setPosts(p => p.map((pp, i) => i === idx ? { ...pp, hidden: !pp.hidden } : pp))}
                    className="admin-btn-sm"
                    title={post.hidden ? 'Show on portfolio' : 'Hide from portfolio'}
                  >
                    {post.hidden ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                  </button>
                  <button onClick={() => openEdit(idx)} className="admin-btn-sm">Edit</button>
                  <button onClick={() => setPosts(p => p.filter((_, i) => i !== idx))} className="admin-btn-sm text-red-500">Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-4">
        <button onClick={addPost} className="btn-outline text-sm">+ Add Post</button>
        <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">
          {saving ? 'Saving…' : 'Save Blog Posts'}
        </button>
      </div>
    </div>
  );
}
