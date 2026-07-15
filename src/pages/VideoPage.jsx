import { useState, useEffect, useRef } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiArrowLeft, FiMail, FiMapPin, FiLinkedin, FiInstagram,
  FiFacebook, FiTwitter, FiYoutube,
} from 'react-icons/fi';
import { SiTiktok } from 'react-icons/si';
import { getUidByUsername } from '../firebase/db';
import { DataProvider, useData } from '../contexts/DataContext';

const SOCIAL = [
  { key: 'linkedin',  Icon: FiLinkedin,  label: 'LinkedIn' },
  { key: 'instagram', Icon: FiInstagram, label: 'Instagram' },
  { key: 'facebook',  Icon: FiFacebook,  label: 'Facebook' },
  { key: 'tiktok',    Icon: SiTiktok,    label: 'TikTok' },
  { key: 'twitter',   Icon: FiTwitter,   label: 'Twitter / X' },
  { key: 'youtube',   Icon: FiYoutube,   label: 'YouTube' },
];

const ICON_MAP = {
  target: '🎯', dollar: '💰', users: '👥', heart: '❤️',
};

function AnimatedCount({ value, prefix = '', suffix = '' }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const observed = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !observed.current) {
        observed.current = true;
        const start = performance.now();
        const duration = 1400;
        const tick = (now) => {
          const t = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - t, 3);
          setDisplay(Math.round(ease * value));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [value]);

  return <span ref={ref}>{prefix}{display.toLocaleString()}{suffix}</span>;
}

