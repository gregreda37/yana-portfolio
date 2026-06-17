import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FiArrowRight, FiTrendingUp, FiMessageSquare,
  FiLayout, FiEdit3, FiGlobe, FiStar, FiCheck,
} from 'react-icons/fi';

/* ── Scroll reveal wrapper ──────────────────────────────────────────────── */
function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Data ───────────────────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: FiLayout,
    color: 'bg-blush-100 text-blush-600',
    title: 'Signature Style',
    desc: 'Six color themes to match your energy — from soft blush to vibrant sage. Your brand, your aesthetic.',
  },
  {
    icon: FiTrendingUp,
    color: 'bg-lavender-100 text-purple-600',
    title: 'Metrics That Speak',
    desc: 'Showcase the numbers behind your impact. Not just what you did — but what changed because of you.',
  },
  {
    icon: FiMessageSquare,
    color: 'bg-rose-100 text-rose-600',
    title: 'Let Others Vouch',
    desc: 'Client and colleague testimonials that say what a resume never could. Social proof, front and center.',
  },
  {
    icon: FiStar,
    color: 'bg-amber-100 text-amber-600',
    title: 'Your Full Story',
    desc: 'A custom Specialty section to highlight the background that makes you uniquely valuable — healthcare, tech, finance, anything.',
  },
  {
    icon: FiEdit3,
    color: 'bg-teal-100 text-teal-600',
    title: 'Your Voice, Published',
    desc: 'Built-in blog and reading list to share your frameworks, insights, and perspective. Thought leadership, not just titles.',
  },
  {
    icon: FiGlobe,
    color: 'bg-sky-100 text-sky-600',
    title: 'A URL You Own',
    desc: "findYana.com/yourname — a professional link you're proud to put in every email signature and LinkedIn bio.",
  },
];

const INDUSTRIES = [
  'Sales', 'Healthcare', 'Technology', 'Finance', 'Marketing', 'Law',
  'Education', 'Real Estate', 'Consulting', 'Engineering', 'Operations',
  'Human Resources', 'Product', 'Design', 'Nonprofit', 'Entrepreneurship',
];

const STEPS = [
  {
    num: '01',
    title: 'Sign in',
    desc: 'Create your account with Google or email in under a minute.',
  },
  {
    num: '02',
    title: 'Claim your URL',
    desc: 'Choose findYana.com/yourname — your permanent corner of the web.',
  },
  {
    num: '03',
    title: 'Tell your story',
    desc: "Fill in your sections, pick your colors, and share a link you're proud of.",
  },
];

const RESUME_PAINS = [
  'A bulleted list of job titles',
  'One-size-fits-all formatting',
  'No room for personality',
  'Buried under hundreds of applications',
];

const YANA_GAINS = [
  'A living portfolio that showcases your impact',
  'A color theme and style that feels like you',
  'Metrics, testimonials, and thought leadership',
  'A shareable link that makes you impossible to forget',
];

/* ── Header ─────────────────────────────────────────────────────────────── */
function Header() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-blush-100">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <span className="font-display text-2xl text-blush-500 font-light tracking-wide">Yana</span>
        <nav className="flex items-center gap-6">
          <a href="#how-it-works" className="font-body text-sm text-gray-500 hover:text-blush-500 transition-colors hidden sm:block">How it works</a>
          <a href="#features" className="font-body text-sm text-gray-500 hover:text-blush-500 transition-colors hidden sm:block">Features</a>
          <Link
            to="/admin/login"
            className="font-body text-sm font-semibold text-blush-600 hover:text-blush-700 transition-colors"
          >
            Sign in
          </Link>
          <Link
            to="/admin/signup"
            className="font-body text-sm font-semibold bg-blush-500 hover:bg-blush-600 text-white px-5 py-2 rounded-full transition-all shadow-sm hover:shadow"
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}

