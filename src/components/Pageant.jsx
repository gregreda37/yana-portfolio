import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { FiAward, FiHeart, FiStar } from 'react-icons/fi';
import { useData } from '../contexts/DataContext';

const PLACEMENT_COLORS = {
  'Title Holder':    'bg-amber-100 text-amber-700 border-amber-200',
  '1st Runner-Up':  'bg-gray-100 text-gray-600 border-gray-200',
  '2nd Runner-Up':  'bg-orange-50 text-orange-600 border-orange-200',
  'Finalist':       'bg-lavender-100 text-purple-600 border-lavender-200',
  'Semi-Finalist':  'bg-blush-100 text-blush-600 border-blush-200',
};

function placementColor(placement) {
  for (const key of Object.keys(PLACEMENT_COLORS)) {
    if (placement?.includes(key)) return PLACEMENT_COLORS[key];
  }
  return 'bg-gray-100 text-gray-600 border-gray-200';
}

export default function Pageant() {
  const { pageant } = useData();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  if (!pageant?.bio && !pageant?.titles?.length) return null;

  const titles = pageant.titles ?? [];
  const achievements = pageant.achievements ?? [];
  const communityImpact = pageant.communityImpact ?? [];
  const photos = pageant.photos ?? [];

  return (
    <section id="pageant" className="py-24 px-6 bg-gradient-to-br from-amber-50 via-white to-blush-50" ref={ref}>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-100 border border-amber-200 mb-5 text-2xl">
            👑
          </div>
          <p className="section-subtitle">Pageant & Titles</p>
          <h2 className="section-title">{pageant.heading || 'Crown & Title Experience'}</h2>
        </motion.div>

        {/* Current title spotlight */}
        {pageant.currentTitle && (
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative mb-14 overflow-hidden rounded-3xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 opacity-10 rounded-3xl" />
            <div className="relative border border-amber-200 rounded-3xl bg-white/80 backdrop-blur-sm p-8 md:p-12 text-center">
              <span className="font-body text-xs font-semibold uppercase tracking-widest text-amber-600 mb-4 block">Current Title</span>
              <h3 className="font-display text-4xl md:text-6xl font-light text-gray-800 mb-2">
                {pageant.currentTitle}
              </h3>
              {pageant.organization && (
                <p className="font-body text-sm text-gray-500 mb-4">{pageant.organization}</p>
              )}
              {pageant.platform && (
                <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 font-body text-sm font-medium px-5 py-2 rounded-full">
                  <FiHeart size={13} />
                  Platform: {pageant.platform}
                </div>
              )}
              {pageant.bio && (
                <p className="font-body text-gray-500 leading-relaxed mt-6 max-w-2xl mx-auto">
                  {pageant.bio}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Titles / Awards grid */}
        {titles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-14"
          >
            <h3 className="font-body text-xs font-semibold uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
              <FiAward size={13} /> Titles & Awards
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {titles.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.25 + i * 0.07 }}
                  className="card border border-amber-100 hover:border-amber-200 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-body text-xs font-bold text-amber-500 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">
                      {t.year}
                    </span>
                    <span className={`font-body text-xs font-semibold px-2.5 py-1 rounded-full border ${placementColor(t.placement)}`}>
                      {t.placement}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-display text-xl font-medium text-gray-800 leading-tight">{t.title}</h4>
                    {t.organization && (
                      <p className="font-body text-xs text-gray-400 mt-0.5">{t.organization}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Achievements + Community Impact */}
        {(achievements.length > 0 || communityImpact.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="grid md:grid-cols-2 gap-6 mb-14"
          >
            {achievements.length > 0 && (
              <div className="card border border-blush-100">
                <h3 className="font-body text-xs font-semibold uppercase tracking-widest text-gray-400 mb-5 flex items-center gap-2">
                  <FiStar size={13} /> Achievements
                </h3>
                <ul className="space-y-3">
                  {achievements.map((a, i) => (
                    <li key={i} className="flex items-start gap-3 font-body text-sm text-gray-600 leading-relaxed">
                      <span className="text-amber-400 mt-0.5 shrink-0">★</span>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {communityImpact.length > 0 && (
              <div className="card border border-lavender-100">
                <h3 className="font-body text-xs font-semibold uppercase tracking-widest text-gray-400 mb-5 flex items-center gap-2">
                  <FiHeart size={13} /> Community Impact
                </h3>
                <ul className="space-y-3">
                  {communityImpact.map((c, i) => (
                    <li key={i} className="flex items-start gap-3 font-body text-sm text-gray-600 leading-relaxed">
                      <span className="mt-1 shrink-0" style={{ color: 'var(--accent-300)' }}>◆</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}

        {/* Photo gallery */}
        {photos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.45 }}
          >
            <h3 className="font-body text-xs font-semibold uppercase tracking-widest text-gray-400 mb-6">Gallery</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {photos.map((url, i) => (
                <div key={i} className="aspect-[3/4] rounded-2xl overflow-hidden bg-blush-50">
                  <img src={url} alt={`Pageant photo ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
              ))}
            </div>
          </motion.div>
        )}

      </div>
    </section>
  );
}
