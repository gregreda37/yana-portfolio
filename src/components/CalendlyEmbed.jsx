import { useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

export default function CalendlyEmbed({ url }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (!url || scriptLoaded.current) return;
    scriptLoaded.current = true;

    const existing = document.querySelector('script[src*="calendly.com/assets/external/widget.js"]');
    if (existing) return;

    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    document.head.appendChild(script);
  }, [url]);

  if (!url) return null;

  return (
    <section id="schedule" className="py-24 px-6 bg-gray-50" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="section-subtitle">Let's Connect</p>
          <h2 className="section-title">Schedule a Meeting</h2>
          <p className="font-body text-gray-400 mt-3 max-w-md mx-auto">
            Book a time that works for you — no back-and-forth needed.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100"
        >
          <div
            className="calendly-inline-widget"
            data-url={url}
            style={{ minWidth: '320px', height: '700px' }}
          />
        </motion.div>
      </div>
    </section>
  );
}
