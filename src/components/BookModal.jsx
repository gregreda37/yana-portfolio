import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';

function Stars({ count }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <span key={i} className={i < count ? 'text-accent-400' : 'text-gray-200'}>★</span>
      ))}
    </div>
  );
}

export default function BookModal({ book, onClose }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  if (!book) return null;

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
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header with book cover strip */}
          <div className={`bg-gradient-to-r ${book.coverColor ?? 'from-gray-400 to-gray-600'} px-8 pt-8 pb-6 shrink-0`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className={`font-body text-xs font-semibold px-2.5 py-1 rounded-full bg-white/30 text-white mb-3 inline-block`}>
                  {book.genre}
                </span>
                <h2 className="font-display text-3xl font-light text-white leading-tight">{book.title}</h2>
                <p className="font-body text-sm text-white/80 mt-1">{book.author} · {book.year}</p>
                <div className="mt-2">
                  <Stars count={book.rating} />
                </div>
              </div>
              <button
                onClick={onClose}
                className="shrink-0 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                aria-label="Close"
              >
                <FiX size={16} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-8 py-6 overflow-y-auto">
            <p className="font-body text-gray-500 text-sm leading-relaxed mb-8 italic border-l-2 border-accent-200 pl-4">
              {book.synopsis}
            </p>

            <h3 className="font-body text-xs font-semibold uppercase tracking-widest text-gray-400 mb-5">Key Takeaways</h3>
            <div className="space-y-5 mb-8">
              {(book.takeaways ?? []).map((t, i) => (
                <div key={i} className="flex gap-4">
                  <div className="shrink-0 w-6 h-6 rounded-full bg-accent-100 flex items-center justify-center mt-0.5">
                    <span className="font-body text-xs font-bold text-accent-500">{i + 1}</span>
                  </div>
                  <div>
                    <p className="font-body font-semibold text-gray-700 text-sm mb-1">{t.heading}</p>
                    <p className="font-body text-sm text-gray-500 leading-relaxed">{t.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-accent-50 border border-accent-100 rounded-2xl p-5">
              <p className="font-body text-xs font-semibold uppercase tracking-widest text-accent-400 mb-2">How I Apply This</p>
              <p className="font-body text-sm text-gray-600 leading-relaxed">{book.applyToSales}</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
