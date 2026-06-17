import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import EditProfile from './EditProfile';
import EditMetrics from './EditMetrics';
import EditExperience from './EditExperience';
import EditHealthcare from './EditHealthcare';
import EditTestimonials from './EditTestimonials';
import EditBlog from './EditBlog';
import EditBooks from './EditBooks';
import EditSettings from './EditSettings';
import EditPageant from './EditPageant';
import EditResumeRequests from './EditResumeRequests';
import {
  FiUser, FiTrendingUp, FiBriefcase, FiHeart,
  FiMessageSquare, FiEdit, FiBook, FiLogOut, FiExternalLink, FiSettings, FiStar, FiInbox,
} from 'react-icons/fi';

const NAV = [
  { key: 'profile',      label: 'Profile',           icon: FiUser },
  { key: 'metrics',      label: 'Metrics',            icon: FiTrendingUp },
  { key: 'experience',   label: 'Experience',         icon: FiBriefcase },
  { key: 'healthcare',   label: 'Specialty',          icon: FiHeart },
  { key: 'testimonials', label: 'Testimonials',       icon: FiMessageSquare },
  { key: 'blog',         label: 'Blog Posts',         icon: FiEdit },
  { key: 'books',        label: 'Recent Reads',       icon: FiBook },
  { key: 'pageant',      label: 'Pageant & Titles',   icon: FiStar },
  { key: 'settings',     label: 'Appearance',         icon: FiSettings },
  { key: 'inbox',        label: 'Resume Requests',    icon: FiInbox },
];

const EDITORS = {
  profile:      EditProfile,
  metrics:      EditMetrics,
  experience:   EditExperience,
  healthcare:   EditHealthcare,
  testimonials: EditTestimonials,
  blog:         EditBlog,
  books:        EditBooks,
  pageant:      EditPageant,
  settings:     EditSettings,
  inbox:        EditResumeRequests,
};

export default function AdminDashboard() {
  const { user, username, logout } = useAuth();
  const { firestoreLoaded, firestoreError } = useData();
  const navigate = useNavigate();
  const [active, setActive] = useState('profile');
  const [toast, setToast] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const ActiveEditor = EDITORS[active];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 h-14 flex items-center justify-between px-4 md:px-6 shrink-0 z-30">
        <div className="flex items-center gap-3">
          <button className="md:hidden text-gray-500 p-1" onClick={() => setSidebarOpen(o => !o)} aria-label="Menu">
            <span className="block w-5 h-0.5 bg-current mb-1" /><span className="block w-5 h-0.5 bg-current mb-1" /><span className="block w-5 h-0.5 bg-current" />
          </button>
          <span className="font-display text-xl text-blush-500 font-light">Yana</span>
          <span className="font-body text-xs text-gray-400 hidden sm:block">· Admin</span>
        </div>
        <div className="flex items-center gap-3">
          {username && (
            <a
              href={`/${username}`}
              target="_blank"
              rel="noreferrer"
              className="font-body text-xs text-gray-400 hover:text-blush-500 transition-colors flex items-center gap-1"
            >
              findyana.com/{username} <FiExternalLink size={11} />
            </a>
          )}
          <span className="font-body text-xs text-gray-400 hidden sm:block">{user?.email}</span>
          <button onClick={handleLogout} className="flex items-center gap-1.5 font-body text-xs text-gray-500 hover:text-red-500 transition-colors">
            <FiLogOut size={14} /> Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`
          fixed md:static inset-y-0 left-0 top-14 z-20 w-56 bg-white border-r border-gray-100
          flex flex-col transform transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <nav className="flex-1 py-4 overflow-y-auto">
            {NAV.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => { setActive(key); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-5 py-2.5 font-body text-sm font-medium transition-colors text-left ${
                  active === key
                    ? 'bg-blush-50 text-blush-600 border-r-2 border-blush-400'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={15} className="shrink-0" />
                {label}
              </button>
            ))}
          </nav>

          {username && (
            <div className="p-4 border-t border-gray-100">
              <p className="font-body text-xs text-gray-400 text-center leading-snug">
                Public URL<br />
                <span className="text-blush-500 font-semibold">findyana.com/{username}</span>
              </p>
            </div>
          )}
        </aside>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-10 bg-black/20 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-3xl mx-auto">
            {firestoreError ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                  <span className="text-2xl">⚠️</span>
                </div>
                <h3 className="font-display text-xl text-gray-800 mb-2">Couldn't load your data</h3>
                <p className="font-body text-sm text-gray-400 max-w-xs mb-6">
                  There was a problem connecting to the database. Check your internet connection and try again.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="btn-primary"
                >
                  Reload
                </button>
              </div>
            ) : firestoreLoaded ? (
              <ActiveEditor onToast={showToast} />
            ) : (
              <div className="space-y-4 animate-pulse">
                <div className="h-7 w-40 bg-gray-100 rounded-lg" />
                <div className="h-4 w-72 bg-gray-100 rounded" />
                <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                  <div className="h-4 w-24 bg-gray-100 rounded" />
                  <div className="h-10 bg-gray-100 rounded-xl" />
                  <div className="h-4 w-24 bg-gray-100 rounded" />
                  <div className="h-10 bg-gray-100 rounded-xl" />
                  <div className="h-4 w-24 bg-gray-100 rounded" />
                  <div className="h-24 bg-gray-100 rounded-xl" />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white font-body text-sm px-5 py-3 rounded-full shadow-lg z-50 animate-fade-up">
          {toast}
        </div>
      )}
    </div>
  );
}
