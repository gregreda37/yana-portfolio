import { useState } from 'react';
import { useData } from '../contexts/DataContext';

export default function EditProfile({ onToast }) {
  const { profile, saveSection } = useData();
  const [form, setForm] = useState({ ...profile });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

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
      <div className="grid sm:grid-cols-2 gap-5 mt-6">
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