/* ── Hero ───────────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blush-50 via-white to-lavender-50 pt-28">
      {/* Background blobs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blush-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-lavender-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />

      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-light text-gray-800 leading-[0.9] mb-8"
        >
          Your story is{' '}
          <span className="italic text-blush-500">bigger</span>
          <br />
          than a resume.
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="font-body text-lg md:text-xl text-gray-500 leading-relaxed max-w-2xl mx-auto mb-12"
        >
          Yana is a portfolio platform built for women in every industry — to showcase your impact, your voice, and the full depth of what you bring to the world.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.75 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            to="/admin/signup"
            className="inline-flex items-center justify-center gap-2 bg-blush-500 hover:bg-blush-600 text-white font-body font-semibold text-base px-8 py-4 rounded-full transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            Claim your portfolio <FiArrowRight size={16} />
          </Link>
          <a
            href="#features"
            className="inline-flex items-center justify-center gap-2 border border-blush-300 text-blush-600 hover:bg-blush-50 font-body font-semibold text-base px-8 py-4 rounded-full transition-all"
          >
            See what's inside
          </a>
        </motion.div>

        {/* Social proof + scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.5 }}
          className="flex flex-col items-center gap-4 mt-8"
        >
          <p className="font-body text-xs text-gray-400">
            Free to start · Your own URL · No design skills needed
          </p>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            className="w-px h-8 bg-gradient-to-b from-blush-300 to-transparent"
          />
        </motion.div>
      </div>
    </section>
  );
}

/* ── Problem vs Solution ────────────────────────────────────────────────── */
function ProblemSection() {
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <Reveal className="text-center mb-16">
          <p className="font-body text-xs font-semibold text-blush-500 uppercase tracking-widest mb-4">The Problem</p>
          <h2 className="font-display text-4xl md:text-6xl font-light text-gray-800 leading-tight">
            The resume was invented<br className="hidden md:block" />
            <span className="italic text-gray-400">in 1482.</span>
          </h2>
          <p className="font-body text-gray-500 mt-6 max-w-xl mx-auto leading-relaxed">
            It hasn't kept up with the women who've transformed every field they've entered. You deserve a format that reflects how far you've actually come.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Before */}
          <Reveal delay={0.1}>
            <div className="rounded-3xl border border-gray-200 p-8 bg-gray-50">
              <p className="font-body text-xs font-semibold uppercase tracking-widest text-gray-400 mb-6">The Old Way</p>
              <ul className="space-y-4">
                {RESUME_PAINS.map((pain, i) => (
                  <li key={i} className="flex items-start gap-3 font-body text-sm text-gray-500">
                    <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center shrink-0 mt-0.5 text-xs">✕</span>
                    {pain}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* After */}
          <Reveal delay={0.2}>
            <div className="rounded-3xl border border-blush-200 p-8 bg-gradient-to-br from-blush-50 to-lavender-50">
              <p className="font-body text-xs font-semibold uppercase tracking-widest text-blush-500 mb-6">The Yana Way</p>
              <ul className="space-y-4">
                {YANA_GAINS.map((gain, i) => (
                  <li key={i} className="flex items-start gap-3 font-body text-sm text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-blush-200 text-blush-600 flex items-center justify-center shrink-0 mt-0.5 text-xs">
                      <FiCheck size={10} />
                    </span>
                    {gain}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ── Features ───────────────────────────────────────────────────────────── */
function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-6 bg-gradient-to-b from-white to-blush-50">
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-16">
          <p className="font-body text-xs font-semibold text-blush-500 uppercase tracking-widest mb-4">Everything You Need</p>
          <h2 className="font-display text-4xl md:text-6xl font-light text-gray-800 leading-tight">
            Built for the whole you.
          </h2>
          <p className="font-body text-gray-500 mt-5 max-w-lg mx-auto">
            Not just your work history — your impact, your voice, your perspective, and the background that makes you irreplaceable.
          </p>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={0.05 * i}>
              <div className="bg-white rounded-3xl border border-gray-100 p-7 hover:shadow-md hover:-translate-y-1 transition-all duration-300 h-full">
                <div className={`w-11 h-11 ${f.color} rounded-2xl flex items-center justify-center mb-5`}>
                  <f.icon size={18} />
                </div>
                <h3 className="font-display text-xl font-medium text-gray-800 mb-2">{f.title}</h3>
                <p className="font-body text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Manifesto ──────────────────────────────────────────────────────────── */
function ManifestoSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="py-28 px-6 bg-gray-900 overflow-hidden relative">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blush-500 rounded-full opacity-10 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-lavender-400 rounded-full opacity-10 blur-3xl" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.4 }}
          className="text-blush-400 font-body text-xs uppercase tracking-widest mb-10"
        >
          Our Belief
        </motion.div>

        <motion.blockquote
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-3xl sm:text-4xl md:text-5xl text-white font-light leading-snug mb-12"
        >
          "The qualities that make women exceptional —{' '}
          <span className="italic text-blush-300">empathy, resilience, vision, collaboration</span>{' '}
          — have been systematically undervalued by traditional hiring tools.
          <br /><br />
          Yana gives them a home."
        </motion.blockquote>

        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={inView ? { opacity: 1, scaleX: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="w-16 h-px bg-blush-400 mx-auto"
        />
      </div>
    </section>
  );
}

/* ── Industries ─────────────────────────────────────────────────────────── */
function IndustriesSection() {
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-4xl mx-auto text-center">
        <Reveal>
          <p className="font-body text-xs font-semibold text-blush-500 uppercase tracking-widest mb-4">For Every Woman</p>
          <h2 className="font-display text-4xl md:text-5xl font-light text-gray-800 mb-4">In every industry.</h2>
          <p className="font-body text-gray-500 mb-12 max-w-md mx-auto">
            Your field doesn't matter. Your story does. Yana is for the woman doing exceptional work — wherever that work happens to be.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="flex flex-wrap justify-center gap-3">
            {INDUSTRIES.map((industry, i) => (
              <motion.span
                key={industry}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                className="font-body text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 px-4 py-2 rounded-full hover:border-blush-300 hover:text-blush-600 hover:bg-blush-50 transition-colors cursor-default"
              >
                {industry}
              </motion.span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── How It Works ───────────────────────────────────────────────────────── */
function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 px-6 bg-gradient-to-br from-blush-50 to-lavender-50">
      <div className="max-w-4xl mx-auto">
        <Reveal className="text-center mb-16">
          <p className="font-body text-xs font-semibold text-blush-500 uppercase tracking-widest mb-4">Get Started</p>
          <h2 className="font-display text-4xl md:text-5xl font-light text-gray-800">
            Up and running in minutes.
          </h2>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-8">
          {STEPS.map((step, i) => (
            <Reveal key={step.num} delay={i * 0.12}>
              <div className="text-center">
                <div className="font-display text-7xl font-light text-blush-200 leading-none mb-4">{step.num}</div>
                <h3 className="font-display text-2xl font-medium text-gray-800 mb-3">{step.title}</h3>
                <p className="font-body text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.4} className="text-center mt-16">
          <Link
            to="/admin/signup"
            className="inline-flex items-center gap-3 bg-blush-500 hover:bg-blush-600 text-white font-body font-semibold text-base px-10 py-4 rounded-full transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            Start for free <FiArrowRight size={16} />
          </Link>
          <p className="font-body text-xs text-gray-400 mt-4">No credit card. No design skills. Just your story.</p>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Final CTA ──────────────────────────────────────────────────────────── */
function CtaSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section ref={ref} className="py-32 px-6 bg-white">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="font-display text-5xl md:text-7xl font-light text-gray-800 leading-tight mb-8">
            Ready to own<br />
            <span className="italic text-blush-500">your story?</span>
          </h2>
          <p className="font-body text-lg text-gray-500 mb-12 max-w-lg mx-auto leading-relaxed">
            Create your Yana portfolio today. Share a link that shows the world not just where you've been — but who you're becoming.
          </p>
          <Link
            to="/admin/signup"
            className="inline-flex items-center gap-3 bg-gray-900 hover:bg-gray-800 text-white font-body font-semibold text-lg px-12 py-5 rounded-full transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
          >
            Claim your URL <FiArrowRight size={18} />
          </Link>
          <p className="font-body text-sm text-blush-500 font-medium mt-6">
            findYana.com/<span className="italic">yourname</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ── Footer ─────────────────────────────────────────────────────────────── */
function LandingFooter() {
  return (
    <footer className="bg-gray-900 text-gray-500 py-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <span className="font-display text-2xl text-white font-light">Yana</span>
        <p className="font-body text-xs text-center">
          Built for women who are done playing small.
        </p>
        <div className="flex items-center gap-6">
          <Link to="/admin/login" className="font-body text-xs hover:text-blush-400 transition-colors">Sign in</Link>
          <Link to="/admin/signup" className="font-body text-xs hover:text-blush-400 transition-colors">Create portfolio</Link>
        </div>
      </div>
    </footer>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="bg-white">
      <Header />
      <Hero />
      <ProblemSection />
      <FeaturesSection />
      <ManifestoSection />
      <IndustriesSection />
      <HowItWorksSection />
      <CtaSection />
      <LandingFooter />
    </div>
  );
}
