import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiTag, FiClock, FiCalendar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function BlogModal({ post, onClose }) {
  const [imgIdx, setImgIdx] = useState(0);
  const images = post?.images ?? [];

  useEffect(() => { setImgIdx(0); }, [post]);

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

  const paragraphs = (post.body ?? '').split('\n\n');

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
          <div className="px-8 pt-8 pb-6 border-b border-accent-100 shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="font-body text-xs font-semibold text-accent-500 uppercase tracking-widest">{post.category}</span>
                <h2 className="font-display text-3xl font-light text-gray-800 mt-1 leading-tight">{post.title}</h2>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-400 font-body">
                  <span className="flex items-center gap-1"><FiCalendar size={11} /> {post.date}</span>
                  <span className="flex items-center gap-1"><FiClock size={11} /> {post.readTime}</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="shrink-0 w-9 h-9 rounded-full bg-accent-50 hover:bg-accent-100 flex items-center justify-center text-accent-400 transition-colors"
                aria-label="Close"
              >
                <FiX size={16} />
              </button>
            </div>
          </div>

          {/* Image gallery — only shown when images exist */}
          {images.length > 0 && (
            <div className="relative shrink-0">
              <div className="relative overflow-hidden bg-gray-100" style={{ height: 260 }}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.img
                    key={imgIdx}
                    src={images[imgIdx]}
                    alt={`Photo ${imgIdx + 1}`}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.25 }}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </AnimatePresence>
                {images.length > 1 && (
                  <>
                    <button onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors">
                      <FiChevronLeft size={16} />
                    </button>
                    <button onClick={() => setImgIdx(i => (i + 1) % images.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors">
                      <FiChevronRight size={16} />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {images.map((_, i) => (
                        <button key={i} onClick={() => setImgIdx(i)}
                          className={`w-1.5 h-1.5 rounded-full transition-colors ${i === imgIdx ? 'bg-white' : 'bg-white/40'}`} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Body */}
          <div className="px-8 py-6 overflow-y-auto">
            <div className="prose prose-sm max-w-none">
              {paragraphs.map((para, i) => {
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
            <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-accent-100">
              {(post.tags ?? []).map(tag => (
                <span key={tag} className="font-body text-xs text-accent-500 bg-accent-50 border border-accent-200 px-3 py-1 rounded-full flex items-center gap-1">
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
