import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useData } from '../contexts/DataContext';
import { parseResumeStreaming } from '../utils/parseResumeWithAI';
import {
  FiUpload, FiFile, FiCheck, FiArrowRight, FiAlertCircle,
  FiPlus, FiX, FiUser, FiTrendingUp, FiBriefcase,
} from 'react-icons/fi';

// ── Typewriter ────────────────────────────────────────────────────────────────
function Typewriter({ text, speed = 22 }) {
  const [shown, setShown] = useState('');
  useEffect(() => {
    if (!text) return;
    setShown('');
    let i = 0;
    const id = setInterval(() => {
      if (i >= text.length) { clearInterval(id); return; }
      setShown(text.slice(0, ++i));
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return <>{shown}<span className="opacity-0 select-none">|</span></>;
}

// ── Cycling status messages ───────────────────────────────────────────────────
const CYCLING_MSGS = {
  0: ['Scanning your document…', 'Reading every page…', 'Parsing your text…'],
  1: ['Reading with Yana…', 'Discovering your story…', 'Mapping your career…', 'Finding your wins…', 'Identifying your skills…'],
  2: ['Building your preview…', 'Putting it together…', 'Almost there…', 'Compiling your highlights…'],
};

function CyclingText({ step }) {
  const messages = CYCLING_MSGS[step] ?? CYCLING_MSGS[0];
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => { setIdx(0); setVisible(true); }, [step]);

  useEffect(() => {
    if (messages.length <= 1) return;
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % messages.length);
        setVisible(true);
      }, 350);
    }, 2800);
    return () => clearInterval(id);
  }, [step]);

  return (
    <span style={{ transition: 'opacity 0.35s ease', opacity: visible ? 1 : 0 }}>
      {messages[idx]}
    </span>
  );
}

// ── Step progress bar ─────────────────────────────────────────────────────────
const STEP_LABELS = ['Reading PDF', 'Reading with Yana', 'Building Preview'];

