import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { FiMapPin, FiCalendar, FiBookOpen } from 'react-icons/fi';
import { useData } from '../contexts/DataContext';

export default function Experience() {
  const { experience, profile } = useData();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

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
              <div className="absolute left-3 top-0 bottom-0 w-px bg-blush-100" />

              <div className="space-y-10">
                {(experience.jobs ?? []).map((job, i) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.5, delay: i * 0.12 }}
                    className="relative pl-10"
                  >
                    {/* Dot */}
                    <div className="absolute left-0 top-1.5 w-6 h-6 bg-white border-2 border-blush-300 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-blush-400 rounded-full" />
                    </div>

                    <div className="card">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                        <div>
                          <h4 className="font-display text-xl font-medium text-gray-800">{job.role}</h4>
                          <p className="font-body text-blush-500 font-semibold text-sm">{job.company}</p>
                        </div>
                        <span className="font-body text-xs text-gray-400 bg-blush-50 px-3 py-1 rounded-full border border-blush-100">
                          {job.period}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
                        <FiMapPin size={11} />
                        <span className="font-body">{job.location}</span>
                      </div>
                      <ul className="space-y-2">
                        {job.highlights.map((h, idx) => (
                          <li key={idx} className="flex gap-3 font-body text-sm text-gray-500 leading-relaxed">
                            <span className="text-blush-300 mt-1 shrink-0">◆</span>
                            {h}
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
                {(experience.education ?? []).map(ed => (
                  <div key={ed.id} className="card flex gap-4">
                    <div className="shrink-0 w-10 h-10 bg-lavender-100 rounded-xl flex items-center justify-center">
                      <FiBookOpen className="text-lavender-500" size={16} />
                    </div>
                    <div>
                      <p className="font-body text-sm font-semibold text-gray-700 leading-tight">{ed.degree}</p>
                      <p className="font-body text-xs text-gray-400 mt-1">{ed.school}</p>
                      <p className="font-body text-xs text-blush-400 mt-0.5 flex items-center gap-1">
                        <FiCalendar size={10} /> {ed.year}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Availability card */}
              <div className="mt-8 bg-gradient-to-br from-blush-500 to-blush-600 rounded-2xl p-6 text-white text-center shadow-md">
                <p className="font-display text-2xl font-light mb-2">Open to</p>
                <p className="font-body text-sm opacity-90 leading-relaxed">
                  {profile.availabilityNote}
                </p>
                <a href="#contact" className="mt-4 inline-block bg-white text-blush-600 font-body font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-blush-50 transition-colors">
                  Let's Talk
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
