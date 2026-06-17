import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { uploadAsset } from '../firebase/storage';
import { FiPlus, FiTrash2, FiUpload } from 'react-icons/fi';

const PLACEMENTS = [
  'Title Holder', '1st Runner-Up', '2nd Runner-Up',
  'Top 5 Finalist', 'Top 10 Finalist', 'Semi-Finalist', 'Participant',
];

export default function EditPageant({ onToast }) {
  const { pageant, saveSection } = useData();
  const { user } = useAuth();

  const [form, setForm] = useState({
    heading: pageant?.heading ?? 'Crown & Title Experience',
    currentTitle: pageant?.currentTitle ?? '',
    organization: pageant?.organization ?? '',
    platform: pageant?.platform ?? '',
    bio: pageant?.bio ?? '',
    achievements: (pageant?.achievements ?? []).join('\n'),
    communityImpact: (pageant?.communityImpact ?? []).join('\n'),
    photos: pageant?.photos ?? [],
  });
  const [titles, setTitles] = useState(pageant?.titles ?? []);
  const [editingTitle, setEditingTitle] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  /* ── Photo upload ─────────────────────────────────────────────────────── */
  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.map(f => uploadAsset(user.uid, f, 'pageant')));
      set('photos', [...form.photos, ...urls]);
      onToast(`${urls.length} photo${urls.length > 1 ? 's' : ''} uploaded!`);
    } catch {
      onToast('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removePhoto = (i) => set('photos', form.photos.filter((_, idx) => idx !== i));

  /* ── Title CRUD ───────────────────────────────────────────────────────── */
  const blankTitle = () => ({ id: Date.now(), year: new Date().getFullYear().toString(), title: '', organization: '', placement: 'Title Holder' });

  const addTitle = () => {
    const t = blankTitle();
    setTitles(prev => [...prev, t]);
    setEditingTitle(t.id);
  };

  const updateTitle = (id, field, val) =>
    setTitles(prev => prev.map(t => t.id === id ? { ...t, [field]: val } : t));

  const removeTitle = (id) => setTitles(prev => prev.filter(t => t.id !== id));

  /* ── Save ─────────────────────────────────────────────────────────────── */
  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSection('pageant', {
        heading: form.heading,
        currentTitle: form.currentTitle,
        organization: form.organization,
        platform: form.platform,
        bio: form.bio,
        titles,
        achievements: form.achievements.split('\n').map(s => s.trim()).filter(Boolean),
        communityImpact: form.communityImpact.split('\n').map(s => s.trim()).filter(Boolean),
        photos: form.photos,
      });
      onToast('Pageant section saved!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="admin-section-title">Pageant & Titles</h2>
      <p className="admin-section-desc">Showcase your pageant journey, titles, awards, and community impact.</p>

      {/* Section heading */}
      <div className="mt-6 space-y-5">
        <div>
          <label className="admin-label">Section Heading</label>
          <input type="text" className="admin-input" value={form.heading} onChange={e => set('heading', e.target.value)} placeholder="Crown & Title Experience" />
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="admin-label">Current Title</label>
            <input type="text" className="admin-input" value={form.currentTitle} onChange={e => set('currentTitle', e.target.value)} placeholder="Miss New York 2024" />
          </div>
          <div>
            <label className="admin-label">Organization</label>
            <input type="text" className="admin-input" value={form.organization} onChange={e => set('organization', e.target.value)} placeholder="Miss America Organization" />
          </div>
        </div>

        <div>
          <label className="admin-label">Platform / Cause</label>
          <input type="text" className="admin-input" value={form.platform} onChange={e => set('platform', e.target.value)} placeholder="Mental Health Awareness in Youth" />
        </div>

        <div>
          <label className="admin-label">Personal Statement / Bio</label>
          <textarea rows={4} className="admin-input resize-none" value={form.bio} onChange={e => set('bio', e.target.value)} />
        </div>
      </div>

      {/* Titles & Awards */}
      <div className="admin-card mt-6">
        <div className="flex items-center justify-between mb-4">
          <label className="admin-label mb-0">Titles & Awards</label>
          <button onClick={addTitle} className="admin-btn-sm flex items-center gap-1.5">
            <FiPlus size={12} /> Add Title
          </button>
        </div>

        {titles.length === 0 && (
          <p className="font-body text-xs text-gray-400 text-center py-4">No titles yet. Click "Add Title" to get started.</p>
        )}

        <div className="space-y-3">
          {titles.map(t => (
            <div key={t.id} className="border border-gray-100 rounded-xl overflow-hidden">
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50"
                onClick={() => setEditingTitle(editingTitle === t.id ? null : t.id)}
              >
                <div>
                  <p className="font-body text-sm font-medium text-gray-700">{t.title || 'Untitled'}</p>
                  <p className="font-body text-xs text-gray-400">{t.year} · {t.placement}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={e => { e.stopPropagation(); removeTitle(t.id); }}
                    className="text-gray-300 hover:text-red-400 transition-colors p-1"
                  >
                    <FiTrash2 size={13} />
                  </button>
                  <span className="font-body text-xs text-gray-400">{editingTitle === t.id ? '▲' : '▼'}</span>
                </div>
              </div>

              {editingTitle === t.id && (
                <div className="px-4 pb-4 pt-1 border-t border-gray-100 grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="admin-label">Year</label>
                    <input type="text" className="admin-input" value={t.year} onChange={e => updateTitle(t.id, 'year', e.target.value)} placeholder="2024" />
                  </div>
                  <div>
                    <label className="admin-label">Placement</label>
                    <select className="admin-input" value={t.placement} onChange={e => updateTitle(t.id, 'placement', e.target.value)}>
                      {PLACEMENTS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="admin-label">Title Name</label>
                    <input type="text" className="admin-input" value={t.title} onChange={e => updateTitle(t.id, 'title', e.target.value)} placeholder="Miss New York" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="admin-label">Organization</label>
                    <input type="text" className="admin-input" value={t.organization} onChange={e => updateTitle(t.id, 'organization', e.target.value)} placeholder="Miss America Organization" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Achievements + Community Impact */}
      <div className="grid sm:grid-cols-2 gap-5 mt-5">
        <div>
          <label className="admin-label">Achievements (one per line)</label>
          <textarea rows={5} className="admin-input resize-none" value={form.achievements} onChange={e => set('achievements', e.target.value)} placeholder="Top 10 Finalist — Miss America 2024" />
        </div>
        <div>
          <label className="admin-label">Community Impact (one per line)</label>
          <textarea rows={5} className="admin-input resize-none" value={form.communityImpact} onChange={e => set('communityImpact', e.target.value)} placeholder="Raised $50,000 for mental health organizations" />
        </div>
      </div>

      {/* Photo gallery upload */}
      <div className="admin-card mt-5">
        <label className="admin-label">Photo Gallery</label>
        <p className="font-body text-xs text-gray-400 mb-4">Upload pageant photos — they appear in a grid on your portfolio. Select multiple at once.</p>

        <label className="inline-flex items-center gap-2 admin-btn-sm cursor-pointer mb-4">
          <FiUpload size={12} />
          {uploading ? 'Uploading…' : 'Upload Photos'}
          <input type="file" accept="image/*" multiple className="sr-only" onChange={handlePhotoUpload} disabled={uploading} />
        </label>

        {form.photos.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {form.photos.map((url, i) => (
              <div key={i} className="relative group aspect-[3/4] rounded-xl overflow-hidden bg-gray-100">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8">
        <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">
          {saving ? 'Saving…' : 'Save Pageant Section'}
        </button>
      </div>
    </div>
  );
}
