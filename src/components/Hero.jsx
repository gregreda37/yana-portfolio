import { motion } from 'framer-motion';
import { FiArrowDown } from 'react-icons/fi';
import logoUrl from '../assets/yvb-logo-original.svg';
import { useData } from '../contexts/DataContext';

export default function Hero() {
  const { profile } = useData();
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blush-50 via-white to-lavender-50"
    >
      {/* Decorative blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blush-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-lavender-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />

      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">

        {/* Logo — floats in from above, then bobs continuously */}
        <motion.div
          initial={{ y: -320, opacity: 0, rotate: -14, scale: 0.75 }}
          animate={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 60, damping: 13, delay: 0.1 }}
          className="mb-10"
        >
          <motion.img
            src={logoUrl}
            alt="YVB Logo"
            className="w-56 sm:w-72 md:w-80 mx-auto rounded-2xl shadow-2xl"
            animate={{ y: [0, -14, 0] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1.4,
            }}
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="section-subtitle mb-4"
        >
          {profile.title}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.85 }}
          className="font-display text-6xl md:text-8xl font-light text-gray-800 leading-tight mb-6"
        >
          Hi, I'm <span className="text-blush-500 italic">{profile.name}.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="font-body text-lg md:text-xl text-gray-500 leading-relaxed mb-10 max-w-xl mx-auto"
        >
          I build lasting client relationships, drive meaningful revenue, and help organizations find solutions they actually love.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.15 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <a href="#metrics" className="btn-primary">See My Results</a>
          <a href="#contact" className="btn-outline">Work With Me</a>
        </motion.div>
      </div>

      <a
        href="#about"
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-blush-400 animate-bounce"
        aria-label="Scroll down"
      >
        <FiArrowDown size={24} />
      </a>
    </section>
  );
}