function VideoContent() {
  const { username } = useParams();
  const { profile, video, metrics, settings, firestoreLoaded, firestoreError } = useData();
  const accentColor = settings?.accentColor ?? 'blush';
  const videoUrl = video?.url ?? '';
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
  const topMetrics = (metrics?.items ?? []).slice(0, 4);
  const activeSocials = SOCIAL.filter(s => profile[s.key]);

  if (!firestoreLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (firestoreError || !videoUrl) return <Navigate to={`/${username}`} replace />;

  return (
    <div data-accent={accentColor} className="min-h-screen bg-gradient-to-br from-accent-50 via-white to-accent-100">

      {/* Sticky top nav */}
      <nav className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-accent-100 h-14 flex items-center justify-between px-5 md:px-8">
        <a
          href={`/${username}`}
          className="flex items-center gap-2 font-body text-sm text-gray-500 hover:text-accent-500 transition-colors"
        >
          <FiArrowLeft size={15} />
          <span className="hidden sm:inline">Back to Portfolio</span>
          <span className="sm:hidden">Back</span>
        </a>
        {fullName && (
          <p className="font-display text-base md:text-lg text-gray-700 truncate px-4 hidden sm:block">{fullName}</p>
        )}
        <a
          href={`/${username}#contact`}
          className="btn-primary text-xs px-4 py-2 shrink-0"
        >
          Get in Touch
        </a>
      </nav>

      {/* Page body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14">

        {/* 3-col grid on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_260px] gap-6 xl:gap-8 items-start">

          {/* ── LEFT: Profile card ── */}
          <motion.aside
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:sticky lg:top-20 space-y-5 order-2 lg:order-1"
          >
            <div className="bg-white rounded-3xl shadow-sm border border-accent-100 overflow-hidden">
              {/* Accent header strip */}
              <div className="h-2 bg-gradient-to-r from-accent-300 via-accent-400 to-accent-500" />

              <div className="p-6">
                {/* Photo + name */}
                <div className="flex items-center gap-4 mb-5">
                  {profile.photo ? (
                    <img
                      src={profile.photo}
                      alt={fullName}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-200 to-accent-400 flex items-center justify-center shrink-0">
                      <span className="font-display text-2xl text-white font-light">
                        {(profile.firstName?.[0] ?? '?')}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="font-display text-xl text-gray-800 leading-tight">{fullName}</h2>
                    {profile.title && (
                      <p className="font-body text-xs text-accent-500 font-semibold mt-0.5 truncate">{profile.title}</p>
                    )}
                  </div>
                </div>

                {/* Bio snippet */}
                {profile.bio1 && (
                  <p className="font-body text-sm text-gray-500 leading-relaxed mb-5 line-clamp-4">
                    {profile.bio1}
                  </p>
                )}

                <div className="border-t border-gray-100 pt-4 space-y-3">
                  {profile.email && (
                    <a
                      href={`mailto:${profile.email}`}
                      className="flex items-center gap-3 group"
                    >
                      <div className="w-8 h-8 bg-accent-50 rounded-xl flex items-center justify-center shrink-0">
                        <FiMail className="text-accent-400 group-hover:text-accent-500 transition-colors" size={13} />
                      </div>
                      <span className="font-body text-xs text-gray-500 group-hover:text-accent-500 transition-colors truncate">
                        {profile.email}
                      </span>
                    </a>
                  )}
                  {profile.location && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                        <FiMapPin className="text-gray-400" size={13} />
                      </div>
                      <span className="font-body text-xs text-gray-500">{profile.location}</span>
                    </div>
                  )}
                </div>

                {/* Social links */}
                {activeSocials.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                    {activeSocials.slice(0, 4).map(({ key, Icon, label }) => (
                      <a
                        key={key}
                        href={profile[key]}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={label}
                        className="w-8 h-8 rounded-xl border border-accent-200 bg-accent-50 flex items-center justify-center text-accent-500 hover:bg-accent-100 transition-colors"
                      >
                        <Icon size={13} />
                      </a>
                    ))}
                  </div>
                )}

                <a
                  href={`/${username}`}
                  className="mt-5 w-full btn-outline text-xs py-2 flex items-center justify-center gap-2"
                >
                  View Full Portfolio
                </a>
              </div>
            </div>
          </motion.aside>

          {/* ── CENTER: Video ── */}
          <motion.main
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="min-w-0 order-1 lg:order-2"
          >
            {/* Video title + description */}
            {(video.title || video.description) && (
              <div className="mb-5 text-center lg:text-left">
                {video.title && (
                  <h1 className="font-display text-3xl md:text-4xl font-light text-gray-800 leading-tight mb-2">
                    {video.title}
                  </h1>
                )}
                {video.description && (
                  <p className="font-body text-gray-400 text-sm md:text-base leading-relaxed max-w-xl">
                    {video.description}
                  </p>
                )}
              </div>
            )}

            {/* Video player */}
            <div className="aspect-video rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/5 bg-gray-900">
              <video
                src={videoUrl}
                controls
                className="w-full h-full"
                preload="metadata"
                playsInline
                title={video.title || `${fullName} — intro video`}
              >
                Your browser doesn't support video playback.
              </video>
            </div>

            {/* Metrics strip below video */}
            {topMetrics.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className={`mt-6 grid gap-4 ${topMetrics.length === 1 ? 'grid-cols-1' : topMetrics.length === 2 ? 'grid-cols-2' : topMetrics.length === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}
              >
                {topMetrics.map((m, i) => (
                  <div
                    key={m.id ?? i}
                    className="bg-white rounded-2xl border border-accent-100 px-5 py-4 text-center shadow-sm"
                  >
                    {m.icon && <div className="text-xl mb-1">{ICON_MAP[m.icon] ?? '📌'}</div>}
                    <div className="font-display text-2xl md:text-3xl text-accent-500 font-light">
                      <AnimatedCount value={m.value} prefix={m.prefix ?? ''} suffix={m.suffix ?? ''} />
                    </div>
                    <p className="font-body text-xs text-gray-500 mt-1 font-medium">{m.label}</p>
                    {m.description && (
                      <p className="font-body text-[10px] text-gray-400 mt-0.5 leading-tight">{m.description}</p>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </motion.main>

          {/* ── RIGHT: Connect card ── */}
          <motion.aside
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:sticky lg:top-20 space-y-4 order-3"
          >
            {/* Connect card */}
            <div className="bg-white rounded-3xl shadow-sm border border-accent-100 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-accent-500 via-accent-400 to-accent-300" />
              <div className="p-6">
                <p className="font-body text-xs font-semibold uppercase tracking-widest text-accent-400 mb-1">
                  Let's Connect
                </p>
                <h3 className="font-display text-xl text-gray-800 mb-4">
                  {profile.availabilityTitle || 'Open to Connect'}
                </h3>
                {profile.availabilityNote && (
                  <p className="font-body text-xs text-gray-400 mb-4 leading-relaxed">{profile.availabilityNote}</p>
                )}
                <a
                  href={`/${username}#contact`}
                  className="btn-primary w-full flex items-center justify-center text-sm py-3"
                >
                  {profile.availabilityButton || "Let's Talk"}
                </a>
              </div>
            </div>

            {/* Quick facts card */}
            <div className="bg-white rounded-3xl shadow-sm border border-accent-100 p-6">
              <p className="font-body text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
                Quick Facts
              </p>
              <ul className="space-y-3">
                {profile.title && (
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-400 mt-1.5 shrink-0" />
                    <span className="font-body text-sm text-gray-600">{profile.title}</span>
                  </li>
                )}
                {profile.location && (
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-300 mt-1.5 shrink-0" />
                    <span className="font-body text-sm text-gray-600">Based in {profile.location}</span>
                  </li>
                )}
                {profile.bio2 && (
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-200 mt-1.5 shrink-0" />
                    <span className="font-body text-sm text-gray-600 line-clamp-3">{profile.bio2}</span>
                  </li>
                )}
                {topMetrics[0] && (
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-400 mt-1.5 shrink-0" />
                    <span className="font-body text-sm text-gray-600">
                      {topMetrics[0].prefix}{topMetrics[0].value.toLocaleString()}{topMetrics[0].suffix} {topMetrics[0].label}
                    </span>
                  </li>
                )}
                {topMetrics[1] && (
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-300 mt-1.5 shrink-0" />
                    <span className="font-body text-sm text-gray-600">
                      {topMetrics[1].prefix}{topMetrics[1].value.toLocaleString()}{topMetrics[1].suffix} {topMetrics[1].label}
                    </span>
                  </li>
                )}
              </ul>
            </div>

            {/* Share hint */}
            <div className="bg-accent-50 border border-accent-100 rounded-2xl p-4">
              <p className="font-body text-xs text-accent-600 leading-relaxed">
                Share this page directly — the link always shows the video with your latest profile details.
              </p>
            </div>
          </motion.aside>

        </div>
      </div>

      {/* Subtle bottom decoration */}
      <div className="h-24 bg-gradient-to-t from-accent-100/40 to-transparent mt-6 pointer-events-none" />
    </div>
  );
}

export default function VideoPage() {
  const { username } = useParams();
  const [uid, setUid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getUidByUsername(username)
      .then(found => { if (found) setUid(found); else setNotFound(true); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (notFound) return <Navigate to="/" replace />;

  return (
    <DataProvider uid={uid} readOnly>
      <VideoContent />
    </DataProvider>
  );
}
