import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { useData } from '../contexts/DataContext';
import { FiTarget, FiDollarSign, FiUsers, FiHeart } from 'react-icons/fi';

const iconMap = {
  target: FiTarget,
  dollar: FiDollarSign,
  users: FiUsers,
  heart: FiHeart,
};

function Counter({ to, prefix = '', suffix = '', decimals = 0, active }) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!active) return;
    let start = 0;
    const duration = 1800;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(parseFloat((eased * to).toFixed(decimals)));
      if (progress < 1) requestAnimationFrame(step);
      else setVal(to);
    };
    requestAnimationFrame(step);
  }, [active, to, decimals]);

  return (
    <span className="font-display text-5xl md:text-6xl font-light text-accent-500">
      {prefix}{val.toFixed(decimals)}{suffix}
    </span>
  );
}

export default function Metrics() {
  const { metrics } = useData();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section id="metrics" className="py-24 px-6 bg-gradient-to-br from-accent-50 to-accent-100" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="section-subtitle">By the Numbers</p>
          <h2 className="section-title">Results that speak for themselves.</h2>
          <p className="font-body text-gray-400 mt-3 max-w-xl mx-auto">
            Consistent performance, year over year. Every number here represents a real relationship built and a real problem solved.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(metrics.items ?? []).map((m, i) => {
            const Icon = iconMap[m.icon];
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="card text-center group"
              >
                <div className="w-12 h-12 bg-accent-50 border border-accent-200 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:bg-accent-100 transition-colors">
                  <Icon className="text-accent-500" size={20} />
                </div>
                <Counter
                  to={m.value}
                  prefix={m.prefix || ''}
                  suffix={m.suffix || ''}
                  decimals={m.value % 1 !== 0 ? 1 : 0}
                  active={inView}
                />
                <p className="font-body font-semibold text-gray-700 mt-2 mb-1">{m.label}</p>
                <p className="font-body text-xs text-gray-400 leading-relaxed">{m.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
