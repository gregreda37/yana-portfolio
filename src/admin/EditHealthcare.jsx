import { useState } from 'react';
import { useData } from '../contexts/DataContext';

export default function EditHealthcare({ onToast }) {
  const { healthcare, saveSection } = useData();
  const [summary, setSummary] = useState(healthcare.summary);
  const [highlights, setHighlights] = useState(healthcare.highlights.join('\n'));
  const [skills, setSkills] = useState(healthcare.skills.join(', '));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSection('healthcare', {
        summary,
        highlights: highlights.split('\n').map(s => s.trim()).filter(Boolean),
        skills: skills.split(',').map(s => s.trim()).filter(Boolean),
      });
      onToast('Healthcare section saved!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="admin-section-title">Healthcare Background</h2>
      <p className="admin-section-desc">The highlighted card shown in the About section.</p>

      <div className="mt-6 space-y-5">
        <div>
          <label className="admin-label">Summary Paragraph</label>
          <textarea rows={4} className="admin-input resize-none" value={summary} onChange={e => setSummary(e.target.value)} />
        </div>
        <div>
          <label className="admin-label">Highlights (one per line)</label>
          <textarea rows={5} className="admin-input resize-none" value={highlights} onChange={e => setHighlights(e.target.value)} />
        </div>
        <div>
          <label className="admin-label">Skills (comma-separated)</label>
          <textarea rows={2} className="admin-input resize-none" value={skills} onChange={e => setSkills(e.target.value)} />
        </div>
      </div>

      <div className="mt-8">
        <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">
          {saving ? 'Saving…' : 'Save Healthcare'}
        </button>
      </div>
    </div>
  );
}
