import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { FiDownload, FiLinkedin, FiMail, FiHeart } from 'react-icons/fi';
import { useData } from '../contexts/DataContext';

export default function About() {
  const { profile, experience, healthcare } = useData();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="about" className="py-24 px-6 bg-white" ref={ref}>
      <div className="max-w-6xl mx-auto">
        {/* Top row: photo + bio */}
        <div className="grid md:grid-cols-2 gap-16 items-center mb-16">
          {/* Photo placeholder */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <div className="relative w-full max-w-sm mx-auto">
              <div className="absolute -inset-4 bg-gradient-to-br from-blush-200 to-lavender-200 rounded-3xl -rotate-3" />
              <div className="relative bg-gradient-to-br from-blush-100 to-lavender-100 rounded-3xl aspect-[4/5] flex items-center justify-center overflow-hidden">
                <div className="text-center">
                  <div className="w-24 h-24 bg-blush-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="font-display text-4xl text-white font-medium">Y</span>
                  </div>
                  <p className="font-body text-sm text-blush-400 italic">Add your photo here</p>
                </div>
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

            {/* Sales skills */}
            <div className="flex flex-wrap gap-2 mb-8">
              {(experience.skills ?? []).map(skill => (
                <span
                  key={skill}
                  className="font-body text-xs font-medium text-blush-600 bg-blush-50 border border-blush-200 px-3 py-1.5 rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <a href="#contact" className="btn-primary">Get in Touch</a>
              <a
                href="/resume.pdf"
                download
                className="btn-outline flex items-center gap-2"
              >
                <FiDownload size={14} />
                Download Resume
              </a>
            </div>

            <div className="flex gap-4 mt-6">
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noreferrer"
                className="text-blush-400 hover:text-blush-600 transition-colors"
                aria-label="LinkedIn"
              >
                <FiLinkedin size={20} />
              </a>
              <a
                href={`mailto:${profile.email}`}
                className="text-blush-400 hover:text-blush-600 transition-colors"
                aria-label="Email"
              >
                <FiMail size={20} />
              </a>
            </div>
          </motion.div>
        </div>

        {/* Healthcare background highlight */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-gradient-to-br from-rose-50 via-blush-50 to-lavender-50 border border-blush-100 rounded-3xl p-8 md:p-10"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white border border-blush-200 rounded-2xl flex items-center justify-center shadow-sm">
              <FiHeart className="text-blush-500" size={18} />
            </div>
            <div>
              <p className="section-subtitle mb-0">Past Experience</p>
              <h3 className="font-display text-2xl md:text-3xl font-light text-gray-800 leading-tight">
                Healthcare Background
              </h3>
            </div>
          </div>

          <p className="font-body text-gray-500 leading-relaxed mb-6 max-w-3xl">
            {healthcare.summary}
          </p>

          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            {(healthcare.highlights ?? []).map((h, i) => (
              <div key={i} className="flex gap-3 items-start bg-white/70 rounded-xl px-4 py-3">
                <span className="text-blush-300 mt-0.5 shrink-0 text-lg leading-none">◆</span>
                <p className="font-body text-sm text-gray-600 leading-relaxed">{h}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {(healthcare.skills ?? []).map(skill => (
              <span
                key={skill}
                className="font-body text-xs font-medium text-rose-600 bg-white border border-rose-200 px-3 py-1.5 rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
