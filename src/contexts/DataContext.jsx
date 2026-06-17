import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSection, saveSection as persistSection } from '../firebase/db';
import { useAuth } from './AuthContext';

import { metrics as defaultMetrics } from '../data/metrics';
import { experience as defaultJobs, education as defaultEducation, skills as defaultSkills, healthcareBackground as defaultHealthcare } from '../data/experience';
import { testimonials as defaultTestimonials } from '../data/testimonials';
import { blogPosts as defaultBlog } from '../data/blog';
import { recentReads as defaultBooks } from '../data/books';
import { pageantData as defaultPageant } from '../data/pageant';

const defaultProfile = {
  firstName: 'Your',
  lastName: 'Name',
  title: 'Sales Professional',
  bio1: "With years in B2B sales, I've built a career on one principle: genuine relationships close deals.",
  bio2: "I specialize in complex sales cycles, enterprise accounts, and building the internal champions that turn conversations into closed-won.",
  location: 'New York, NY',
  email: '',
  linkedin: '',
  instagram: '',
  facebook: '',
  tiktok: '',
  twitter: '',
  youtube: '',
  availabilityNote: 'New opportunities in enterprise or mid-market SaaS sales',
  photo: '',
};

export const DEFAULTS = {
  profile: defaultProfile,
  metrics: { items: defaultMetrics },
  experience: { jobs: defaultJobs, education: defaultEducation, skills: defaultSkills },
  healthcare: { label: 'Healthcare Background', ...defaultHealthcare },
  testimonials: { items: defaultTestimonials },
  blog: { posts: defaultBlog },
  books: { items: defaultBooks },
  pageant: defaultPageant,
  settings: {
    accentColor: 'blush',
    visible: {
      metrics: true,
      experience: true,
      specialty: true,
      testimonials: true,
      blog: true,
      contact: true,
    },
  },
};

const SECTIONS = Object.keys(DEFAULTS);
const DataContext = createContext(null);

export function DataProvider({ children, uid: uidProp, readOnly = false }) {
  const { user } = useAuth();
  const uid = uidProp ?? user?.uid ?? null;

  const [data, setData] = useState(DEFAULTS);
  const [firestoreLoaded, setFirestoreLoaded] = useState(false);

  useEffect(() => {
    if (!uid) return;

    let cancelled = false;
    async function load() {
      try {
        // ── 1. Read all sections ──────────────────────────────────────────
        const results = await Promise.all(SECTIONS.map(s => getSection(uid, s)));
        if (cancelled) return;

        const updates = {};
        let hasAny = false;
        SECTIONS.forEach((s, i) => {
          if (results[i]) { updates[s] = results[i]; hasAny = true; }
        });

        if (hasAny) {
          // Migrate old single `name` field → firstName / lastName
          if (updates.profile?.name && !updates.profile?.firstName) {
            const parts = updates.profile.name.trim().split(/\s+/);
            updates.profile.firstName = parts[0] ?? '';
            updates.profile.lastName = parts.slice(1).join(' ') ?? '';
          }
          setData(prev => ({ ...prev, ...updates }));
        } else if (!readOnly) {
          // ── 2. First-time user: seed default data ───────────────────────
          try {
            await Promise.all(SECTIONS.map(s => persistSection(uid, s, DEFAULTS[s])));
            if (!cancelled) setData(DEFAULTS);
          } catch (seedErr) {
            console.error('Failed to seed default data for new user:', seedErr.message);
            // Still show defaults in-memory so the UI isn't broken
            if (!cancelled) setData(DEFAULTS);
          }
        }
      } catch (e) {
        console.error('Failed to load portfolio data from Firestore:', e.message);
        // Fall back to in-memory defaults so the UI still renders
      } finally {
        if (!cancelled) setFirestoreLoaded(true);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [uid, readOnly]);

  const saveSection = useCallback(async (section, sectionData) => {
    if (!uid || readOnly) return;
    await persistSection(uid, section, sectionData);
    setData(prev => ({ ...prev, [section]: sectionData }));
  }, [uid, readOnly]);

  return (
    <DataContext.Provider value={{ ...data, firestoreLoaded, saveSection }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
