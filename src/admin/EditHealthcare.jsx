import { useState } from 'react';
import { useData } from '../contexts/DataContext';

export default function EditHealthcare({ onToast }) {
  const { healthcare, saveSection } = useData();
  const [label, setLabel] = useState(healthcare?.label ?? 'Healthcare Background');
  const [summary, setSummary] = useState(healthcare?.summary ?? '');
  const [highlights, setHighlights] = useState((healthcare?.highlights ?? []).join('\n'));
  const [skills, setSkills] = useState((healthcare?.skills ?? []).join(', '));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSection('healthcare', {
        label,
        summary,
        highlights: highlights.split('\n').map(s => s.trim()).filter(Boolean),
        skills: skills.split(',').map(s => s.trim()).filter(Boolean),
      });
      onToast(`${label} section saved!`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="admin-section-title">Specialty Highlight</h2>
      <p className="admin-section-desc">A custom background section shown in your About page. Name it anything — Healthcare, Tech, Finance, etc.</p>

      <div className="mt-6 space-y-5">
        <div>
          <label className="admin-label">Section Name</label>
          <input
            type="text"
            className="admin-input"
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="e.g. Healthcare Background, Tech Experience, Finance Background"
          />
          <p className="font-body text-xs text-gray-400 mt-1">This becomes the heading on your public portfolio.</p>
        </div>
        <div>
          <label className="admin-label">Summary Paragraph</label>
          <textarea rows={4} className="admin-input resize-none" value={summary} onChange={e => setSummary(e.target.value)} />
        </div>
        <div>
          <label className="admin-label">Highlights (one per line)</label>
          <textarea rows={5} className="admin-input resize-none" value={highlights} onChange={e => setHighlights(e.target.value)} />
        </div>
        <div>
          <label className="admin-label">Skills / Keywords (comma-separated)</label>
          <textarea rows={2} className="admin-input resize-none" value={skills} onChange={e => setSkills(e.target.value)} />
        </div>
      </div>

      <div className="mt-8">
        <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">
          {saving ? 'Saving…' : `Save ${label || 'Section'}`}
        </button>
      </div>
    </div>
  );
}
