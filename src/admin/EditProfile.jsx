import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { uploadAsset } from '../firebase/storage';
import { FiUpload } from 'react-icons/fi';

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

  const Field = ({ label, name, type = 'text', rows }) => (
    <div>
      <label className="admin-label">{label}</label>
      {rows ? (
        <textarea
          rows={rows}
          value={form[name] ?? ''}
          onChange={e => set(name, e.target.value)}
          className="admin-input resize-none"
        />
      ) : (
        <input
          type={type}
          value={form[name] ?? ''}
          onChange={e => set(name, e.target.value)}
          className="admin-input"
        />
      )}
    </div>
  );

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
        <Field label="Display Name" name="name" />
        <Field label="Title / Tagline" name="title" />
        <div className="sm:col-span-2">
          <Field label="Bio — Paragraph 1" name="bio1" rows={3} />
        </div>
        <div className="sm:col-span-2">
          <Field label="Bio — Paragraph 2" name="bio2" rows={3} />
        </div>
        <Field label="Location" name="location" />
        <Field label="Email" name="email" type="email" />
        <div className="sm:col-span-2">
          <Field label="LinkedIn URL" name="linkedin" />
        </div>
        <div className="sm:col-span-2">
          <Field label="Availability Note (sidebar card)" name="availabilityNote" />
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
