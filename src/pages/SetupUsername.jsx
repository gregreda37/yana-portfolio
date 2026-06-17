import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowRight, FiArrowLeft, FiSearch, FiCheck } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { claimUsername, getUidByUsername, saveSection } from '../firebase/db';

const DOMAIN = 'findyana.com';

const PROFESSIONS = [
  'Account Executive', 'Account Manager', 'Art Director',
  'Attorney', 'Brand Manager', 'Business Analyst',
  'Business Development', 'CEO', 'CFO', 'CMO', 'COO', 'CTO',
  'Chief People Officer', 'Civil Engineer',
  'Clinical Nurse', 'Compliance Officer', 'Content Strategist',
  'Controller', 'Copywriter', 'Creative Director',
  'Curriculum Developer', 'Data Analyst', 'Data Scientist',
  'DevOps Engineer', 'Digital Marketer',
  'Director of Operations', 'Director of Sales',
  'Electrical Engineer', 'Engineering Manager',
  'Entrepreneur', 'Financial Advisor', 'Financial Analyst',
  'Founder', 'General Counsel', 'Graphic Designer',
  'Growth Marketer', 'HR Business Partner', 'HR Manager',
  'Healthcare Administrator', 'Instructional Designer',
  'Investment Banker', 'Learning & Development Manager',
  'Legal Operations', 'Logistics Manager',
  'Management Consultant', 'Marketing Director', 'Marketing Manager',
  'Mechanical Engineer', 'Nonprofit Director',
  'Nurse Practitioner', 'Occupational Therapist',
  'Operations Manager', 'People Operations',
  'Pharmacist', 'Photographer', 'Physical Therapist',
  'Physician', 'Physician Assistant',
  'Portfolio Manager', 'Product Designer', 'Product Manager',
  'Professor', 'Program Director', 'Program Manager',
  'Project Manager', 'Public Relations Manager',
  'QA Engineer', 'Real Estate Agent', 'Real Estate Broker',
  'Recruiter', 'Regional Sales Manager',
  'Registered Nurse', 'Risk Analyst',
  'Sales Director', 'Sales Engineer', 'Sales Manager',
  'Sales Representative', 'School Principal',
  'Small Business Owner', 'Social Media Manager',
  'Software Engineer', 'Solution Architect',
  'Strategy Consultant', 'Supply Chain Manager',
  'Talent Acquisition', 'Teacher',
  'UI/UX Designer', 'VP of Finance', 'VP of Marketing',
  'VP of Operations', 'VP of People', 'VP of Sales',
  'Videographer', 'Volunteer Coordinator',
];

// ── Animation variants ────────────────────────────────────────────────────────

