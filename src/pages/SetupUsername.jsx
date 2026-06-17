import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { claimUsername, getUidByUsername } from '../firebase/db';

const DOMAIN = 'findyana.com';

export default function SetupUsername() {
  const { user, username, authLoading, updateUsername } = useAuth();
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const [availability, setAvailability] = useState(null); // null | 'checking' | 'available' | 'taken'
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Redirect if user already has a username
  useEffect(() => {
    if (!authLoading && username) navigate('/admin', { replace: true });
  }, [authLoading, username, navigate]);

  // Debounced availability check
  useEffect(() => {
    if (value.length < 3) { setAvailability(null); return; }
    if (!/^[a-z0-9-]+$/.test(value)) { setAvailability(null); return; }

    setAvailability('checking');
    const timer = setTimeout(async () => {
      try {
        const uid = await getUidByUsername(value);
        setAvailability(uid ? 'taken' : 'available');
      } catch {
        setAvailability(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [value]);

  const handleChange = (e) => {
    const clean = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setValue(clean);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/^[a-z0-9-]{3,30}$/.test(value)) {
      setError('3–30 characters: lowercase letters, numbers, and hyphens only.');
      return;
    }
    if (availability === 'taken') {
      setError('That username is already taken. Try another.');
      return;
    }
    setSaving(true);
    try {
      await claimUsername(user.uid, value);
      updateUsername(value);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message === 'Username taken' ? 'That username is already taken. Try another.' : 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-blush-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blush-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const canSubmit = value.length >= 3 && availability === 'available' && !saving;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blush-50 to-lavender-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-lg p-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">✨</div>
          <h1 className="font-display text-3xl text-gray-800 font-light">Welcome!</h1>
          <p className="font-body text-sm text-gray-500 mt-2">
            Choose a unique URL for your portfolio.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 font-body text-sm px-4 py-3 rounded-xl mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="font-body text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-1.5">
              Your portfolio URL
            </label>
            <div className={`flex items-center border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blush-300 focus-within:border-transparent transition-all ${
              availability === 'taken' ? 'border-red-300 bg-red-50/30' :
              availability === 'available' ? 'border-green-300 bg-green-50/30' :
              'border-blush-200 bg-blush-50/50'
            }`}>
              <span className="font-body text-xs text-gray-400 pl-4 pr-0.5 select-none shrink-0 whitespace-nowrap">
                {DOMAIN}/
              </span>
              <input
                type="text"
                value={value}
                onChange={handleChange}
                placeholder="your-name"
                maxLength={30}
                autoFocus
                className="flex-1 font-body text-sm py-3 pr-3 bg-transparent focus:outline-none min-w-0"
              />
              {/* Availability indicator */}
              <span className="pr-4 shrink-0 font-body text-xs">
                {availability === 'checking' && <span className="text-gray-400">…</span>}
                {availability === 'available' && <span className="text-green-500 font-semibold">✓ Available</span>}
                {availability === 'taken' && <span className="text-red-500 font-semibold">✗ Taken</span>}
              </span>
            </div>
            <p className="font-body text-xs text-gray-400 mt-1.5">Lowercase letters, numbers, and hyphens. Can't be changed later.</p>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? 'Claiming…' : 'Claim My URL →'}
          </button>
        </form>
      </div>
    </div>
  );
}
