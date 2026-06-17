import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { uploadAsset } from '../firebase/storage';
import { FiUpload } from 'react-icons/fi';

// Defined at module level — stable reference, never causes remount on keystroke
function Field({ label, type = 'text', rows, value, onChange }) {
  return (
    <div>
      <label className="admin-label">{label}</label>
      {rows ? (
        <textarea
          rows={rows}
          value={value ?? ''}
          onChange={onChange}
          className="admin-input resize-none"
        />
      ) : (
        <input
          type={type}
          value={value ?? ''}
          onChange={onChange}
          className="admin-input"
        />
      )}
    </div>
  );
}

export default function EditProfile({ onToast }) {
  const { profile, saveSection } = useData();
  const { user } = useAuth();
  const [form, setForm] = useState({ ...profile });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadAsset(user.uid, file, 'assets');
      set('photo', url);
      onToast('Photo uploaded!');
    } catch {
      onToast('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSection('profile', form);
      onToast('Profile saved!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="admin-section-title">Profile</h2>
      <p className="admin-section-desc">Hero section, bio text, and contact details shown throughout the site.</p>

      {/* Photo upload */}
      <div className="admin-card mt-6 mb-2">
        <label className="admin-label">Profile Photo</label>
        <div className="flex items-center gap-5">
          {form.photo ? (
            <img src={form.photo} alt="Profile" className="w-20 h-20 rounded-2xl object-cover border border-gray-200 shrink-0" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-blush-50 border-2 border-dashed border-blush-200 flex items-center justify-center shrink-0">
              <FiUpload className="text-blush-300" size={20} />
            </div>
          )}
          <div>
            <label className="inline-flex items-center gap-2 admin-btn-sm cursor-pointer">
              <FiUpload size={12} />
              {uploading ? 'Uploading…' : 'Upload Photo'}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handlePhotoUpload}
                disabled={uploading}
              />
            </label>
            <p className="font-body text-xs text-gray-400 mt-1.5">JPG, PNG or WebP — displayed as a circular avatar on your portfolio.</p>
            {form.photo && (
              <button
                onClick={() => set('photo', '')}
                className="font-body text-xs text-red-400 hover:text-red-600 mt-1 transition-colors"
              >
                Remove photo
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5 mt-4">
        <Field label="Display Name"       value={form.name}             onChange={e => set('name', e.target.value)} />
        <Field label="Title / Tagline"    value={form.title}            onChange={e => set('title', e.target.value)} />
        <div className="sm:col-span-2">
          <Field label="Bio — Paragraph 1" rows={3} value={form.bio1}   onChange={e => set('bio1', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Field label="Bio — Paragraph 2" rows={3} value={form.bio2}   onChange={e => set('bio2', e.target.value)} />
        </div>
        <Field label="Location"           value={form.location}         onChange={e => set('location', e.target.value)} />
        <Field label="Email"   type="email" value={form.email}          onChange={e => set('email', e.target.value)} />
        <div className="sm:col-span-2">
          <Field label="LinkedIn URL"     value={form.linkedin}         onChange={e => set('linkedin', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Field label="Availability Note (sidebar card)" value={form.availabilityNote} onChange={e => set('availabilityNote', e.target.value)} />
        </div>
      </div>

      <div className="mt-8">
        <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">
          {saving ? 'Saving…' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}
