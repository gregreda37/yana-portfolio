import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { uploadAsset } from '../firebase/storage';
import { FiUpload } from 'react-icons/fi';

const SOCIALS = [
  { key: 'linkedin',  label: 'LinkedIn',    base: 'https://linkedin.com/in/', prefix: 'linkedin.com/in/' },
  { key: 'instagram', label: 'Instagram',   base: 'https://instagram.com/',   prefix: 'instagram.com/' },
  { key: 'facebook',  label: 'Facebook',    base: 'https://facebook.com/',    prefix: 'facebook.com/' },
  { key: 'tiktok',    label: 'TikTok',      base: 'https://tiktok.com/@',     prefix: 'tiktok.com/@' },
  { key: 'twitter',   label: 'Twitter / X', base: 'https://x.com/',           prefix: 'x.com/' },
  { key: 'youtube',   label: 'YouTube',     base: 'https://youtube.com/@',    prefix: 'youtube.com/@' },
];

// Shows a static URL prefix — user types just their handle
function SocialField({ label, base, prefix, value, onChange, yanaField }) {
  const handle = value?.startsWith(base) ? value.slice(base.length) : (value ?? '');
  return (
    <div>
      <label className="admin-label">{label}</label>
      <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blush-200 bg-white">
        <span className="font-body text-xs text-gray-400 px-3 py-2.5 bg-gray-50 border-r border-gray-200 whitespace-nowrap shrink-0 select-none">
          {prefix}
        </span>
        <input
          type="text"
          value={handle}
          onChange={e => onChange(e.target.value ? base + e.target.value : '')}
          placeholder="yourhandle"
          data-yana-field={yanaField}
          className="flex-1 font-body text-sm px-3 py-2.5 focus:outline-none bg-white min-w-0"
        />
      </div>
    </div>
  );
}

// Defined at module level — stable reference, never causes remount on keystroke
function Field({ label, type = 'text', rows, value, onChange, yanaField }) {
  return (
    <div>
      <label className="admin-label">{label}</label>
      {rows ? (
        <textarea
          rows={rows}
          value={value ?? ''}
          onChange={onChange}
          data-yana-field={yanaField}
          className="admin-input resize-none"
        />
      ) : (
        <input
          type={type}
          value={value ?? ''}
          onChange={onChange}
          data-yana-field={yanaField}
          className="admin-input"
        />
      )}
    </div>
  );
}

const EditProfile = forwardRef(function EditProfile({ onToast }, ref) {
  const { profile, saveSection } = useData();
  const { user } = useAuth();
  const [form, setForm] = useState({ ...profile });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Always-current copy of form for use inside imperative handle
  const formRef = useRef(form);
  useEffect(() => { formRef.current = form; }, [form]);

  useImperativeHandle(ref, () => ({
    async typewriteField(field, newValue) {
      // Scroll to the target field and focus it
      const el = document.querySelector(`[data-yana-field="${field}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await new Promise(r => setTimeout(r, 450));
      el?.focus();

      // Clear then typewrite
      setForm(f => ({ ...f, [field]: '' }));
      await new Promise(r => setTimeout(r, 80));

      const delay = newValue.length > 60 ? 12 : 22;
      for (let i = 1; i <= newValue.length; i++) {
        setForm(f => ({ ...f, [field]: newValue.slice(0, i) }));
        await new Promise(r => setTimeout(r, delay));
      }

      // Auto-save with the fully-typed value
      await new Promise(r => setTimeout(r, 400));
      try {
        await saveSection('profile', { ...formRef.current, [field]: newValue });
        onToast?.('✨ Profile updated by Yana!');
      } catch {
        onToast?.('Save failed — please try again.');
      }
    },
  }));

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
    } catch {
      onToast('Save failed — check your connection and try again.');
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
        <Field label="First Name"         value={form.firstName}        onChange={e => set('firstName', e.target.value)} yanaField="firstName" />
        <Field label="Last Name"          value={form.lastName}         onChange={e => set('lastName', e.target.value)} yanaField="lastName" />
        <Field label="Title / Tagline"    value={form.title}            onChange={e => set('title', e.target.value)} yanaField="title" />
        <div className="sm:col-span-2">
          <Field label="Bio — Paragraph 1" rows={3} value={form.bio1}   onChange={e => set('bio1', e.target.value)} yanaField="bio1" />
        </div>
        <div className="sm:col-span-2">
          <Field label="Bio — Paragraph 2" rows={3} value={form.bio2}   onChange={e => set('bio2', e.target.value)} yanaField="bio2" />
        </div>
        <Field label="Location"           value={form.location}         onChange={e => set('location', e.target.value)} yanaField="location" />
        <Field label="Email"   type="email" value={form.email}          onChange={e => set('email', e.target.value)} yanaField="email" />
        <Field label='Availability Card Title (e.g. "Open to Connect")' value={form.availabilityTitle ?? ''} onChange={e => set('availabilityTitle', e.target.value)} yanaField="availabilityTitle" placeholder="Open to Connect" />
        <Field label='Availability Button Label (e.g. "Let\'s Talk")' value={form.availabilityButton ?? ''} onChange={e => set('availabilityButton', e.target.value)} yanaField="availabilityButton" placeholder="Let's Talk" />
        <div className="sm:col-span-2">
          <Field label="Availability Note (sidebar card body text)" value={form.availabilityNote} onChange={e => set('availabilityNote', e.target.value)} yanaField="availabilityNote" />
        </div>
      </div>

      {/* Social Links */}
      <div className="mt-6">
        <p className="font-body text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Social Links — fill in whichever apply</p>
        <div className="grid sm:grid-cols-2 gap-5">
          {SOCIALS.map(({ key, label, base, prefix }) => (
            <SocialField
              key={key}
              label={label}
              base={base}
              prefix={prefix}
              value={form[key]}
              onChange={val => set(key, val)}
              yanaField={key}
            />
          ))}
        </div>
      </div>

      <div className="mt-8">
        <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">
          {saving ? 'Saving…' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
});

export default EditProfile;