function StepBar({ step }) {
  return (
    <div className="flex items-start justify-center mt-5">
      {STEP_LABELS.map((label, i) => (
        <div key={i} className="flex items-start">
          <div className="flex flex-col items-center gap-1.5">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-500 ${
              i < step  ? 'bg-green-400 text-white' :
              i === step ? 'bg-blush-500 text-white ring-4 ring-blush-100' :
                           'bg-gray-100 text-gray-300'
            }`}>
              {i < step ? (
                <FiCheck size={12} strokeWidth={3} />
              ) : i === step ? (
                <span className="w-2 h-2 bg-white rounded-full block animate-pulse" />
              ) : (
                <span className="font-body text-[10px] font-bold leading-none">{i + 1}</span>
              )}
            </div>
            <span className={`font-body text-[10px] font-medium whitespace-nowrap transition-colors duration-300 ${
              i < step ? 'text-green-500' : i === step ? 'text-blush-500' : 'text-gray-300'
            }`}>{label}</span>
          </div>
          {i < STEP_LABELS.length - 1 && (
            <div className={`w-8 h-px mt-3.5 mx-1 transition-all duration-700 ${i < step ? 'bg-green-300' : 'bg-gray-100'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Icon map for metrics ──────────────────────────────────────────────────────
const METRIC_ICON = { target: '🎯', dollar: '💰', users: '👥', heart: '💜' };

// ── Shared header ─────────────────────────────────────────────────────────────
function Header() {
  const navigate = useNavigate();
  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center px-6 shrink-0 z-10">
      <span className="font-display text-xl text-blush-500 font-light">Yana</span>
      <span className="font-body text-xs text-gray-400 ml-2">· Import Resume</span>
      <button
        onClick={() => navigate('/admin')}
        className="ml-auto font-body text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        Skip for now →
      </button>
    </header>
  );
}

// ── Field mutation helpers ────────────────────────────────────────────────────
const setProfile = (setForm, key, val) =>
  setForm(f => ({ ...f, profile: { ...f.profile, [key]: val } }));

const setMetricField = (setForm, idx, key, val) =>
  setForm(f => ({
    ...f,
    metrics: {
      ...f.metrics,
      items: f.metrics.items.map((m, i) => i === idx ? { ...m, [key]: val } : m),
    },
  }));

const removeMetric = (setForm, idx) =>
  setForm(f => ({ ...f, metrics: { ...f.metrics, items: f.metrics.items.filter((_, i) => i !== idx) } }));

const setJobField = (setForm, jIdx, key, val) =>
  setForm(f => ({
    ...f,
    experience: {
      ...f.experience,
      jobs: f.experience.jobs.map((j, i) => i === jIdx ? { ...j, [key]: val } : j),
    },
  }));

const setHighlight = (setForm, jIdx, hIdx, val) =>
  setForm(f => ({
    ...f,
    experience: {
      ...f.experience,
      jobs: f.experience.jobs.map((j, i) =>
        i === jIdx ? { ...j, highlights: j.highlights.map((h, hi) => hi === hIdx ? val : h) } : j
      ),
    },
  }));

const addHighlight = (setForm, jIdx) =>
  setForm(f => ({
    ...f,
    experience: {
      ...f.experience,
      jobs: f.experience.jobs.map((j, i) =>
        i === jIdx ? { ...j, highlights: [...(j.highlights ?? []), ''] } : j
      ),
    },
  }));

const removeHighlight = (setForm, jIdx, hIdx) =>
  setForm(f => ({
    ...f,
    experience: {
      ...f.experience,
      jobs: f.experience.jobs.map((j, i) =>
        i === jIdx ? { ...j, highlights: j.highlights.filter((_, hi) => hi !== hIdx) } : j
      ),
    },
  }));

const removeJob = (setForm, jIdx) =>
  setForm(f => ({
    ...f,
    experience: { ...f.experience, jobs: f.experience.jobs.filter((_, i) => i !== jIdx) },
  }));

const removeSkill = (setForm, sIdx) =>
  setForm(f => ({
    ...f,
    experience: { ...f.experience, skills: f.experience.skills.filter((_, i) => i !== sIdx) },
  }));

// ── Main component ────────────────────────────────────────────────────────────
export default function ImportResume() {
  const navigate = useNavigate();
  const { saveSection, profile: existingProfile, firestoreLoaded, firestoreError } = useData();

  // phase: upload | working | review | saving
  const [phase, setPhase] = useState('upload');
  const [fading, setFading] = useState(false);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  // Working phase — live section data and revealed items
  const [workStep, setWorkStep] = useState(0);
  const [workEmoji, setWorkEmoji] = useState('📄');
  const [workError, setWorkError] = useState('');
  const [liveProfile, setLiveProfile] = useState(null);
  const [liveMetrics, setLiveMetrics] = useState(null);
  const [liveExperience, setLiveExperience] = useState(null);
  const [shownProfileFields, setShownProfileFields] = useState([]);
  const [shownMetrics, setShownMetrics] = useState([]);
  const [shownJobs, setShownJobs] = useState([]);

  // Track what's been detected during streaming to avoid re-setting in onComplete
  const detectedRef = useRef({ profile: false, metrics: false, experience: false });
  // Prevents the delayed onComplete timers from firing if the user cancelled
  const cancelledRef = useRef(false);

  // Reveal profile fields one by one when profile section arrives
  useEffect(() => {
    if (!liveProfile) return;
    const fullName = [liveProfile.firstName, liveProfile.lastName].filter(Boolean).join(' ')
      || liveProfile.name || '';
    const fields = [
      { key: 'name',     label: 'Name',     value: fullName },
      { key: 'title',    label: 'Title',    value: liveProfile.title || liveProfile.headline || '' },
      { key: 'location', label: 'Location', value: liveProfile.location || '' },
      { key: 'bio',      label: 'Bio',      value: liveProfile.bio1 || liveProfile.summary || liveProfile.bio || '' },
    ].filter(f => f.value);

    let i = 0;
    const id = setInterval(() => {
      if (i >= fields.length) { clearInterval(id); return; }
      setShownProfileFields(prev => [...prev, fields[i++]]);
    }, 700);
    return () => clearInterval(id);
  }, [liveProfile]);

  // Reveal metric chips one by one
  useEffect(() => {
    if (!liveMetrics?.items?.length) return;
    let i = 0;
    const id = setInterval(() => {
      if (i >= liveMetrics.items.length) { clearInterval(id); return; }
      setShownMetrics(prev => [...prev, liveMetrics.items[i++]]);
    }, 450);
    return () => clearInterval(id);
  }, [liveMetrics]);

  // Reveal job timeline entries one by one
  useEffect(() => {
    if (!liveExperience?.jobs?.length) return;
    let i = 0;
    const id = setInterval(() => {
      if (i >= liveExperience.jobs.length) { clearInterval(id); return; }
      setShownJobs(prev => [...prev, liveExperience.jobs[i++]]);
    }, 550);
    return () => clearInterval(id);
  }, [liveExperience]);

  // Review form
  const [form, setForm] = useState(null);
  const [newSkill, setNewSkill] = useState('');

  const inputRef = useRef(null);

  const acceptFile = (f) => {
    if (!f) return;
    if (f.type !== 'application/pdf') { setError('Please upload a PDF file.'); return; }
    setFile(f);
    setError('');
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    acceptFile(e.dataTransfer.files[0]);
  }, []);

  const startAnalysis = async () => {
    if (!file) return;
    cancelledRef.current = false;
    setError('');
    setWorkError('');
    setPhase('working');
    setWorkStep(0);
    setWorkEmoji('📄');
    setLiveProfile(null); setLiveMetrics(null); setLiveExperience(null);
    setShownProfileFields([]); setShownMetrics([]); setShownJobs([]);
    detectedRef.current = { profile: false, metrics: false, experience: false };

    await parseResumeStreaming(file, {
      onProgress: (step) => {
        if (step === 'streaming') {
          // Hold "Reading PDF" active for 1.5s before marking it complete
          setTimeout(() => { setWorkStep(1); setWorkEmoji('✨'); }, 1500);
        }
      },
      onSection: (name, data) => {
        detectedRef.current[name] = true;
        if (name === 'profile') {
          setWorkStep(2); setWorkEmoji('👤');
          setLiveProfile(data);
        } else if (name === 'metrics') {
          setWorkEmoji('📊');
          setLiveMetrics(data);
        } else if (name === 'experience') {
          setWorkEmoji('💼');
          setLiveExperience(data);
        }
      },
      onError: (msg) => {
        console.error('Resume import error:', msg);
        setWorkError(msg);
      },
      onComplete: (parsed) => {
        // Fill in any sections the stream detector missed
        if (!detectedRef.current.profile)    setLiveProfile(parsed.profile);
        if (!detectedRef.current.metrics)    setLiveMetrics(parsed.metrics);
        if (!detectedRef.current.experience) setLiveExperience(parsed.experience);

        // Wait for final reveal animations, fade out, then switch to review.
        // cancelledRef guards against this firing after the user pressed Cancel.
        setTimeout(() => {
          if (cancelledRef.current) return;
          try {
            setForm(JSON.parse(JSON.stringify(parsed)));
          } catch (e) {
            console.error('Failed to prepare review form:', e);
            setWorkError('Failed to prepare your profile for review — please try again.');
            return;
          }
          setFading(true);
          setTimeout(() => {
            if (cancelledRef.current) return;
            setPhase('review');
            setFading(false);
          }, 550);
        }, 3800);
      },
    });
  };

  const apply = async () => {
    if (!form) return;
    setPhase('saving');
    try {
      await Promise.all([
        saveSection('profile', { ...form.profile, photo: existingProfile?.photo ?? '' }),
        saveSection('metrics', form.metrics),
        saveSection('experience', form.experience),
      ]);
      navigate('/admin');
    } catch {
      setError('Failed to save — check your connection and try again.');
      setPhase('review');
    }
  };

  // ── UPLOAD phase ─────────────────────────────────────────────────────────────
  if (phase === 'upload') return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <Header />
      </motion.div>
      <div className="flex-1 flex justify-center px-4 py-12 overflow-y-auto">
        <motion.div
          className="w-full max-w-xl"
          initial={{ opacity: 0, y: 32, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
        >

          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.18 }}
          >
            <div className="text-5xl mb-5">✨</div>
            <h1 className="font-display text-4xl text-gray-800 font-light mb-3">Import your resume</h1>
            <p className="font-body text-gray-400 max-w-md mx-auto leading-relaxed">
              Upload your PDF and watch AI build your entire portfolio live — then review and edit every detail before publishing.
            </p>
          </motion.div>


          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`rounded-3xl border-2 py-14 px-8 text-center cursor-pointer transition-all duration-200 mb-5 ${
              dragging ? 'border-blush-400 bg-blush-50/80 shadow-inner' :
              file     ? 'border-green-300 bg-green-50/40 shadow-inner' :
                         'border-gray-200 bg-white hover:border-blush-300 hover:bg-blush-50/30 hover:shadow-sm'
            }`}
          >
            <input ref={inputRef} type="file" accept=".pdf" className="sr-only" onChange={e => acceptFile(e.target.files[0])} />
            {file ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200 flex items-center justify-center shadow-sm">
                  <FiFile className="text-green-500" size={34} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-body text-sm font-semibold text-gray-800 mb-1">{file.name}</p>
                  <p className="font-body text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB · Click to change</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blush-50 to-blush-100 border border-blush-200 flex items-center justify-center shadow-sm">
                  <FiUpload className="text-blush-400" size={34} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-body text-sm font-semibold text-gray-700 mb-1">Drop your resume here</p>
                  <p className="font-body text-xs text-gray-400">PDF only · or click to browse</p>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5 flex gap-3">
              <FiAlertCircle className="text-red-400 shrink-0 mt-0.5" size={16} />
              <p className="font-body text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            onClick={startAnalysis}
            disabled={!file}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed py-4 text-base"
          >
            ✨ Analyze &amp; Build My Portfolio
          </button>
          <p className="text-center mt-4">
            <button onClick={() => navigate('/admin')} className="font-body text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Skip and set up manually
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );

  // ── WORKING phase (live streaming reveal) ─────────────────────────────────────
  if (phase === 'working') return (
    <motion.div
      className="min-h-screen bg-gray-50 flex flex-col"
      animate={{ opacity: fading ? 0 : 1 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      <Header />
      <div className="flex-1 overflow-y-auto px-4 py-10">
        <div className="w-full max-w-xl mx-auto space-y-5">

          {/* Status header / error state */}
          {workError ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
              <FiAlertCircle className="text-red-400 mx-auto mb-3" size={22} />
              <p className="font-body text-sm text-red-600 mb-1 font-semibold">Something went wrong</p>
              <p className="font-body text-sm text-red-500 mb-5 leading-relaxed">{workError}</p>
              <button
                onClick={() => { cancelledRef.current = true; setWorkError(''); setPhase('upload'); }}
                className="font-body text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl px-6 py-2.5 hover:bg-gray-50 transition-colors shadow-sm"
              >
                ← Try again
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center mb-6">
              {/* Pulsing animated icon */}
              <div className="relative inline-block mb-5">
                <span className="absolute inset-0 rounded-3xl bg-blush-200 animate-ping opacity-25" />
                <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-white to-blush-50 border border-blush-100 flex items-center justify-center shadow-sm">
                  <span className="text-3xl" style={{ transition: 'all 0.5s ease' }}>{workEmoji}</span>
                </div>
              </div>

              {/* Cycling status text */}
              <h2 className="font-display text-2xl text-gray-700 font-light text-center" style={{ minHeight: '2rem' }}>
                <CyclingText step={workStep} />
              </h2>

              {/* Step progress */}
              <StepBar step={workStep} />

              {/* Cancel */}
              <button
                onClick={() => { cancelledRef.current = true; setWorkError(''); setPhase('upload'); }}
                className="font-body text-xs text-gray-300 hover:text-gray-500 transition-colors mt-5"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Profile card */}
          {(liveProfile || shownProfileFields.length > 0) && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-field-in">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 bg-blush-100 rounded-lg flex items-center justify-center shrink-0">
                  <FiUser size={13} className="text-blush-500" />
                </div>
                <p className="font-body text-xs font-bold uppercase tracking-widest text-gray-400">Profile</p>
                {shownProfileFields.length >= 4 && (
                  <div className="ml-auto w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <FiCheck size={11} className="text-green-600" />
                  </div>
                )}
              </div>

              <div className="space-y-2.5">
                {shownProfileFields.map(f => (
                  <div key={f.key} className="flex items-baseline gap-3 animate-field-in">
                    <span className="font-body text-xs text-gray-300 w-14 shrink-0">{f.label}</span>
                    <p className={`font-body text-sm text-gray-800 leading-snug ${f.key === 'name' ? 'font-semibold text-base' : ''}`}>
                      <Typewriter text={f.value} speed={f.key === 'bio' ? 8 : 20} />
                    </p>
                  </div>
                ))}
                {shownProfileFields.length === 0 && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 border-2 border-blush-400 border-t-transparent rounded-full animate-spin" />
                    <p className="font-body text-xs text-gray-400">Identifying your details…</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Metrics card */}
          {liveMetrics && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-field-in">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                  <FiTrendingUp size={13} className="text-amber-500" />
                </div>
                <p className="font-body text-xs font-bold uppercase tracking-widest text-gray-400">Key Metrics</p>
                {shownMetrics.length > 0 && shownMetrics.length >= (liveMetrics.items?.length ?? 0) && (
                  <div className="ml-auto w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <FiCheck size={11} className="text-green-600" />
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2.5">
                {shownMetrics.map((m, i) => (
                  <div key={m.id ?? i} className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 animate-field-in">
                    <span className="text-lg">{METRIC_ICON[m.icon] ?? '📊'}</span>
                    <div>
                      <p className="font-display text-xl text-gray-800 leading-none">{m.prefix}{m.value}{m.suffix}</p>
                      <p className="font-body text-xs text-gray-400 mt-0.5">{m.label}</p>
                    </div>
                  </div>
                ))}
                {shownMetrics.length === 0 && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    <p className="font-body text-xs text-gray-400">Scanning for achievements…</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Experience card */}
          {liveExperience && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-field-in">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                  <FiBriefcase size={13} className="text-purple-500" />
                </div>
                <p className="font-body text-xs font-bold uppercase tracking-widest text-gray-400">Experience</p>
                {shownJobs.length > 0 && shownJobs.length >= (liveExperience.jobs?.length ?? 0) && (
                  <div className="ml-auto w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <FiCheck size={11} className="text-green-600" />
                  </div>
                )}
              </div>
              <div className="space-y-0">
                {shownJobs.map((j, i) => (
                  <div key={j.id ?? i} className="flex gap-3 animate-field-in">
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-2.5 h-2.5 bg-blush-400 rounded-full mt-1.5 shrink-0" />
                      {i < shownJobs.length - 1 && <div className="w-px flex-1 bg-gray-100 my-1" />}
                    </div>
                    <div className="pb-4">
                      <p className="font-body text-sm font-semibold text-gray-800"><Typewriter text={j.role} speed={25} /></p>
                      <p className="font-body text-xs text-gray-400">{j.company}{j.period ? ` · ${j.period}` : ''}</p>
                    </div>
                  </div>
                ))}
                {shownJobs.length === 0 && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                    <p className="font-body text-xs text-gray-400">Building your career timeline…</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </motion.div>
  );

  // ── REVIEW phase ──────────────────────────────────────────────────────────────
  if (phase === 'review' && form) return (
    <motion.div
      className="min-h-screen bg-gray-50 flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <Header />
      <div className="flex-1 overflow-y-auto px-4 py-10 pb-32">
        <div className="w-full max-w-2xl mx-auto">

          <div className="text-center mb-8">
            <div className="text-3xl mb-3">🎉</div>
            <h2 className="font-display text-3xl text-gray-800 font-light mb-1">Looking great!</h2>
            <p className="font-body text-sm text-gray-400">Review and edit every detail below, then publish to your portfolio.</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5 flex gap-3">
              <FiAlertCircle className="text-red-400 shrink-0 mt-0.5" size={16} />
              <p className="font-body text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* ── Profile ── */}
          <ReviewSection title="Profile" icon={<FiUser size={13} />} color="blush">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="First Name" value={form.profile.firstName} onChange={v => setProfile(setForm, 'firstName', v)} />
              <Field label="Last Name" value={form.profile.lastName} onChange={v => setProfile(setForm, 'lastName', v)} />
            </div>
            <Field label="Title / Tagline" value={form.profile.title} onChange={v => setProfile(setForm, 'title', v)} />
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Location" value={form.profile.location} onChange={v => setProfile(setForm, 'location', v)} />
              <Field label="Email" type="email" value={form.profile.email} onChange={v => setProfile(setForm, 'email', v)} />
            </div>
            <Field label="Bio — Paragraph 1" rows={3} value={form.profile.bio1} onChange={v => setProfile(setForm, 'bio1', v)} />
            <Field label="Bio — Paragraph 2" rows={3} value={form.profile.bio2} onChange={v => setProfile(setForm, 'bio2', v)} />
            {form.profile.linkedin && (
              <Field label="LinkedIn URL" value={form.profile.linkedin} onChange={v => setProfile(setForm, 'linkedin', v)} />
            )}
          </ReviewSection>

          {/* ── Metrics ── */}
          {(form.metrics?.items?.length ?? 0) > 0 && (
            <ReviewSection title="Key Metrics" icon={<FiTrendingUp size={13} />} color="amber">
              <div className="space-y-3">
                {form.metrics.items.map((m, i) => (
                  <div key={m.id} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-xl mt-0.5">{METRIC_ICON[m.icon] ?? '📊'}</span>
                      <div className="flex-1 grid sm:grid-cols-5 gap-3 items-end">
                        <div className="sm:col-span-2">
                          <label className="font-body text-xs text-gray-400 uppercase tracking-widest block mb-1">Value</label>
                          <div className="flex items-center gap-1">
                            <input
                              value={m.prefix ?? ''}
                              onChange={e => setMetricField(setForm, i, 'prefix', e.target.value)}
                              className="review-input w-9 text-center text-xs"
                              placeholder="$"
                            />
                            <input
                              type="number"
                              value={m.value}
                              onChange={e => setMetricField(setForm, i, 'value', parseFloat(e.target.value) || 0)}
                              className="review-input flex-1"
                            />
                            <input
                              value={m.suffix ?? ''}
                              onChange={e => setMetricField(setForm, i, 'suffix', e.target.value)}
                              className="review-input w-10 text-center text-xs"
                              placeholder="%"
                            />
                          </div>
                        </div>
                        <div className="sm:col-span-3">
                          <label className="font-body text-xs text-gray-400 uppercase tracking-widest block mb-1">Label</label>
                          <input
                            value={m.label}
                            onChange={e => setMetricField(setForm, i, 'label', e.target.value)}
                            className="review-input w-full"
                          />
                        </div>
                      </div>
                      <button onClick={() => removeMetric(setForm, i)} className="text-gray-300 hover:text-red-400 transition-colors shrink-0 mt-6">
                        <FiX size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </ReviewSection>
          )}

          {/* ── Experience ── */}
          {(form.experience?.jobs?.length ?? 0) > 0 && (
            <ReviewSection title="Experience" icon={<FiBriefcase size={13} />} color="purple">
              <div className="space-y-5">
                {form.experience.jobs.map((j, i) => (
                  <div key={j.id} className="border border-gray-200 rounded-xl bg-white">
                    <div className="p-4 grid sm:grid-cols-2 gap-3">
                      <Field label="Role" value={j.role} onChange={v => setJobField(setForm, i, 'role', v)} />
                      <Field label="Company" value={j.company} onChange={v => setJobField(setForm, i, 'company', v)} />
                      <Field label="Period" value={j.period} onChange={v => setJobField(setForm, i, 'period', v)} placeholder="Jan 2020 – Present" />
                      <Field label="Location" value={j.location} onChange={v => setJobField(setForm, i, 'location', v)} />
                    </div>
                    {(j.highlights?.length ?? 0) > 0 && (
                      <div className="px-4 pb-4 border-t border-gray-50 pt-3">
                        <label className="font-body text-xs text-gray-400 uppercase tracking-widest block mb-2">Highlights</label>
                        <div className="space-y-2">
                          {j.highlights.map((h, hi) => (
                            <div key={hi} className="flex items-center gap-2">
                              <span className="text-blush-400 shrink-0 text-xs">▸</span>
                              <input
                                value={h}
                                onChange={e => setHighlight(setForm, i, hi, e.target.value)}
                                className="review-input flex-1 text-sm"
                              />
                              <button onClick={() => removeHighlight(setForm, i, hi)} className="text-gray-300 hover:text-red-400 transition-colors shrink-0">
                                <FiX size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => addHighlight(setForm, i)}
                          className="flex items-center gap-1 font-body text-xs text-gray-400 hover:text-gray-600 mt-2 transition-colors"
                        >
                          <FiPlus size={11} /> Add bullet
                        </button>
                      </div>
                    )}
                    <div className="px-4 py-2.5 border-t border-gray-50 flex justify-end">
                      <button onClick={() => removeJob(setForm, i)} className="font-body text-xs text-gray-300 hover:text-red-400 transition-colors">
                        Remove position
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </ReviewSection>
          )}

          {/* ── Skills ── */}
          {(form.experience?.skills?.length ?? 0) > 0 && (
            <ReviewSection title="Skills" icon={null} color="gray">
              <div className="flex flex-wrap gap-2">
                {form.experience.skills.map((s, i) => (
                  <span key={i} className="flex items-center gap-1.5 bg-gray-100 text-gray-700 font-body text-xs px-3 py-1.5 rounded-full">
                    {s}
                    <button onClick={() => removeSkill(setForm, i)} className="text-gray-400 hover:text-red-400 transition-colors">
                      <FiX size={10} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <input
                  value={newSkill}
                  onChange={e => setNewSkill(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newSkill.trim()) {
                      setForm(f => ({ ...f, experience: { ...f.experience, skills: [...f.experience.skills, newSkill.trim()] } }));
                      setNewSkill('');
                    }
                  }}
                  placeholder="Add a skill…"
                  className="review-input flex-1 text-sm"
                />
                <button
                  onClick={() => {
                    if (!newSkill.trim()) return;
                    setForm(f => ({ ...f, experience: { ...f.experience, skills: [...f.experience.skills, newSkill.trim()] } }));
                    setNewSkill('');
                  }}
                  className="admin-btn-sm"
                >
                  <FiPlus size={13} />
                </button>
              </div>
            </ReviewSection>
          )}

        </div>
      </div>

      {/* Sticky confirm bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur border-t border-gray-100 px-4 py-4 flex items-center gap-4 max-w-2xl mx-auto z-20">
        <div className="flex-1">
          {firestoreError ? (
            <p className="font-body text-xs text-red-400 font-semibold">Connection error — please refresh the page.</p>
          ) : (
            <>
              <p className="font-body text-xs text-gray-400">Everything looks accurate?</p>
              <p className="font-body text-xs text-gray-300">You can edit any section later in the admin.</p>
            </>
          )}
        </div>
        <button
          onClick={apply}
          disabled={!firestoreLoaded || !!firestoreError}
          className="btn-primary flex items-center gap-2 disabled:opacity-60 shrink-0"
        >
          Apply to Portfolio <FiArrowRight size={14} />
        </button>
      </div>
    </motion.div>
  );

  // ── SAVING phase ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-blush-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-body text-sm text-gray-500 font-medium">Applying to your portfolio…</p>
        <p className="font-body text-xs text-gray-300 mt-1">This only takes a moment.</p>
      </div>
    </div>
  );
}

// ── Shared review sub-components ──────────────────────────────────────────────

const SECTION_COLORS = {
  blush:  'bg-blush-100 text-blush-500',
  amber:  'bg-amber-100 text-amber-500',
  purple: 'bg-purple-100 text-purple-500',
  gray:   'bg-gray-100 text-gray-400',
};

function ReviewSection({ title, icon, color, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
      <div className="flex items-center gap-2.5 mb-5">
        {icon && (
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${SECTION_COLORS[color]}`}>
            {icon}
          </div>
        )}
        <p className="font-body text-xs font-bold uppercase tracking-widest text-gray-400">{title}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', rows, placeholder }) {
  return (
    <div>
      <label className="font-body text-xs text-gray-400 uppercase tracking-widest block mb-1.5">{label}</label>
      {rows ? (
        <textarea
          rows={rows}
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          className="review-input w-full resize-none"
        />
      ) : (
        <input
          type={type}
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="review-input w-full"
        />
      )}
    </div>
  );
}
