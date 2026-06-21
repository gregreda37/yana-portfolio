import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useData } from '../contexts/DataContext';
import BlogModal from './BlogModal';
import BookModal from './BookModal';
import { FiClock, FiArrowRight, FiCalendar, FiBookOpen } from 'react-icons/fi';

const categoryColors = {
  'Prospecting': 'bg-accent-100 text-accent-600',
  'Sales Strategy': 'bg-lavender-100 text-purple-600',
  'Relationship Building': 'bg-pink-100 text-pink-600',
  'Objection Handling': 'bg-rose-100 text-rose-600',
};

export default function Blog() {
  const { blog, books: booksData } = useData();
  const blogPosts = blog.posts ?? [];
  const recentReads = booksData.items ?? [];
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [activeGenre, setActiveGenre] = useState('All');
  const [visibleCount, setVisibleCount] = useState(4);

  const genres = ['All', ...Array.from(new Set(recentReads.map(b => b.genre).filter(Boolean)))];
  const filteredBooks = activeGenre === 'All' ? recentReads : recentReads.filter(b => b.genre === activeGenre);
  const visibleBooks = filteredBooks.slice(0, visibleCount);
  const hasMore = visibleCount < filteredBooks.length;

  const handleGenreChange = (genre) => {
    setActiveGenre(genre);
    setVisibleCount(4);
  };

  if (!blogPosts.length && !recentReads.length) return null;

  return (
    <section id="blog" className="py-24 px-6 bg-white" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="section-subtitle">Insights</p>
          <h2 className="section-title">Sales insights & strategy.</h2>
          <p className="font-body text-gray-400 mt-3 max-w-md mx-auto">
            Practical frameworks and lessons from years in the field.
          </p>
        </div>

        {/* Featured post */}
        {blogPosts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <button
              onClick={() => setSelectedPost(blogPosts[0])}
              className="w-full text-left group bg-gradient-to-br from-accent-50 to-accent-100 border border-accent-100 rounded-3xl p-8 md:p-10 hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className={`font-body text-xs font-semibold px-3 py-1 rounded-full ${categoryColors[blogPosts[0].category] ?? 'bg-gray-100 text-gray-600'}`}>
                  {blogPosts[0].category}
                </span>
                <span className="font-body text-xs text-gray-400 flex items-center gap-1">
                  <FiCalendar size={11} /> {blogPosts[0].date}
                </span>
                <span className="font-body text-xs text-gray-400 flex items-center gap-1">
                  <FiClock size={11} /> {blogPosts[0].readTime}
                </span>
              </div>
              <h3 className="font-display text-3xl md:text-4xl font-light text-gray-800 mb-3 group-hover:text-accent-600 transition-colors">
                {blogPosts[0].title}
              </h3>
              <p className="font-body text-gray-500 leading-relaxed max-w-2xl mb-6">{blogPosts[0].excerpt}</p>
              <span className="inline-flex items-center gap-2 font-body text-sm font-semibold text-accent-500 group-hover:gap-3 transition-all">
                Read article <FiArrowRight size={14} />
              </span>
            </button>
          </motion.div>
        )}

        {/* Grid of remaining posts */}
        {blogPosts.length > 1 && (
          <div className="grid md:grid-cols-3 gap-6">
            {blogPosts.slice(1).map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
              >
                <button
                  onClick={() => setSelectedPost(post)}
                  className="w-full text-left group card h-full flex flex-col"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`font-body text-xs font-semibold px-2.5 py-1 rounded-full ${categoryColors[post.category] || 'bg-gray-100 text-gray-600'}`}>
                      {post.category}
                    </span>
                  </div>
                  <h3 className="font-display text-xl font-medium text-gray-800 mb-2 leading-snug group-hover:text-accent-600 transition-colors flex-1">
                    {post.title}
                  </h3>
                  <p className="font-body text-sm text-gray-400 leading-relaxed mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-3 text-xs text-gray-400 font-body">
                      <span className="flex items-center gap-1"><FiCalendar size={10} /> {post.date}</span>
                      <span className="flex items-center gap-1"><FiClock size={10} /> {post.readTime}</span>
                    </div>
                    <FiArrowRight className="text-accent-300 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" size={14} />
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* Recent Reads */}
        {recentReads.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-20"
          >
            {/* Header + genre filters */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-50 border border-accent-200 rounded-2xl flex items-center justify-center shrink-0">
                  <FiBookOpen className="text-accent-500" size={18} />
                </div>
                <div>
                  <p className="section-subtitle mb-0">What I'm Reading</p>
                  <h3 className="font-display text-3xl font-light text-gray-800 leading-tight">Recent Reads</h3>
                </div>
              </div>

              {/* Genre filter pills */}
              <div className="flex flex-wrap gap-2">
                {genres.map(genre => (
                  <button
                    key={genre}
                    onClick={() => handleGenreChange(genre)}
                    className={`font-body text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-colors ${
                      activeGenre === genre
                        ? 'bg-accent-500 text-white border-accent-500'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-accent-300 hover:text-accent-600'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            {/* Book grid — shelf */}
            <div className="relative">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <AnimatePresence mode="popLayout">
                  {visibleBooks.map((book, i) => (
                    <motion.div
                      key={book.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                    >
                      <button
                        onClick={() => setSelectedBook(book)}
                        className="w-full text-left group card flex gap-3 items-start h-44 overflow-hidden"
                      >
                        <div className={`shrink-0 w-8 self-stretch rounded-lg bg-gradient-to-b ${book.coverColor}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1 mb-1">
                            {book.genre ? (
                              <span className={`font-body text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-tight ${book.tagColor ?? 'bg-gray-100 text-gray-500'}`}>
                                {book.genre}
                              </span>
                            ) : <span />}
                            <div className="flex gap-0.5 shrink-0">
                              {[...Array(book.rating)].map((_, j) => (
                                <span key={j} className="text-accent-300 text-[10px]">★</span>
                              ))}
                            </div>
                          </div>
                          <h4 className="font-display text-base font-medium text-gray-800 leading-snug mb-0.5 group-hover:text-accent-600 transition-colors line-clamp-2">
                            {book.title}
                          </h4>
                          <p className="font-body text-[11px] text-gray-400 mb-2 line-clamp-1">{book.author}</p>
                          <p className="font-body text-[11px] text-gray-500 leading-relaxed line-clamp-2">
                            {book.takeaways?.[0]?.heading ?? ''}
                          </p>
                        </div>
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Shelf line */}
              <div className="mt-4 h-3 bg-gradient-to-b from-gray-100 to-gray-50 rounded-b-lg border-t border-gray-200 shadow-sm" />
            </div>

            {/* Show more / count */}
            <div className="flex items-center justify-between mt-6">
              <p className="font-body text-xs text-gray-400">
                Showing {visibleBooks.length} of {filteredBooks.length} book{filteredBooks.length !== 1 ? 's' : ''}
              </p>
              {hasMore && (
                <button
                  onClick={() => setVisibleCount(c => c + 4)}
                  className="font-body text-sm font-semibold text-accent-500 hover:text-accent-700 flex items-center gap-1.5 transition-colors"
                >
                  Show more <FiArrowRight size={14} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {selectedPost && (
        <BlogModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
      {selectedBook && (
        <BookModal book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
    </section>
  );
}
