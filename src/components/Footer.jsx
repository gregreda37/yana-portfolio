import { FiLinkedin, FiMail, FiHeart, FiInstagram, FiFacebook, FiTwitter, FiYoutube } from 'react-icons/fi';
import { SiTiktok } from 'react-icons/si';
import { useData } from '../contexts/DataContext';

const SOCIAL_ICONS = [
  { key: 'linkedin',  Icon: FiLinkedin },
  { key: 'instagram', Icon: FiInstagram },
  { key: 'facebook',  Icon: FiFacebook },
  { key: 'tiktok',    Icon: SiTiktok },
  { key: 'twitter',   Icon: FiTwitter },
  { key: 'youtube',   Icon: FiYoutube },
];

const links = [
  { label: 'About', href: '#about' },
  { label: 'Results', href: '#metrics' },
  { label: 'Experience', href: '#experience' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'Blog', href: '#blog' },
  { label: 'Contact', href: '#contact' },
];

export default function Footer() {
  const { profile } = useData();
  return (
    <footer className="bg-gray-900 text-gray-400 py-14 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <p className="font-display text-3xl text-white font-light mb-1">{profile.name}</p>
            <p className="font-body text-sm">{profile.title} · {profile.location}</p>
          </div>

          <nav>
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              {links.map(l => (
                <li key={l.href}>
                  <a href={l.href} className="font-body text-sm hover:text-blush-400 transition-colors">{l.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-wrap gap-4">
            {SOCIAL_ICONS.filter(s => profile[s.key]).map(({ key, Icon }) => (
              <a key={key} href={profile[key]} target="_blank" rel="noreferrer" className="hover:text-blush-400 transition-colors" aria-label={key}>
                <Icon size={18} />
              </a>
            ))}
            {profile.email && (
              <a href={`mailto:${profile.email}`} className="hover:text-blush-400 transition-colors" aria-label="Email">
                <FiMail size={18} />
              </a>
            )}
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-8 flex items-center justify-between">
          <p className="font-body text-xs text-gray-600 flex items-center gap-1.5">
            Built with <FiHeart size={11} className="text-blush-400" /> · © {new Date().getFullYear()} {profile.name}. All rights reserved.
          </p>
          <a href="/admin" className="font-body text-xs text-gray-700 hover:text-blush-400 transition-colors">
            Admin
          </a>
        </div>
      </div>
    </footer>
  );
}
