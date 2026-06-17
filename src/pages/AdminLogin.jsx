import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { FiArrowRight, FiCheck } from 'react-icons/fi';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

const PERKS = [
  'Your own URL — findyana.com/yourname',
  'AI resume import to get started fast',
  'Metrics, testimonials & blog built in',
  'Free to start, no credit card needed',
];

export default function AdminLogin() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/admin');
    } catch {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      navigate('/admin');
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Google sign-in failed. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* ── Left brand panel ─────────────────────────────────────────────── */}
      <div className="relative md:w-[46%] min-h-[340px] md:min-h-screen overflow-hidden bg-gradient-to-br from-blush-50 via-rose-50 to-lavender-100 flex flex-col justify-between p-10 md:p-14">

        {/* Soft gradient orbs */}
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-blush-200/60 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-lavender-200/50 blur-[80px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-64 h-64 rounded-full bg-rose-100/70 blur-[60px] pointer-events-none" />

        {/* Decorative rings */}
        <div className="absolute top-16 right-10 w-36 h-36 rounded-full border border-blush-200/60" />
        <div className="absolute top-24 right-20 w-20 h-20 rounded-full border border-rose-200/50" />
        <div className="absolute bottom-16 left-8 w-52 h-52 rounded-full border border-blush-200/40" />
        <div className="absolute bottom-28 left-20 w-24 h-24 rounded-full border border-lavender-200/60" />

        {/* Scattered dots */}
        {[
          'top-[18%] right-[22%]', 'top-[35%] right-[12%]',
          'top-[60%] right-[28%]', 'bottom-[20%] right-[15%]',
          'top-[45%] left-[8%]',
        ].map((pos, i) => (
          <div key={i} className={`absolute ${pos} w-1.5 h-1.5 rounded-full bg-blush-300/70`} />
        ))}

        {/* Brand */}
        <div className="relative z-10">
          <a href="/" className="font-display text-3xl text-blush-500 font-light tracking-wide">Yana</a>
        </div>

        {/* Main content */}
        <motion.div
          className="relative z-10 py-6"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-sm border border-blush-200 rounded-full px-4 py-1.5 mb-6 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-blush-400 animate-pulse" />
            <span className="font-body text-xs text-blush-500 tracking-wide">New here?</span>
          </div>

          <h2 className="font-display text-4xl md:text-[2.75rem] font-light text-gray-800 leading-[1.1] mb-5">
            Your story is<br />
            <span className="italic text-blush-500">bigger</span> than<br />
            a resume.
          </h2>
          <p className="font-body text-sm text-gray-500 leading-relaxed mb-8 max-w-[260px]">
            Build a portfolio that shows the world not just where you've been — but who you're becoming.
          </p>

          <ul className="space-y-3 mb-10">
            {PERKS.map((p, i) => (
              <motion.li
                key={p}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.09, duration: 0.4 }}
                className="flex items-start gap-3"
              >
                <span className="w-5 h-5 rounded-full bg-blush-100 border border-blush-200 flex items-center justify-center shrink-0 mt-0.5">
                  <FiCheck size={10} className="text-blush-500" strokeWidth={2.5} />
                </span>
                <span className="font-body text-sm text-gray-600">{p}</span>
              </motion.li>
            ))}
          </ul>

          <Link
            to="/admin/signup"
            className="group inline-flex items-center gap-2.5 bg-blush-500 hover:bg-blush-600 text-white font-body font-semibold text-sm px-7 py-3.5 rounded-full transition-all duration-200 shadow-md shadow-blush-200 hover:shadow-lg hover:shadow-blush-300/50 hover:-translate-y-0.5"
          >
            Create your portfolio
            <FiArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform duration-200" />
          </Link>
        </motion.div>

        {/* Bottom tag */}
        <div className="relative z-10">
          <p className="font-body text-xs text-blush-300 tracking-wide">
            findyana.com/<span className="italic">yourname</span>
          </p>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-14 bg-white">

        {/* Mobile brand */}
        <div className="md:hidden text-center mb-8">
          <a href="/" className="font-display text-3xl text-blush-500 font-light tracking-wide">Yana</a>
        </div>

        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h1 className="font-display text-3xl font-light text-gray-800 mb-1">Welcome back.</h1>
          <p className="font-body text-sm text-gray-400 mb-8">Sign in to your Yana account.</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 font-body text-sm px-4 py-3 rounded-xl mb-5">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl px-4 py-3 font-body text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mb-5 shadow-sm"
          >
            <GoogleIcon />
            {googleLoading ? 'Signing in…' : 'Continue with Google'}
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="font-body text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="font-body text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full font-body text-sm border border-blush-200 rounded-xl px-4 py-3 bg-blush-50/50 focus:outline-none focus:ring-2 focus:ring-blush-300 focus:border-transparent placeholder:text-gray-300"
              />
            </div>
            <div>
              <label className="font-body text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full font-body text-sm border border-blush-200 rounded-xl px-4 py-3 bg-blush-50/50 focus:outline-none focus:ring-2 focus:ring-blush-300 focus:border-transparent placeholder:text-gray-300"
              />
            </div>
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="btn-primary w-full mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center space-y-2">
            <p className="font-body text-xs text-gray-400">
              Don't have an account?{' '}
              <Link to="/admin/signup" className="text-blush-500 hover:text-blush-600 font-semibold transition-colors">
                Create one free
              </Link>
            </p>
            <p className="font-body text-xs text-gray-400">
              <a href="/" className="hover:text-blush-500 transition-colors">← Back to site</a>
            </p>
          </div>
        </motion.div>
      </div>

    </div>
  );
}
