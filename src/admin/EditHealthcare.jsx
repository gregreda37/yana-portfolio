import { useState } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { useData } from '../contexts/DataContext';
import { YanaField } from './YanaField';

// Normalise stored highlights: accept both legacy strings and new { text, date } objects
function parseHighlights(raw) {
  return (raw ?? []).map(h =>
    typeof h === 'string' ? { text: h, date: '' } : { text: h.text ?? '', date: h.date ?? '' }
  );
}

export default function EditHealthcare({ onToast }) {
  const { healthcare, saveSection } = useData();
  const [label, setLabel] = useState(healthcare?.label ?? 'Healthcare Background');
  const [summary, setSummary] = useState(healthcare?.summary ?? '');
  const [highlights, setHighlights] = useState(parseHighlights(healthcare?.highlights));
  const [skills, setSkills] = useState((healthcare?.skills ?? []).join(', '));
  const [saving, setSaving] = useState(false);
  const [saveCount, setSaveCount] = useState(0);

  const addHighlight = () => setHighlights(prev => [...prev, { text: '', date: '' }]);
  const removeHighlight = (i) => setHighlights(prev => prev.filter((_, idx) => idx !== i));
  const updateHighlight = (i, field, value) =>
    setHighlights(prev => prev.map((h, idx) => idx === i ? { ...h, [field]: value } : h));

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSection('healthcare', {
        label,
        summary,
        highlights: highlights.filter(h => h.text.trim()),
        skills: skills.split(',').map(s => s.trim()).filter(Boolean),
      });
      onToast(`${label} section saved!`);
      setSaveCount(c => c + 1);
    } catch {
      onToast('Save failed — check your connection and try again.');
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
          <YanaField label="Summary Paragraph" rows={4} value={summary} onChange={e => setSummary(e.target.value)} yanaField="healthcare-summary" yana saveCount={saveCount} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="admin-label mb-0">Certifications / Highlights</label>
            <button
              onClick={addHighlight}
              className="flex items-center gap-1.5 font-body text-xs font-semibold text-accent-600 hover:text-accent-700 transition-colors"
            >
              <FiPlus size={13} /> Add
            </button>
          </div>
          <div className="space-y-3">
            {highlights.map((h, i) => (
              <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
                <div className="flex gap-3">
                  <input
                    type="text"
                    className="admin-input flex-1"
                    placeholder="e.g. Certified Medical Sales Representative"
                    value={h.text}
                    onChange={e => updateHighlight(i, 'text', e.target.value)}
                  />
                  <button
                    onClick={() => removeHighlight(i)}
                    className="shrink-0 text-gray-300 hover:text-red-400 transition-colors p-1"
                    aria-label="Remove"
                  >
                    <FiTrash2 size={15} />
                  </button>
                </div>
                <div>
                  <label className="font-body text-xs text-gray-400 mb-1 block">Certificate Date (optional)</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="e.g. March 2023 or 2023"
                    value={h.date}
                    onChange={e => updateHighlight(i, 'date', e.target.value)}
                  />
                </div>
              </div>
            ))}
            {highlights.length === 0 && (
              <button
                onClick={addHighlight}
                className="w-full border-2 border-dashed border-gray-200 rounded-xl py-4 font-body text-sm text-gray-400 hover:border-accent-300 hover:text-accent-500 transition-colors"
              >
                + Add a certification or highlight
              </button>
            )}
          </div>
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
