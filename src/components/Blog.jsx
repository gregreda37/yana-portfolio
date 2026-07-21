import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useData } from '../contexts/DataContext';
import BlogModal from './BlogModal';
import BookModal from './BookModal';
import { FiClock, FiArrowRight, FiCalendar, FiBookOpen } from 'react-icons/fi';

const PALETTE = [
  'bg-accent-100 text-accent-600',
  'bg-lavender-100 text-purple-600',
  'bg-teal-100 text-teal-600',
  'bg-rose-100 text-rose-600',
  'bg-sky-100 text-sky-600',
  'bg-emerald-100 text-emerald-600',
  'bg-amber-100 text-amber-700',
  'bg-indigo-100 text-indigo-600',
];

function categoryColor(category, categories) {
  const idx = categories.indexOf(category);
  return PALETTE[(idx >= 0 ? idx : 0) % PALETTE.length];
}

export default function Blog() {
  const { blog, books: booksData } = useData();
  const blogPosts = (blog.posts ?? []).filter(p => !p.hidden);
  const recentReads = (booksData.items ?? []).filter(b => !b.hidden);
  const sectionLabel = blog.sectionLabel || 'Insights';
  const sectionTitle = blog.sectionTitle || 'Sales insights & strategy.';
  const sectionDescription = blog.sectionDescription || '';
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [expandedBook, setExpandedBook] = useState(null);
  const [activeGenre, setActiveGenre] = useState('All');
  const [activeCategory, setActiveCategory] = useState('All');

  // Categories from admin config; fall back to what's actually used in posts
  const categories = blog.categories?.length
    ? blog.categories
    : [...new Set(blogPosts.map(p => p.category).filter(Boolean))];

  const filteredPosts = activeCategory === 'All'
    ? blogPosts
    : blogPosts.filter(p => p.category === activeCategory);

  const genres = ['All', ...Array.from(new Set(recentReads.map(b => b.genre).filter(Boolean)))];
  const filteredBooks = activeGenre === 'All' ? recentReads : recentReads.filter(b => b.genre === activeGenre);

  const handleGenreChange = (genre) => {
    setActiveGenre(genre);
    setExpandedBook(null);
  };

  // 3 cards to show below shelf: clicked book + up to 1 on each side
  const contextBooks = expandedBook
    ? (() => {
        const count = Math.min(filteredBooks.length, 3);
        const idx = filteredBooks.findIndex(b => b.id === expandedBook.id);
        const start = Math.max(0, Math.min(idx - 1, filteredBooks.length - count));
        return filteredBooks.slice(start, start + count);
      })()
    : [];

  if (!blogPosts.length && !recentReads.length) return null;

  return (
    <section id="blog" className="py-24 px-6 bg-white" ref={ref}>
      <div className="max-w-6xl mx-auto">
        {blogPosts.length > 0 && (
          <div className="text-center mb-10">
            {sectionLabel && <p className="section-subtitle">{sectionLabel}</p>}
            {sectionTitle && <h2 className="section-title">{sectionTitle}</h2>}
            {sectionDescription && (
              <p className="font-body text-gray-400 mt-3 max-w-md mx-auto">{sectionDescription}</p>
            )}
          </div>
        )}

        {/* Category filter pills */}
        {blogPosts.length > 0 && categories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4 }}
            className="flex flex-wrap gap-2 justify-center mb-10"
          >
            {['All', ...categories].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`font-body text-xs font-semibold px-4 py-1.5 rounded-full border transition-colors ${
                  activeCategory === cat
                    ? 'bg-accent-500 text-white border-accent-500'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-accent-300 hover:text-accent-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </motion.div>
        )}

        {/* Featured post */}
        {filteredPosts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <button
              onClick={() => setSelectedPost(filteredPosts[0])}
              className="w-full text-left group bg-gradient-to-br from-accent-50 to-accent-100 border border-accent-100 rounded-3xl overflow-hidden hover:shadow-md transition-shadow duration-300"
            >
              {filteredPosts[0].images?.[0] && (
                <div className="w-full h-52 md:h-64 overflow-hidden relative">
                  <img src={filteredPosts[0].images[0]} alt={filteredPosts[0].title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-accent-50/80 to-transparent" />
                </div>
              )}
              <div className="p-8 md:p-10">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className={`font-body text-xs font-semibold px-3 py-1 rounded-full ${categoryColor(filteredPosts[0].category, categories)}`}>
                    {filteredPosts[0].category}
                  </span>
                  <span className="font-body text-xs text-gray-400 flex items-center gap-1">
                    <FiCalendar size={11} /> {filteredPosts[0].date}
                  </span>
                  <span className="font-body text-xs text-gray-400 flex items-center gap-1">
                    <FiClock size={11} /> {filteredPosts[0].readTime}
                  </span>
                </div>
                <h3 className="font-display text-3xl md:text-4xl font-light text-gray-800 mb-3 group-hover:text-accent-600 transition-colors">
                  {filteredPosts[0].title}
                </h3>
                <p className="font-body text-gray-500 leading-relaxed max-w-2xl mb-6">{filteredPosts[0].excerpt}</p>
                <span className="inline-flex items-center gap-2 font-body text-sm font-semibold text-accent-500 group-hover:gap-3 transition-all">
                  Read article <FiArrowRight size={14} />
                </span>
              </div>
            </button>
          </motion.div>
        )}

        {/* Grid of remaining posts */}
        {filteredPosts.length > 1 && (
          <div className="grid md:grid-cols-3 gap-6">
            {filteredPosts.slice(1).map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
              >
                <button
                  onClick={() => setSelectedPost(post)}
                  className="w-full text-left group card h-full flex flex-col p-0 overflow-hidden"
                >
                  {post.images?.[0] && (
                    <div className="w-full h-36 overflow-hidden shrink-0">
                      <img src={post.images[0]} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  )}
                  <div className="flex flex-col flex-1 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className={`font-body text-xs font-semibold px-2.5 py-1 rounded-full ${categoryColor(post.category, categories)}`}>
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
            className={blogPosts.length > 0 ? 'mt-20' : ''}
          >
            {/* Header + genre filters */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-50 border border-accent-200 rounded-2xl flex items-center justify-center shrink-0">
                  <FiBookOpen className="text-accent-500" size={18} />
                </div>
                <div>
                  <p className="section-subtitle mb-0">My Library</p>
                  <h3 className="font-display text-3xl font-light text-gray-800 leading-tight">My Bookshelf</h3>
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

            {/* Bookshelf panel */}
            <div className="rounded-2xl overflow-hidden border border-amber-100/80" style={{ background: 'linear-gradient(to bottom, #fdf8f0, #faf4ea)' }}>
              {/* Spines — horizontally scrollable */}
              <div className="overflow-x-auto px-6 pt-8">
                <LayoutGroup>
                <div className="flex items-end gap-2" style={{ minWidth: 'min-content' }}>
                  {filteredBooks.map((book, i) => {
                    const HEIGHTS = [200, 228, 184, 218, 206, 236, 192, 212];
                    const h = HEIGHTS[i % HEIGHTS.length];
                    const isActive = expandedBook?.id === book.id;
                    return (
                      <motion.button
                        key={book.id}
                        onClick={() => setExpandedBook(isActive ? null : book)}
                        className="relative shrink-0 rounded-t-md overflow-hidden cursor-pointer focus:outline-none"
                        style={{ width: 58, height: h }}
                        animate={{ y: isActive ? -22 : 0 }}
                        whileHover={{ y: isActive ? -26 : -10 }}
                        transition={{ duration: 0.18 }}
                        title={book.title}
                      >
                        {book.coverImageUrl ? (
                          <>
                            {/* Real cover image */}
                            <img
                              src={book.coverImageUrl.replace('-M.jpg', '-L.jpg')}
                              alt={book.title}
                              className="absolute inset-0 w-full h-full object-cover"
                              style={{ objectPosition: 'center 10%' }}
                            />
                            {/* Binding crease */}
                            <div className="absolute left-0 top-0 w-3 h-full bg-black/20" />
                            <div className="absolute left-3 top-0 w-px h-full bg-white/15" />
                            {/* Right edge */}
                            <div className="absolute right-0 top-0 w-1.5 h-full bg-black/30" />
                            {/* Top shadow */}
                            <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black/20 to-transparent" />
                          </>
                        ) : (
                          <>
                            {/* Spine gradient */}
                            <div className={`absolute inset-0 bg-gradient-to-b ${(book.coverColor ?? 'from-gray-400 to-gray-600').replace(/\bblush\b/g, 'accent')}`} />
                            {/* Binding crease & highlight */}
                            <div className="absolute left-0 top-0 w-3.5 h-full bg-white/25" />
                            <div className="absolute left-3.5 top-0 w-px h-full bg-white/20" />
                            {/* Right edge depth */}
                            <div className="absolute right-0 top-0 w-2 h-full bg-black/20" />
                            {/* Top inner shadow */}
                            <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/15 to-transparent" />
                            {/* Title — vertical, reads bottom-to-top */}
                            <div className="absolute inset-4 flex items-center justify-center">
                              <p
                                className="font-display font-semibold text-white leading-none"
                                style={{
                                  fontSize: 11,
                                  writingMode: 'vertical-rl',
                                  transform: 'rotate(180deg)',
                                  overflow: 'hidden',
                                  maxHeight: h - 32,
                                  textShadow: '0 1px 4px rgba(0,0,0,0.35)',
                                }}
                              >
                                {book.title.length > 22 ? book.title.slice(0, 21) + '…' : book.title}
                              </p>
                            </div>
                          </>
                        )}

                        {/* Active ribbon at top */}
                        {isActive && (
                          <motion.div
                            layoutId="active-ribbon"
                            className="absolute inset-x-0 top-0 h-2 bg-white/50"
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
                </LayoutGroup>
              </div>

              {/* Shelf plank */}
              <div className="relative" style={{ height: 22, background: 'linear-gradient(180deg, #d4aa70 0%, #b8905a 60%, #a07840 100%)', boxShadow: '0 4px 14px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.22)' }}>
                <div className="absolute inset-0 bg-gradient-to-r from-black/15 via-transparent to-black/15" />
              </div>
              {/* Shadow under shelf */}
              <div className="h-4" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), transparent)' }} />
            </div>

            {/* 3-card detail grid */}
            <AnimatePresence>
              {expandedBook && (
                <motion.div
                  key={expandedBook.id}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3"
                >
                  {contextBooks.map(book => {
                    const isHighlighted = book.id === expandedBook.id;
                    return (
                      <button
                        key={book.id}
                        onClick={() => setSelectedBook(book)}
                        className={`text-left rounded-2xl overflow-hidden border transition-all hover:shadow-md group ${
                          isHighlighted
                            ? 'border-accent-200 shadow-sm bg-white'
                            : 'border-gray-100 bg-white opacity-80 hover:opacity-100'
                        }`}
                      >
                        {/* Cover image or color band */}
                        {book.coverImageUrl ? (
                          <div className="h-28 overflow-hidden relative">
                            <img
                              src={book.coverImageUrl.replace('-M.jpg', '-L.jpg')}
                              alt={book.title}
                              className="w-full h-full object-cover object-top"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-white/60 to-transparent" />
                          </div>
                        ) : (
                          <div className={`h-1.5 bg-gradient-to-r ${(book.coverColor ?? 'from-gray-400 to-gray-600').replace(/\bblush\b/g, 'accent')}`} />
                        )}
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            {book.genre ? (
                              <span className={`font-body text-[10px] font-semibold px-2 py-0.5 rounded-full ${(book.tagColor ?? 'bg-gray-100 text-gray-500').replace(/\bblush\b/g, 'accent')}`}>
                                {book.genre}
                              </span>
                            ) : <span />}
                            <div className="flex gap-0.5">
                              {[...Array(book.rating ?? 0)].map((_, j) => (
                                <span key={j} className={`text-[11px] ${isHighlighted ? 'text-accent-400' : 'text-accent-300'}`}>★</span>
                              ))}
                            </div>
                          </div>
                          <h4 className={`font-display text-base font-medium leading-snug mb-0.5 group-hover:text-accent-600 transition-colors ${isHighlighted ? 'text-accent-700' : 'text-gray-800'}`}>
                            {book.title}
                          </h4>
                          <p className="font-body text-xs text-gray-400 mb-2">{book.author}</p>
                          {book.takeaways?.[0] && (
                            <p className="font-body text-xs text-gray-500 leading-relaxed line-clamp-2">
                              {book.takeaways[0].heading}
                            </p>
                          )}
                          <p className="font-body text-xs font-semibold text-accent-500 mt-3 flex items-center gap-1">
                            Read more <FiArrowRight size={11} />
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Book count */}
            <p className="font-body text-xs text-gray-400 mt-4">
              {filteredBooks.length} book{filteredBooks.length !== 1 ? 's' : ''}{activeGenre !== 'All' ? ` · ${activeGenre}` : ''}{expandedBook ? ' · click a spine to browse' : ' · click a spine to explore'}
            </p>
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
