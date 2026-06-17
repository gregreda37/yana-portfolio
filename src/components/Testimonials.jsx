import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useData } from '../contexts/DataContext';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

function StarRating() {
  return (
    <div className="flex gap-0.5 mb-4">
      {[...Array(5)].map((_, i) => (
        <span key={i} className="text-blush-400 text-lg">★</span>
      ))}
    </div>
  );
}

export default function Testimonials() {
  const { testimonials: testimonialsData } = useData();
  const testimonials = testimonialsData.items ?? [];
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [activeIdx, setActiveIdx] = useState(0);

  const prev = () => setActiveIdx(i => (i - 1 + testimonials.length) % testimonials.length);
  const next = () => setActiveIdx(i => (i + 1) % testimonials.length);

  const active = testimonials[activeIdx] ?? {};

  return (
    <section id="testimonials" className="py-24 px-6 bg-gradient-to-br from-lavender-50 to-blush-50" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="section-subtitle">Social Proof</p>
          <h2 className="section-title">What clients say.</h2>
          <p className="font-body text-gray-400 mt-3 max-w-md mx-auto">
            Relationships built on trust and results — in their own words.
          </p>
        </div>

        {/* Featured testimonial */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto mb-12"
        >
          <div className="bg-white rounded-3xl shadow-md p-10 relative">
            <div className="absolute -top-4 left-10 text-6xl text-blush-200 font-display leading-none">"</div>
            <StarRating />
            <AnimatePresence mode="wait">
              <motion.p
                key={activeIdx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="font-body text-gray-600 text-lg leading-relaxed mb-8"
              >
                {active.quote}
              </motion.p>
            </AnimatePresence>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${active.color} rounded-full flex items-center justify-center`}>
                <span className="font-display font-medium text-gray-700">{active.initials}</span>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIdx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="font-body font-semibold text-gray-800 text-sm">{active.name}</p>
                  <p className="font-body text-xs text-gray-400">{active.title}, {active.company}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8">
              <div className="flex gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIdx(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === activeIdx ? 'w-6 bg-blush-400' : 'w-1.5 bg-blush-200'
                    }`}
                    aria-label={`Go to testimonial ${i + 1}`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={prev}
                  className="w-9 h-9 rounded-full border border-blush-200 hover:bg-blush-50 flex items-center justify-center text-blush-400 transition-colors"
                  aria-label="Previous"
                >
                  <FiChevronLeft size={16} />
                </button>
                <button
                  onClick={next}
                  className="w-9 h-9 rounded-full bg-blush-500 hover:bg-blush-600 flex items-center justify-center text-white transition-colors"
                  aria-label="Next"
                >
                  <FiChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Mini cards row */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {testimonials.slice(0, 4).map((t, i) => (
            <motion.button
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
              onClick={() => setActiveIdx(i)}
              className={`card text-left cursor-pointer transition-all ${
                activeIdx === i ? 'ring-2 ring-blush-300' : ''
              }`}
            >
              <div className={`w-8 h-8 ${t.color} rounded-full flex items-center justify-center mb-3`}>
                <span className="font-display text-sm text-gray-700">{t.initials}</span>
              </div>
              <p className="font-body font-semibold text-sm text-gray-700">{t.name}</p>
              <p className="font-body text-xs text-gray-400">{t.company}</p>
              <p className="font-body text-xs text-gray-500 mt-2 line-clamp-2 italic">"{t.quote.slice(0, 80)}…"</p>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
