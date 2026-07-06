import { useState } from 'react';
import { FiCalendar, FiExternalLink, FiCheck } from 'react-icons/fi';
import { useData } from '../contexts/DataContext';

function isValidCalendlyUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname === 'calendly.com' && u.pathname.length > 1;
  } catch {
    return false;
  }
}

export default function EditCalendly({ onToast }) {
  const { calendly, saveSection } = useData();
  const [url, setUrl] = useState(calendly?.url ?? '');
  const [saving, setSaving] = useState(false);

  const isValid = !url.trim() || isValidCalendlyUrl(url.trim());
  const hasUrl = isValidCalendlyUrl(url.trim());

  const handleSave = async () => {
    if (url.trim() && !isValidCalendlyUrl(url.trim())) {
      onToast('Please enter a valid Calendly URL.');
      return;
    }
    setSaving(true);
    try {
      await saveSection('calendly', { url: url.trim() });
      onToast('Calendly link saved!');
    } catch {
      onToast('Save failed — check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="admin-section-title">Calendly Booking</h2>
      <p className="admin-section-desc">
        Add your Calendly link to let visitors schedule time with you directly from your portfolio.
      </p>

      <div className="admin-card mt-6 space-y-5">
        {/* Step 1 */}
        <div className="flex gap-4 items-start">
          <div className="w-8 h-8 rounded-full bg-blush-100 text-blush-600 flex items-center justify-center shrink-0 font-body text-sm font-bold mt-0.5">1</div>
          <div>
            <p className="font-body text-sm font-semibold text-gray-700">Log in to Calendly</p>
            <p className="font-body text-xs text-gray-400 mt-0.5 mb-2">Sign in to your Calendly account and copy the link for the event type you want to share.</p>
            <a
              href="https://calendly.com/app/login"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-body text-xs font-semibold text-blush-500 hover:text-blush-600 transition-colors"
            >
              Open Calendly <FiExternalLink size={11} />
            </a>
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* Step 2 */}
        <div className="flex gap-4 items-start">
          <div className="w-8 h-8 rounded-full bg-blush-100 text-blush-600 flex items-center justify-center shrink-0 font-body text-sm font-bold mt-0.5">2</div>
          <div className="flex-1 min-w-0">
            <p className="font-body text-sm font-semibold text-gray-700 mb-1">Paste your Calendly link</p>
            <p className="font-body text-xs text-gray-400 mb-3">
              e.g. <span className="font-mono bg-gray-50 px-1 rounded">https://calendly.com/your-name/30min</span>
            </p>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300">
                <FiCalendar size={15} />
              </div>
              <input
                type="url"
                className={`admin-input pl-9 pr-9 ${!isValid ? 'border-red-300 focus:ring-red-200' : ''}`}
                placeholder="https://calendly.com/your-name/30min"
                value={url}
                onChange={e => setUrl(e.target.value)}
              />
              {hasUrl && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-green-500">
                  <FiCheck size={15} />
                </div>
              )}
            </div>
            {!isValid && (
              <p className="font-body text-xs text-red-400 mt-1">Must be a valid calendly.com URL.</p>
            )}
          </div>
        </div>
      </div>

      {/* Preview hint */}
      {hasUrl && (
        <div className="mt-4 bg-green-50 border border-green-100 rounded-2xl px-4 py-3 flex items-center gap-3">
          <FiCheck className="text-green-500 shrink-0" size={15} />
          <p className="font-body text-xs text-green-700">
            Calendly widget will appear on your public portfolio. Visitors can book directly without leaving your page.
          </p>
        </div>
      )}

      {!url.trim() && (
        <div className="mt-4 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3">
          <p className="font-body text-xs text-gray-400">
            No Calendly link set yet. The booking section will be hidden from your portfolio until you add one.
          </p>
        </div>
      )}

      <div className="mt-6">
        <button onClick={handleSave} disabled={saving || !isValid} className="btn-primary disabled:opacity-60">
          {saving ? 'Saving…' : 'Save Calendly Link'}
        </button>
        {url.trim() && (
          <button
            onClick={() => { setUrl(''); saveSection('calendly', { url: '' }); onToast('Calendly link removed.'); }}
            className="ml-3 font-body text-xs text-gray-400 hover:text-red-400 transition-colors"
          >
            Remove link
          </button>
        )}
      </div>
    </div>
  );
}
