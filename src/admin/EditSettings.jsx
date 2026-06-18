import { useState } from 'react';
import { useData } from '../contexts/DataContext';

const ACCENT_OPTIONS = [
  { key: 'blush',    label: 'Blush',    color: '#f4547e' },
  { key: 'rose',     label: 'Rose',     color: '#f43f5e' },
  { key: 'lavender', label: 'Lavender', color: '#8b5cf6' },
  { key: 'sage',     label: 'Sage',     color: '#22c55e' },
  { key: 'sky',      label: 'Sky',      color: '#0ea5e9' },
  { key: 'peach',    label: 'Peach',    color: '#f97316' },
];

const VISIBILITY_OPTIONS = [
  { key: 'metrics',      label: 'Metrics & Results',     desc: 'Your key sales numbers' },
  { key: 'experience',   label: 'Experience & Education', desc: 'Work history timeline' },
  { key: 'specialty',    label: 'Specialty Highlight',    desc: 'Your custom background section' },
  { key: 'testimonials', label: 'Testimonials',           desc: 'Client quotes and reviews' },
  { key: 'blog',         label: 'Blog & Recent Reads',    desc: 'Insights and book notes' },
  { key: 'contact',      label: 'Contact Form',           desc: 'Get in touch section' },
];

function Toggle({ on, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${on ? 'bg-blush-400' : 'bg-gray-200'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${on ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

export default function EditSettings({ onToast }) {
  const { settings, saveSection } = useData();
  const [accentColor, setAccentColor] = useState(settings?.accentColor ?? 'blush');
  const [visible, setVisible] = useState({ ...VISIBILITY_OPTIONS.reduce((a, o) => ({ ...a, [o.key]: true }), {}), ...(settings?.visible ?? {}) });
  const [saving, setSaving] = useState(false);

  const toggleSection = (key) => setVisible(v => ({ ...v, [key]: !v[key] }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSection('settings', { accentColor, visible });
      onToast('Settings saved!');
    } catch {
      onToast('Save failed — check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="admin-section-title">Appearance & Visibility</h2>
      <p className="admin-section-desc">Control your portfolio's color scheme and which sections visitors see.</p>

      {/* Color scheme */}
      <div className="admin-card mt-6">
        <label className="admin-label">Color Scheme</label>
        <p className="font-body text-xs text-gray-400 mb-4">Choose the accent color used for buttons, labels, and highlights across your portfolio.</p>
        <div className="flex flex-wrap gap-4">
          {ACCENT_OPTIONS.map(opt => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setAccentColor(opt.key)}
              className={`flex flex-col items-center gap-2 group`}
            >
              <div
                className={`w-10 h-10 rounded-full border-4 transition-all ${accentColor === opt.key ? 'border-gray-700 scale-110' : 'border-transparent hover:border-gray-300'}`}
                style={{ backgroundColor: opt.color }}
              />
              <span className={`font-body text-xs ${accentColor === opt.key ? 'text-gray-800 font-semibold' : 'text-gray-400'}`}>
                {opt.label}
              </span>
            </button>
          ))}
        </div>

        {/* Live preview strip */}
        <div className="mt-5 flex gap-2 items-center" data-accent={accentColor}>
          <button className="btn-primary text-xs px-4 py-2 rounded-full">Button</button>
          <button className="btn-outline text-xs px-4 py-2 rounded-full">Outline</button>
          <span className="section-subtitle mb-0 text-xs">Section Label</span>
        </div>
      </div>

      {/* Section visibility */}
      <div className="admin-card mt-5">
        <label className="admin-label">Section Visibility</label>
        <p className="font-body text-xs text-gray-400 mb-4">Toggle sections on or off. Hidden sections won't appear on your public portfolio.</p>
        <div className="space-y-4">
          {VISIBILITY_OPTIONS.map(opt => (
            <div key={opt.key} className="flex items-center justify-between">
              <div>
                <p className="font-body text-sm font-medium text-gray-700">{opt.label}</p>
                <p className="font-body text-xs text-gray-400">{opt.desc}</p>
              </div>
              <Toggle on={visible[opt.key] !== false} onChange={() => toggleSection(opt.key)} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
