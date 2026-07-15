import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle, FiTrash2, FiX, FiLock, FiCpu } from 'react-icons/fi';
import {
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  EmailAuthProvider,
  GoogleAuthProvider,
} from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { deleteAllUserData } from '../firebase/db';

const MODEL_PASSWORD = '8380';
const MODEL_STORAGE_KEY = 'yana_ai_model';

const AI_MODELS = [
  {
    id: 'gpt-35-turbo',
    label: 'GPT-3.5 Turbo',
    description: 'Default — fast, reliable, cost-efficient',
    badge: 'Default',
    badgeColor: 'bg-gray-100 text-gray-500',
  },
  {
    id: 'claude-haiku-4-5-20251001',
    label: 'Claude Haiku 4.5',
    description: 'Fastest Claude model, ideal for quick field edits',
    badge: 'Fast',
    badgeColor: 'bg-sky-100 text-sky-600',
  },
  {
    id: 'claude-sonnet-5',
    label: 'Claude Sonnet 5',
    description: 'Balanced performance and writing quality',
    badge: 'Balanced',
    badgeColor: 'bg-blush-100 text-blush-600',
  },
  {
    id: 'claude-opus-4-8',
    label: 'Claude Opus 4.8',
    description: 'Most capable — best for nuanced, long-form content',
    badge: 'Powerful',
    badgeColor: 'bg-purple-100 text-purple-600',
  },
];