const stepVariants = {
  enter: (dir) => ({ x: dir > 0 ? 64 : -64, opacity: 0, scale: 0.97 }),
  center: {
    x: 0, opacity: 1, scale: 1,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
  exit: (dir) => ({
    x: dir > 0 ? -64 : 64, opacity: 0, scale: 0.97,
    transition: { duration: 0.3, ease: [0.55, 0, 1, 0.45] },
  }),
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

const emojiVariants = {
  hidden: { opacity: 0, scale: 0.5, y: 8 },
  show: {
    opacity: 1, scale: 1, y: 0,
    transition: { type: 'spring', stiffness: 380, damping: 20, delay: 0.04 },
  },
};

// ── Progress dots ─────────────────────────────────────────────────────────────
function ProgressDots({ step }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          animate={{
            width: i === step ? 28 : 8,
            backgroundColor: i === step ? '#f4547e' : i < step ? '#fda4af' : '#e5e7eb',
          }}
          transition={{ type: 'spring', stiffness: 480, damping: 32 }}
          className="h-2 rounded-full"
        />
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SetupUsername() {
  const { user, username: existingUsername, authLoading, updateUsername } = useAuth();
  const navigate = useNavigate();

  // completedSetup: tells the effect to go to /admin/import instead of /admin
  const completedSetup = useRef(false);

  // When existingUsername is set, route based on whether we just completed setup
  useEffect(() => {
    if (!authLoading && existingUsername) {
      navigate(
        completedSetup.current ? '/admin/import' : '/admin',
        { replace: true }
      );
    }
  }, [authLoading, existingUsername, navigate]);

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  // Step 0 — URL
  const [urlValue, setUrlValue] = useState('');
  const [availability, setAvailability] = useState(null);
  const [urlError, setUrlError] = useState('');
  const [claiming, setClaiming] = useState(false);

  // Step 1 — Name
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Step 2 — Profession
  const [profession, setProfession] = useState('');
  const [search, setSearch] = useState('');
  const [finishing, setFinishing] = useState(false);

  // Debounced URL availability
  useEffect(() => {
    if (urlValue.length < 3 || !/^[a-z0-9-]+$/.test(urlValue)) {
      setAvailability(null);
      return;
    }
    setAvailability('checking');
    const timer = setTimeout(async () => {
      try {
        const uid = await getUidByUsername(urlValue);
        setAvailability(uid ? 'taken' : 'available');
      } catch {
        setAvailability(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [urlValue]);

  const handleUrlChange = (e) => {
    setUrlValue(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
    setUrlError('');
  };

  const handleClaimUrl = async (e) => {
    e.preventDefault();
    if (!/^[a-z0-9-]{3,30}$/.test(urlValue)) {
      setUrlError('3–30 characters: lowercase letters, numbers, and hyphens only.');
      return;
    }
    if (availability === 'taken') {
      setUrlError('That username is already taken. Try another.');
      return;
    }
    setClaiming(true);
    try {
      await claimUsername(user.uid, urlValue);
      setDirection(1);
      setStep(1);
    } catch (err) {
      setUrlError(
        err.message === 'Username taken'
          ? 'That username is already taken. Try another.'
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setClaiming(false);
    }
  };

  const handleFinish = async () => {
    setFinishing(true);
    try {
      await saveSection(user.uid, 'profile', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        title: profession,
        bio1: '', bio2: '', location: '', email: '',
        linkedin: '', instagram: '', facebook: '',
        tiktok: '', twitter: '', youtube: '',
        availabilityNote: '', photo: '',
      });
      // Set the flag BEFORE updateUsername — the flag must be true when the
      // useEffect fires in response to existingUsername changing.
      completedSetup.current = true;
      updateUsername(urlValue); // triggers useEffect → navigate('/admin/import')
    } catch {
      setFinishing(false);
    }
  };

  const advance = () => { setDirection(1); setStep(s => s + 1); };
  const goBack  = () => { setDirection(-1); setStep(s => s - 1); };

  const filteredProfessions = PROFESSIONS.filter(p =>
    p.toLowerCase().includes(search.toLowerCase())
  );
  const showCustomOption =
    search.trim().length >= 2 &&
    !PROFESSIONS.some(p => p.toLowerCase() === search.trim().toLowerCase());

  if (authLoading) {
    return (
      <div className="min-h-screen bg-blush-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blush-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blush-50 via-white to-lavender-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">

        {/* Brand */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-8"
        >
          <a href="/" className="font-display text-3xl text-blush-500 font-light">Yana</a>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
          className="bg-white rounded-3xl shadow-lg"
        >
          <div className="p-8 sm:p-10">

            <ProgressDots step={step} />

            {/* Step content — overflow-hidden clips the slide animation;
                the -m/p trick gives button shadows & focus rings 8px of room */}
            <div className="overflow-hidden -mx-2 px-2 -my-1 py-1">
              <AnimatePresence mode="wait" custom={direction}>

                {/* ── Step 0: Claim URL ──────────────────────────────────── */}
                {step === 0 && (
                  <motion.div key="step-0" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit">
                    <motion.div variants={containerVariants} initial="hidden" animate="show">

                      <motion.div variants={emojiVariants} className="text-center mb-1">
                        <span className="text-4xl inline-block">✨</span>
                      </motion.div>

                      <motion.div variants={itemVariants} className="text-center mb-8">
                        <h1 className="font-display text-3xl text-gray-800 font-light mb-1.5">Claim your URL</h1>
                        <p className="font-body text-sm text-gray-400">Your permanent home on the web.</p>
                      </motion.div>

                      {urlError && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-red-50 border border-red-200 text-red-600 font-body text-sm px-4 py-3 rounded-xl mb-5"
                        >
                          {urlError}
                        </motion.div>
                      )}

                      <motion.form variants={itemVariants} onSubmit={handleClaimUrl} className="space-y-5">
                        <div>
                          <label className="font-body text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-1.5">
                            Your portfolio URL
                          </label>
                          <div className={`flex items-center border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blush-300 focus-within:border-transparent transition-all ${
                            availability === 'taken'     ? 'border-red-300 bg-red-50/30' :
                            availability === 'available' ? 'border-green-300 bg-green-50/30' :
                            'border-blush-200 bg-blush-50/50'
                          }`}>
                            <span className="font-body text-xs text-gray-400 pl-4 pr-0.5 shrink-0 whitespace-nowrap select-none">
                              {DOMAIN}/
                            </span>
                            <input
                              type="text"
                              value={urlValue}
                              onChange={handleUrlChange}
                              placeholder="your-name"
                              maxLength={30}
                              autoFocus
                              className="flex-1 font-body text-sm py-3 pr-3 bg-transparent focus:outline-none min-w-0"
                            />
                            <AnimatePresence mode="wait">
                              {availability && (
                                <motion.span
                                  key={availability}
                                  initial={{ opacity: 0, scale: 0.75 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.75 }}
                                  transition={{ duration: 0.18 }}
                                  className="pr-4 shrink-0 font-body text-xs"
                                >
                                  {availability === 'checking' && <span className="text-gray-400">…</span>}
                                  {availability === 'available' && <span className="text-green-500 font-semibold">✓ Available</span>}
                                  {availability === 'taken'    && <span className="text-red-500 font-semibold">✗ Taken</span>}
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </div>
                          <p className="font-body text-xs text-gray-400 mt-1.5">
                            Lowercase letters, numbers, and hyphens. Can't be changed later.
                          </p>
                        </div>

                        <button
                          type="submit"
                          disabled={urlValue.length < 3 || availability !== 'available' || claiming}
                          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {claiming
                            ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Claiming…</>
                            : <><span>Claim My URL</span><FiArrowRight size={14} /></>}
                        </button>
                      </motion.form>

                      <motion.p variants={itemVariants} className="font-body text-xs text-gray-400 text-center mt-6">
                        <a href="/" className="hover:text-blush-500 transition-colors">← Back to site</a>
                      </motion.p>

                    </motion.div>
                  </motion.div>
                )}

                {/* ── Step 1: Name ───────────────────────────────────────── */}
                {step === 1 && (
                  <motion.div key="step-1" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit">
                    <motion.div variants={containerVariants} initial="hidden" animate="show">

                      <motion.div variants={emojiVariants} className="text-center mb-1">
                        <span className="text-4xl inline-block">👋</span>
                      </motion.div>

                      <motion.div variants={itemVariants} className="text-center mb-8">
                        <h1 className="font-display text-3xl text-gray-800 font-light mb-1.5">What's your name?</h1>
                        <p className="font-body text-sm text-gray-400">
                          Appearing at{' '}
                          <span className="text-blush-500 font-medium">{DOMAIN}/{urlValue}</span>
                        </p>
                      </motion.div>

                      <div className="space-y-5">
                        <motion.div variants={itemVariants}>
                          <label className="font-body text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-1.5">
                            First Name
                          </label>
                          <input
                            type="text"
                            value={firstName}
                            onChange={e => setFirstName(e.target.value)}
                            placeholder="Jane"
                            autoFocus
                            className="w-full font-body text-sm border border-blush-200 rounded-xl px-4 py-3 bg-blush-50/50 focus:outline-none focus:ring-2 focus:ring-blush-300 focus:border-transparent placeholder:text-gray-300"
                          />
                        </motion.div>

                        <motion.div variants={itemVariants}>
                          <label className="font-body text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-1.5">
                            Last Name
                          </label>
                          <input
                            type="text"
                            value={lastName}
                            onChange={e => setLastName(e.target.value)}
                            placeholder="Smith"
                            onKeyDown={e => e.key === 'Enter' && firstName.trim() && advance()}
                            className="w-full font-body text-sm border border-blush-200 rounded-xl px-4 py-3 bg-blush-50/50 focus:outline-none focus:ring-2 focus:ring-blush-300 focus:border-transparent placeholder:text-gray-300"
                          />
                        </motion.div>

                        <motion.div variants={itemVariants} className="pt-3">
                          <button
                            onClick={advance}
                            disabled={!firstName.trim()}
                            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Continue <FiArrowRight size={14} />
                          </button>
                        </motion.div>
                      </div>

                    </motion.div>
                  </motion.div>
                )}

                {/* ── Step 2: Profession ─────────────────────────────────── */}
                {step === 2 && (
                  <motion.div key="step-2" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit">
                    <motion.div variants={containerVariants} initial="hidden" animate="show">

                      <motion.div variants={emojiVariants} className="text-center mb-1">
                        <span className="text-4xl inline-block">💼</span>
                      </motion.div>

                      <motion.div variants={itemVariants} className="text-center mb-6">
                        <h1 className="font-display text-3xl text-gray-800 font-light mb-1.5">What do you do?</h1>
                        <p className="font-body text-sm text-gray-400">Pick the title that fits you best.</p>
                      </motion.div>

                      {/* Search */}
                      <motion.div variants={itemVariants} className="relative mb-3">
                        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" size={13} />
                        <input
                          type="text"
                          value={search}
                          onChange={e => setSearch(e.target.value)}
                          placeholder="Search or type your own title…"
                          autoFocus
                          className="w-full font-body text-sm border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blush-300 focus:border-transparent placeholder:text-gray-300"
                        />
                      </motion.div>

                      {/* Pills */}
                      <motion.div variants={itemVariants} className="max-h-48 overflow-y-auto mb-4">
                        <div className="flex flex-wrap gap-2 px-0.5 py-1">
                          {filteredProfessions.map(p => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => { setProfession(p); setSearch(''); }}
                              className={`font-body text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-200 ${
                                profession === p
                                  ? 'bg-blush-500 text-white border-blush-500 shadow-sm'
                                  : 'bg-white text-gray-600 border-gray-200 hover:border-blush-300 hover:text-blush-600 hover:bg-blush-50/50'
                              }`}
                            >
                              {profession === p && <FiCheck className="inline mr-1 mb-0.5" size={9} strokeWidth={3} />}
                              {p}
                            </button>
                          ))}

                          {showCustomOption && (
                            <button
                              type="button"
                              onClick={() => { setProfession(search.trim()); setSearch(''); }}
                              className="font-body text-xs font-medium px-3 py-1.5 rounded-full border border-dashed border-blush-300 text-blush-500 hover:bg-blush-50 transition-all duration-200"
                            >
                              + Use "{search.trim()}"
                            </button>
                          )}

                          {filteredProfessions.length === 0 && !showCustomOption && (
                            <p className="font-body text-sm text-gray-400 py-2 w-full text-center">
                              Type to add your own title.
                            </p>
                          )}
                        </div>
                      </motion.div>

                      {/* Selection confirmation */}
                      <AnimatePresence>
                        {profession && (
                          <motion.div
                            initial={{ opacity: 0, y: -6, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                            exit={{ opacity: 0, y: -6, height: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden mb-4"
                          >
                            <div className="flex items-center gap-1.5 font-body text-xs text-blush-600 bg-blush-50 px-3 py-2 rounded-lg">
                              <FiCheck size={11} strokeWidth={3} />
                              <span className="font-semibold">{profession}</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <motion.div variants={itemVariants} className="pt-3">
                        <button
                          onClick={handleFinish}
                          disabled={!profession || finishing}
                          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {finishing
                            ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Setting up your portfolio…</>
                            : <><span>Build My Portfolio</span><FiArrowRight size={14} /></>}
                        </button>
                      </motion.div>

                    </motion.div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* Back button */}
            <AnimatePresence>
              {step > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.25 }}
                  className="flex justify-center mt-6"
                >
                  <button
                    onClick={goBack}
                    disabled={finishing}
                    className="flex items-center gap-1.5 font-body text-xs text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40"
                  >
                    <FiArrowLeft size={12} /> Back
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </motion.div>

      </div>
    </div>
  );
}
