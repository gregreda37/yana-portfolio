import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { FiLinkedin, FiMail, FiHeart, FiInstagram, FiFacebook, FiTwitter, FiYoutube } from 'react-icons/fi';
import { SiTiktok } from 'react-icons/si';
import { useData } from '../contexts/DataContext';

const SOCIAL_ICONS = [
  { key: 'linkedin',  Icon: FiLinkedin,  label: 'LinkedIn' },
  { key: 'instagram', Icon: FiInstagram, label: 'Instagram' },
  { key: 'facebook',  Icon: FiFacebook,  label: 'Facebook' },
  { key: 'tiktok',    Icon: SiTiktok,    label: 'TikTok' },
  { key: 'twitter',   Icon: FiTwitter,   label: 'Twitter / X' },
  { key: 'youtube',   Icon: FiYoutube,   label: 'YouTube' },
];

export default function About() {
  const { profile, experience, healthcare, settings } = useData();
  const showSpecialty = settings?.visible?.specialty !== false;
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="about" className="py-24 px-6 bg-white" ref={ref}>
      <div className="max-w-6xl mx-auto">
        {/* Top row: photo + bio */}
        <div className="grid md:grid-cols-2 gap-16 items-center mb-16">
          {/* Photo */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <div className="relative w-full max-w-sm mx-auto">
              <div className="absolute -inset-4 bg-gradient-to-br from-accent-200 to-accent-200 rounded-3xl -rotate-3" />
              <div className="relative bg-gradient-to-br from-accent-100 to-accent-100 rounded-3xl aspect-[4/5] flex items-center justify-center overflow-hidden">
                {profile.photo ? (
                  <img src={profile.photo} alt={[profile.firstName, profile.lastName].filter(Boolean).join(' ')} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'var(--accent-300)' }}>
                      <span className="font-display text-4xl text-white font-medium">
                        {profile.firstName?.[0] ?? 'Y'}
                      </span>
                    </div>
                    <p className="font-body text-sm italic" style={{ color: 'var(--accent-400)' }}>Add your photo in Profile</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Bio */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <p className="section-subtitle">About Me</p>
            <h2 className="section-title mb-6">
              Results-driven sales professional with a heart for people.
            </h2>
            <p className="font-body text-gray-500 leading-relaxed mb-4">{profile.bio1}</p>
            <p className="font-body text-gray-500 leading-relaxed mb-8">{profile.bio2}</p>

            {/* Skills */}
            <div className="flex flex-wrap gap-2 mb-8">
              {(experience.skills ?? []).map(skill => (
                <span
                  key={skill}
                  className="font-body text-xs font-medium px-3 py-1.5 rounded-full border"
                  style={{ color: 'var(--accent-600)', backgroundColor: 'var(--accent-50)', borderColor: 'var(--accent-200)' }}
                >
                  {skill}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
              <a href="#contact" className="btn-primary">Get in Touch</a>
            </div>

            <div className="flex flex-wrap gap-2">
              {SOCIAL_ICONS.filter(s => profile[s.key]).map(({ key, Icon, label }) => (
                <a
                  key={key}
                  href={profile[key]}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="flex items-center gap-2 font-body text-xs font-semibold px-3.5 py-2 rounded-full border transition-colors hover:bg-accent-50"
                  style={{ color: 'var(--accent-600)', borderColor: 'var(--accent-200)', backgroundColor: 'var(--accent-50)' }}
                >
                  <Icon size={13} />
                  {label}
                </a>
              ))}
              {profile.email && (
                <a
                  href={`mailto:${profile.email}`}
                  aria-label="Email"
                  className="flex items-center gap-2 font-body text-xs font-semibold px-3.5 py-2 rounded-full border transition-colors hover:bg-accent-50"
                  style={{ color: 'var(--accent-600)', borderColor: 'var(--accent-200)', backgroundColor: 'var(--accent-50)' }}
                >
                  <FiMail size={13} />
                  Email
                </a>
              )}
            </div>
          </motion.div>
        </div>

        {/* Specialty highlight */}
        {showSpecialty && healthcare?.summary && (
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="rounded-3xl p-8 md:p-10"
            style={{ background: 'linear-gradient(135deg, var(--accent-50), #f5f3ff)', border: '1px solid var(--accent-100)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm" style={{ border: '1px solid var(--accent-200)' }}>
                <FiHeart size={18} style={{ color: 'var(--accent-500)' }} />
              </div>
              <div>
                <p className="section-subtitle mb-0">Past Experience</p>
                <h3 className="font-display text-2xl md:text-3xl font-light text-gray-800 leading-tight">
                  {healthcare.label || 'Specialty Background'}
                </h3>
              </div>
            </div>

            <p className="font-body text-gray-500 leading-relaxed mb-6 max-w-3xl">
              {healthcare.summary}
            </p>

            <div className="grid sm:grid-cols-2 gap-3 mb-6">
              {(healthcare.highlights ?? []).map((h, i) => (
                <div key={i} className="flex gap-3 items-start bg-white/70 rounded-xl px-4 py-3">
                  <span className="mt-0.5 shrink-0 text-lg leading-none" style={{ color: 'var(--accent-300)' }}>◆</span>
                  <p className="font-body text-sm text-gray-600 leading-relaxed">{h}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {(healthcare.skills ?? []).map(skill => (
                <span
                  key={skill}
                  className="font-body text-xs font-medium bg-white px-3 py-1.5 rounded-full border"
                  style={{ color: 'var(--accent-600)', borderColor: 'var(--accent-200)' }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
