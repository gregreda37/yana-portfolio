import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
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
              <span className={`font-body text-xs font-semibold px-3 py-1 rounded-full ${categoryColors[blogPosts[0].category]}`}>
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

        {/* Grid of remaining posts */}
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

        {/* Recent Reads */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20"
        >
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-accent-50 border border-accent-200 rounded-2xl flex items-center justify-center">
              <FiBookOpen className="text-accent-500" size={18} />
            </div>
            <div>
              <p className="section-subtitle mb-0">What I'm Reading</p>
              <h3 className="font-display text-3xl font-light text-gray-800 leading-tight">Recent Reads</h3>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recentReads.map((book, i) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.5 + i * 0.08 }}
              >
                <button
                  onClick={() => setSelectedBook(book)}
                  className="w-full text-left group card flex gap-4 items-start hover:shadow-md transition-shadow duration-300"
                >
                  {/* Book spine */}
                  <div className={`shrink-0 w-10 self-stretch rounded-xl bg-gradient-to-b ${book.coverColor} flex items-center justify-center`}>
                    <span className="font-display text-white font-medium text-xs [writing-mode:vertical-rl] rotate-180 leading-tight px-1 py-2 line-clamp-3">
                      {book.title}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className={`font-body text-xs font-semibold px-2 py-0.5 rounded-full ${book.tagColor}`}>
                        {book.genre}
                      </span>
                      <div className="flex gap-0.5 shrink-0">
                        {[...Array(book.rating)].map((_, j) => (
                          <span key={j} className="text-accent-300 text-xs">★</span>
                        ))}
                      </div>
                    </div>
                    <h4 className="font-display text-lg font-medium text-gray-800 leading-tight mb-0.5 group-hover:text-accent-600 transition-colors">
                      {book.title}
                    </h4>
                    <p className="font-body text-xs text-gray-400 mb-3">{book.author}</p>
                    <p className="font-body text-xs text-gray-500 leading-relaxed line-clamp-2">
                      {book.takeaways[0].heading} — {book.takeaways[0].body.slice(0, 80)}…
                    </p>
                    <span className="inline-flex items-center gap-1 font-body text-xs font-semibold text-accent-400 mt-3 group-hover:gap-2 transition-all">
                      See insights <FiArrowRight size={11} />
                    </span>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
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
