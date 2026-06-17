import { useState, useEffect } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';
import { useData } from '../contexts/DataContext';

const links = [
  { label: 'About', href: '#about' },
  { label: 'Results', href: '#metrics' },
  { label: 'Experience', href: '#experience' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'Blog', href: '#blog' },
  { label: 'Contact', href: '#contact' },
];

export default function Navbar() {
  const { profile } = useData();
  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ');
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm' : 'bg-transparent'
    }`}>
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
        <a href="#hero" className="font-display text-2xl font-medium text-blush-600 tracking-wide">
          {fullName}
        </a>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <li key={l.href}>
              <a
                href={l.href}
                className="font-body text-sm font-medium text-gray-600 hover:text-blush-500 transition-colors duration-200"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <a href="#contact" className="hidden md:block btn-primary text-xs px-5 py-2">
          Get in Touch
        </a>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-gray-700 p-1"
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle menu"
        >
          {open ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-blush-100 px-6 py-4">
          <ul className="flex flex-col gap-4">
            {links.map(l => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="font-body text-sm font-medium text-gray-700 hover:text-blush-500"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}
