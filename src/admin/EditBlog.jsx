import { useState } from 'react';
import { useData } from '../contexts/DataContext';

const CATEGORIES = ['Prospecting', 'Sales Strategy', 'Relationship Building', 'Objection Handling', 'Leadership', 'Productivity'];
const blank = () => ({
  id: Date.now(), slug: '', title: '', category: 'Sales Strategy',
  date: '', readTime: '5 min read', excerpt: '', body: '', tags: [],
});

export default function EditBlog({ onToast }) {
  const { blog, saveSection } = useData();
  const [posts, setPosts] = useState(blog.posts.map((p, i) => ({ ...p, id: p.id ?? i })));
  const [editIdx, setEditIdx] = useState(null);
  const [editPost, setEditPost] = useState(null);
  const [saving, setSaving] = useState(false);

  const openEdit = (idx) => { setEditIdx(idx); setEditPost({ ...posts[idx] }); };
  const applyEdit = () => { setPosts(p => p.map((post, i) => i === editIdx ? editPost : post)); setEditIdx(null); };
  const set = (k, v) => setEditPost(p => ({ ...p, [k]: v }));
  const addPost = () => { const b = blank(); setPosts(p => [...p, b]); setEditIdx(posts.length); setEditPost(b); };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSection('blog', { posts });
      onToast('Blog posts saved!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="admin-section-title">Blog Posts</h2>
      <p className="admin-section-desc">Articles shown in the Insights section. Body supports **bold** markdown.</p>

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
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
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
                    <label className="admin-label">Excerpt</label>
                    <textarea rows={2} className="admin-input resize-none" value={editPost.excerpt} onChange={e => set('excerpt', e.target.value)} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="admin-label">Body (separate paragraphs with a blank line)</label>
                    <textarea rows={12} className="admin-input resize-none font-mono text-xs" value={editPost.body} onChange={e => set('body', e.target.value)} />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={applyEdit} className="btn-primary text-xs px-4 py-2">Apply</button>
                  <button onClick={() => setEditIdx(null)} className="btn-outline text-xs px-4 py-2">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="admin-card flex items-start justify-between gap-4">
                <div>
                  <span className="font-body text-xs bg-blush-100 text-blush-600 px-2 py-0.5 rounded-full font-semibold">{post.category}</span>
                  <p className="font-body font-semibold text-sm text-gray-800 mt-1">{post.title}</p>
                  <p className="font-body text-xs text-gray-400">{post.date} · {post.readTime}</p>
                </div>
                <div className="flex gap-2 shrink-0">
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
