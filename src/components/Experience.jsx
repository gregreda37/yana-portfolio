import { useRef, useState, useEffect } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { FiMapPin, FiCalendar, FiBookOpen, FiGlobe, FiX, FiAward } from 'react-icons/fi';
import { useData } from '../contexts/DataContext';
import { sortJobsByDate, computePeriod } from '../utils/sortJobs';
import { linkify } from '../utils/linkify';

function EduModal({ entry, onClose }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const isCert = (entry.type ?? 'Education') === 'Certification';
  const courses = (entry.courses ?? '').split('\n').map(s => s.trim()).filter(Boolean);
  const hasContent = isCert ? !!entry.description : courses.length > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-br from-accent-50 to-accent-100 px-7 pt-7 pb-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 font-body text-xs font-semibold px-2.5 py-1 rounded-full bg-white/70 text-accent-600 mb-3">
                  {isCert ? <FiAward size={11} /> : <FiBookOpen size={11} />}
                  {entry.type ?? 'Education'}
                </span>
                <h2 className="font-display text-2xl font-light text-gray-800 leading-tight">{entry.degree}</h2>
                <p className="font-body text-sm text-accent-500 font-semibold mt-1">{entry.school}</p>
                {entry.year && (
                  <p className="font-body text-xs text-gray-400 flex items-center gap-1 mt-1.5">
                    <FiCalendar size={10} /> {entry.year}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="shrink-0 w-8 h-8 rounded-full bg-white/60 hover:bg-white/90 flex items-center justify-center text-gray-500 transition-colors"
              >
                <FiX size={15} />
              </button>
            </div>
          </div>

          {/* Body */}
          {hasContent ? (
            <div className="px-7 py-6">
              {isCert ? (
                <>
                  <p className="font-body text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">About this Certification</p>
                  <p className="font-body text-sm text-gray-600 leading-relaxed">{entry.description}</p>
                </>
              ) : (
                <>
                  <p className="font-body text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Relevant Courses</p>
                  <ul className="flex flex-wrap gap-2 max-h-[144px] overflow-y-auto pr-1">
                    {courses.map((c, i) => (
                      <li key={i} className="font-body text-xs font-medium px-3 py-1.5 bg-accent-50 text-accent-700 border border-accent-100 rounded-full">
                        {c}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ) : (
            <div className="px-7 py-6">
              <p className="font-body text-sm text-gray-400 italic">No additional details added yet.</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function Experience() {
  const { experience, profile } = useData();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [selectedEdu, setSelectedEdu] = useState(null);

  const jobs = sortJobsByDate(experience?.jobs);
  const education = experience?.education ?? [];
  const skills = experience?.skills ?? [];
  const languages = experience?.languages ?? [];
  if (!jobs.length && !education.length && !skills.length && !languages.length) return null;

  return (
    <section id="experience" className="py-24 px-6 bg-white" ref={ref}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="section-subtitle">Career History</p>
          <h2 className="section-title">Experience & Education</h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Work experience timeline */}
          <div className="lg:col-span-2">
            <h3 className="font-body text-xs font-semibold uppercase tracking-widest text-gray-400 mb-8">Work Experience</h3>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-3 top-0 bottom-0 w-px bg-accent-100" />

              <div className="space-y-10">
                {jobs.map((job, i) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.5, delay: i * 0.12 }}
                    className="relative pl-10"
                  >
                    {/* Dot */}
                    <div className="absolute left-0 top-1.5 w-6 h-6 bg-white border-2 border-accent-300 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-accent-400 rounded-full" />
                    </div>

                    <div className="card">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                        <div>
                          <h4 className="font-display text-xl font-medium text-gray-800">{job.role}</h4>
                          <p className="font-body text-accent-500 font-semibold text-sm">{job.company}</p>
                        </div>
                        <span className="font-body text-xs text-gray-400 bg-accent-50 px-3 py-1 rounded-full border border-accent-100">
                          {computePeriod(job)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
                        <FiMapPin size={11} />
                        <span className="font-body">{job.location}</span>
                      </div>
                      <ul className="space-y-2">
                        {(job.highlights ?? []).map((h, idx) => (
                          <li key={idx} className="flex gap-3 font-body text-sm text-gray-500 leading-relaxed">
                            <span className="text-accent-300 mt-1 shrink-0">◆</span>
                            {linkify(h, 'underline hover:opacity-80')}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Education + sidebar */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h3 className="font-body text-xs font-semibold uppercase tracking-widest text-gray-400 mb-8">Education & Certs</h3>
              <div className="space-y-4">
                {(experience.education ?? []).map(ed => {
                  const isCert = (ed.type ?? 'Education') === 'Certification';
                  const hasDetail = isCert ? !!ed.description : (ed.courses ?? '').trim().length > 0;
                  return (
                    <button
                      key={ed.id}
                      onClick={() => setSelectedEdu(ed)}
                      className={`card w-full text-left flex gap-4 transition-shadow group ${hasDetail ? 'hover:shadow-md cursor-pointer' : 'cursor-default'}`}
                    >
                      <div className="shrink-0 w-10 h-10 bg-accent-100 rounded-xl flex items-center justify-center group-hover:bg-accent-200 transition-colors">
                        {isCert
                          ? <FiAward className="text-accent-500" size={16} />
                          : <FiBookOpen className="text-accent-500" size={16} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-body text-sm font-semibold text-gray-700 leading-tight">{ed.degree}</p>
                          {(ed.type) && (
                            <span className="font-body text-[10px] px-2 py-0.5 rounded-full bg-accent-50 text-accent-500 border border-accent-100 shrink-0">
                              {ed.type}
                            </span>
                          )}
                        </div>
                        <p className="font-body text-xs text-gray-400 mt-1">{ed.school}</p>
                        <p className="font-body text-xs text-accent-400 mt-0.5 flex items-center gap-1">
                          <FiCalendar size={10} /> {ed.year}
                        </p>
                        {hasDetail && (
                          <p className="font-body text-[10px] text-accent-400 mt-2 font-semibold uppercase tracking-widest">
                            {isCert ? 'View details →' : 'View courses →'}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Languages */}
              {languages.length > 0 && (
                <div className="mt-8">
                  <h3 className="font-body text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Languages</h3>
                  <div className="space-y-2.5">
                    {languages.map((lang, i) => (
                      <div key={lang.id ?? i} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 bg-accent-50 border border-accent-100 rounded-lg flex items-center justify-center shrink-0">
                            <FiGlobe className="text-accent-400" size={12} />
                          </div>
                          <span className="font-body text-sm text-gray-700 font-medium">{lang.name}</span>
                        </div>
                        <span className="font-body text-xs px-2.5 py-1 rounded-full bg-accent-50 text-accent-600 border border-accent-100 shrink-0">
                          {lang.level}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Availability card */}
              <div className="mt-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl p-6 text-white text-center shadow-md">
                <p className="font-display text-2xl font-light mb-2">{profile.availabilityTitle || 'Open to Connect'}</p>
                <p className="font-body text-sm opacity-90 leading-relaxed">
                  {linkify(profile.availabilityNote, 'underline hover:opacity-80')}
                </p>
                <a href="#contact" className="mt-4 inline-block bg-white text-accent-600 font-body font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-accent-50 transition-colors">
                  {profile.availabilityButton || "Let's Talk"}
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {selectedEdu && <EduModal entry={selectedEdu} onClose={() => setSelectedEdu(null)} />}
    </section>
  );
}