export default function EditAccount() {
  const { user, username } = useAuth();
  const navigate = useNavigate();

  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [reauthMode, setReauthMode] = useState('idle'); // 'idle' | 'password' | 'google'
  const [reauthPassword, setReauthPassword] = useState('');

  // AI model selector state
  const [modelModalOpen, setModelModalOpen] = useState(false);
  const [modelUnlocked, setModelUnlocked] = useState(false);
  const [modelPassInput, setModelPassInput] = useState('');
  const [modelPassError, setModelPassError] = useState(false);
  const [selectedModel, setSelectedModel] = useState(
    () => localStorage.getItem(MODEL_STORAGE_KEY) ?? 'gpt-35-turbo'
  );

  const closeModelModal = () => {
    setModelModalOpen(false);
    setModelUnlocked(false);
    setModelPassInput('');
    setModelPassError(false);
  };

  const handleModelUnlock = () => {
    if (modelPassInput === MODEL_PASSWORD) {
      setModelUnlocked(true);
      setModelPassInput('');
      setModelPassError(false);
    } else {
      setModelPassError(true);
      setModelPassInput('');
    }
  };

  const handleModelSelect = (id) => {
    setSelectedModel(id);
    localStorage.setItem(MODEL_STORAGE_KEY, id);
  };

  const currentModelLabel = AI_MODELS.find(m => m.id === selectedModel)?.label ?? selectedModel;

  const isGoogle = user?.providerData?.[0]?.providerId === 'google.com';

  const WHAT_GETS_DELETED = [
    'Your entire portfolio and all published content',
    `Your portfolio URL (findyana.com/${username || 'yoururl'})`,
    'Profile, metrics, experience, and all sections',
    'All contact messages and resume requests',
    'Your login credentials and account access',
  ];

  const handleDelete = async () => {
    if (confirmText !== 'DELETE' || deleting) return;
    setDeleting(true);
    setError('');

    // Delete Firestore data first while the auth session is still valid.
    try {
      await deleteAllUserData(user.uid, username);
    } catch {
      setDeleting(false);
      setError('Could not delete your data. Please try again.');
      return;
    }

    // Auth account deletion can require a recent login — handle below.
    try {
      await user.delete();
      navigate('/');
    } catch (err) {
      setDeleting(false);
      if (err.code === 'auth/requires-recent-login') {
        // Firestore is already gone — only need to re-auth and retry user.delete()
        setReauthMode(isGoogle ? 'google' : 'password');
      } else {
        setError('Could not remove your login. Please try again.');
      }
    }
  };

  const handleReauth = async () => {
    setDeleting(true);
    setError('');
    try {
      if (isGoogle) {
        await reauthenticateWithPopup(user, new GoogleAuthProvider());
      } else {
        const credential = EmailAuthProvider.credential(user.email, reauthPassword);
        await reauthenticateWithCredential(user, credential);
      }
      // Firestore already deleted — just finish removing the auth account.
      await user.delete();
      navigate('/');
    } catch (err) {
      setDeleting(false);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Incorrect password. Please try again.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled. Please try again.');
      } else {
        setError('Re-authentication failed. Please try again.');
      }
    }
  };

  const cancel = () => {
    setConfirming(false);
    setConfirmText('');
    setError('');
    setReauthMode('idle');
    setReauthPassword('');
  };

  if (deleting) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
        <p className="font-body text-sm text-gray-500">Deleting your account…</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="admin-section-title">Account</h2>
      <p className="admin-section-desc">Manage your account and portfolio URL.</p>

      {/* Account info card */}
      <div className="admin-card mt-6 mb-8">
        <p className="font-body text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
          Account details
        </p>
        <div className="space-y-1.5">
          <p className="font-body text-sm text-gray-700">
            <span className="text-gray-400 w-16 inline-block">Email</span>
            {user?.email}
          </p>
          {username && (
            <p className="font-body text-sm text-gray-700">
              <span className="text-gray-400 w-16 inline-block">URL</span>
              <a
                href={`/${username}`}
                target="_blank"
                rel="noreferrer"
                className="text-blush-500 hover:underline"
              >
                findyana.com/{username}
              </a>
            </p>
          )}
        </div>
      </div>

      {/* AI Model row */}
      <div className="admin-card mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blush-50 rounded-xl flex items-center justify-center shrink-0">
            <FiCpu className="text-blush-400" size={15} />
          </div>
          <div>
            <p className="font-body text-sm font-semibold text-gray-700">AI Model</p>
            <p className="font-body text-[11px] text-gray-400 mt-0.5">{currentModelLabel}</p>
          </div>
        </div>
        <button
          onClick={() => setModelModalOpen(true)}
          className="shrink-0 admin-btn-sm"
        >
          Change
        </button>
      </div>

      {/* AI Model modal */}
      <AnimatePresence>
        {modelModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeModelModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="bg-gradient-to-br from-blush-50 to-blush-100 px-7 pt-7 pb-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <FiCpu className="text-blush-400" size={15} />
                      <p className="font-body text-[10px] font-semibold uppercase tracking-widest text-blush-400">AI Model</p>
                    </div>
                    <h3 className="font-display text-2xl font-light text-gray-800">Select Model</h3>
                    <p className="font-body text-xs text-gray-400 mt-1">Controls which AI powers the Yana assistant.</p>
                  </div>
                  <button
                    onClick={closeModelModal}
                    className="shrink-0 w-8 h-8 rounded-full bg-white/60 hover:bg-white/90 flex items-center justify-center text-gray-500 transition-colors"
                  >
                    <FiX size={15} />
                  </button>
                </div>
              </div>

              {/* Modal body */}
              <div className="px-7 py-6">
                <AnimatePresence mode="wait">
                  {!modelUnlocked ? (
                    <motion.div
                      key="locked"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-4"
                    >
                      {/* Current model display */}
                      <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5">
                        <FiLock className="text-gray-300 shrink-0" size={14} />
                        <div>
                          <p className="font-body text-sm font-semibold text-gray-700">{currentModelLabel}</p>
                          <p className="font-body text-[11px] text-gray-400">Currently active</p>
                        </div>
                      </div>

                      <p className="font-body text-xs text-gray-400">Enter the passcode to change the active model.</p>

                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={modelPassInput}
                          onChange={e => { setModelPassInput(e.target.value); setModelPassError(false); }}
                          onKeyDown={e => { if (e.key === 'Enter') handleModelUnlock(); }}
                          autoFocus
                          placeholder="Passcode"
                          className={`flex-1 font-body text-sm border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 bg-white transition-all ${
                            modelPassError
                              ? 'border-red-300 focus:ring-red-200'
                              : 'border-gray-200 focus:ring-blush-200'
                          }`}
                        />
                        <button
                          onClick={handleModelUnlock}
                          className="shrink-0 bg-blush-500 hover:bg-blush-600 text-white font-body text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                        >
                          Unlock
                        </button>
                      </div>
                      {modelPassError && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="font-body text-xs text-red-500"
                        >
                          Incorrect passcode — please try again.
                        </motion.p>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="unlocked"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-2"
                    >
                      {AI_MODELS.map(model => (
                        <button
                          key={model.id}
                          onClick={() => handleModelSelect(model.id)}
                          className={`w-full text-left flex items-center gap-4 px-4 py-3.5 rounded-2xl border transition-all ${
                            selectedModel === model.id
                              ? 'border-blush-300 bg-blush-50 shadow-sm'
                              : 'border-gray-100 bg-white hover:border-blush-200 hover:bg-blush-50/40'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                            selectedModel === model.id ? 'border-blush-500' : 'border-gray-200'
                          }`}>
                            {selectedModel === model.id && (
                              <div className="w-2 h-2 rounded-full bg-blush-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-body text-sm font-semibold text-gray-800">{model.label}</p>
                              <span className={`font-body text-[10px] font-semibold px-2 py-0.5 rounded-full ${model.badgeColor}`}>
                                {model.badge}
                              </span>
                            </div>
                            <p className="font-body text-xs text-gray-400 mt-0.5">{model.description}</p>
                          </div>
                        </button>
                      ))}

                      <div className="pt-2 flex justify-between items-center">
                        <button
                          onClick={() => { setModelUnlocked(false); setModelPassError(false); }}
                          className="flex items-center gap-1.5 font-body text-xs text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <FiLock size={11} /> Lock
                        </button>
                        <button
                          onClick={closeModelModal}
                          className="btn-primary text-xs px-5 py-2"
                        >
                          Done
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Danger zone */}
      <div className="border border-red-200 rounded-2xl overflow-hidden">
        <div className="bg-red-50/60 px-6 py-4 border-b border-red-200 flex items-center gap-3">
          <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
            <FiAlertTriangle className="text-red-500" size={15} />
          </div>
          <div>
            <p className="font-body text-sm font-bold text-red-700">Danger Zone</p>
            <p className="font-body text-xs text-red-500">These actions are permanent and cannot be undone.</p>
          </div>
        </div>

        <div className="px-6 py-5">
          <AnimatePresence mode="wait">
            {reauthMode !== 'idle' ? (
              <motion.div
                key="reauth"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <p className="font-body text-xs text-amber-700 font-semibold mb-1">Session verification required</p>
                  <p className="font-body text-xs text-amber-600">
                    {isGoogle
                      ? 'Please re-confirm your identity with Google to continue.'
                      : 'Please enter your password to confirm your identity before we delete your account.'}
                  </p>
                </div>

                {!isGoogle && (
                  <div>
                    <label className="font-body text-xs font-semibold text-gray-600 block mb-2">
                      Your password
                    </label>
                    <input
                      type="password"
                      value={reauthPassword}
                      onChange={e => setReauthPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleReauth()}
                      autoFocus
                      placeholder="••••••••"
                      className="w-full font-body text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent bg-white"
                    />
                  </div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 rounded-xl px-4 py-3"
                  >
                    <p className="font-body text-xs text-red-600">{error}</p>
                  </motion.div>
                )}

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleReauth}
                    className="flex items-center gap-2 font-body text-sm font-semibold text-white bg-red-500 hover:bg-red-600 px-5 py-2.5 rounded-xl transition-colors"
                  >
                    <FiTrash2 size={13} />
                    {isGoogle ? 'Continue with Google' : 'Verify & Delete'}
                  </button>
                  <button
                    onClick={cancel}
                    className="font-body text-sm text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            ) : !confirming ? (
              <motion.div
                key="trigger"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center justify-between gap-6"
              >
                <div>
                  <p className="font-body text-sm font-semibold text-gray-800">
                    Delete my account
                  </p>
                  <p className="font-body text-xs text-gray-400 mt-0.5">
                    Permanently removes your portfolio, all data, and your login.
                  </p>
                </div>
                <button
                  onClick={() => setConfirming(true)}
                  className="shrink-0 font-body text-xs font-semibold text-red-600 border border-red-300 bg-white hover:bg-red-50 px-4 py-2 rounded-xl transition-colors"
                >
                  Delete Account
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                {/* What gets deleted */}
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="font-body text-xs font-bold text-red-700 uppercase tracking-widest mb-3">
                    The following will be permanently deleted
                  </p>
                  <ul className="space-y-2">
                    {WHAT_GETS_DELETED.map(item => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 font-body text-xs text-gray-700"
                      >
                        <FiX className="text-red-400 shrink-0 mt-0.5" size={12} strokeWidth={3} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Confirmation input */}
                <div>
                  <label className="font-body text-xs font-semibold text-gray-600 block mb-2">
                    Type{' '}
                    <span className="font-mono font-bold text-red-600 tracking-widest">
                      DELETE
                    </span>{' '}
                    to confirm:
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={e => setConfirmText(e.target.value.toUpperCase())}
                    placeholder="DELETE"
                    autoFocus
                    className="w-full font-mono text-sm border border-red-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent bg-white placeholder:text-gray-300 tracking-widest"
                  />
                </div>

                {/* Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 rounded-xl px-4 py-3"
                  >
                    <p className="font-body text-xs text-red-600">{error}</p>
                  </motion.div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDelete}
                    disabled={confirmText !== 'DELETE'}
                    className="flex items-center gap-2 font-body text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-2.5 rounded-xl transition-colors"
                  >
                    <FiTrash2 size={13} />
                    Permanently Delete Account
                  </button>
                  <button
                    onClick={cancel}
                    className="font-body text-sm text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
