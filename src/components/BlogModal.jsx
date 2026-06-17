import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiTag, FiClock, FiCalendar } from 'react-icons/fi';

export default function BlogModal({ post, onClose }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  if (!post) return null;

  const paragraphs = post.body.split('\n\n');

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
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-blush-100 shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="font-body text-xs font-semibold text-blush-500 uppercase tracking-widest">{post.category}</span>
                <h2 className="font-display text-3xl font-light text-gray-800 mt-1 leading-tight">{post.title}</h2>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-400 font-body">
                  <span className="flex items-center gap-1"><FiCalendar size={11} /> {post.date}</span>
                  <span className="flex items-center gap-1"><FiClock size={11} /> {post.readTime}</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="shrink-0 w-9 h-9 rounded-full bg-blush-50 hover:bg-blush-100 flex items-center justify-center text-blush-400 transition-colors"
                aria-label="Close"
              >
                <FiX size={16} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-8 py-6 overflow-y-auto">
            <div className="prose prose-sm max-w-none">
              {paragraphs.map((para, i) => {
                const isBold = para.startsWith('**');
                if (para.startsWith('**') && para.endsWith('**')) {
                  return <h4 key={i} className="font-display text-xl text-gray-800 mt-6 mb-2">{para.replace(/\*\*/g, '')}</h4>;
                }
                const rendered = para.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
                return (
                  <p
                    key={i}
                    className="font-body text-gray-600 leading-relaxed mb-4 text-sm"
                    dangerouslySetInnerHTML={{ __html: rendered }}
                  />
                );
              })}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-blush-100">
              {post.tags.map(tag => (
                <span key={tag} className="font-body text-xs text-blush-500 bg-blush-50 border border-blush-200 px-3 py-1 rounded-full flex items-center gap-1">
                  <FiTag size={10} /> {tag}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
