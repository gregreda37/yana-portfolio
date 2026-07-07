import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSection, saveSection as persistSection } from '../firebase/db';
import { useAuth } from './AuthContext';

export const DEFAULTS = {
  profile: {
    firstName: '', lastName: '', title: '',
    bio1: '', bio2: '', location: '', email: '',
    linkedin: '', instagram: '', facebook: '',
    tiktok: '', twitter: '', youtube: '',
    availabilityNote: '', availabilityTitle: '', availabilityButton: '', photo: '',
  },
  metrics: { items: [] },
  experience: { jobs: [], education: [], skills: [] },
  healthcare: { label: 'Specialty Background', summary: '', highlights: [] },
  testimonials: { items: [] },
  blog: { posts: [], categories: [], sectionLabel: 'Insights', sectionTitle: 'Sales insights & strategy.', sectionDescription: 'Practical frameworks and lessons from years in the field.' },
  books: { items: [] },
  calendly: { url: '' },
  settings: {
    accentColor: 'blush',
    visible: {
      metrics: true,
      experience: true,
      specialty: true,
      testimonials: true,
      blog: true,
      calendly: true,
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
  const [firestoreError, setFirestoreError] = useState(false);

  useEffect(() => {
    if (!uid) return;

    let cancelled = false;
    setFirestoreLoaded(false);
    setFirestoreError(false);

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
          // Deep-merge: each section gets DEFAULTS as a base so newly-added
          // default fields are always present even if Firestore doesn't have them.
          const merged = { ...DEFAULTS };
          SECTIONS.forEach(s => { if (updates[s]) merged[s] = { ...DEFAULTS[s], ...updates[s] }; });
          setData(merged);
        } else if (!readOnly) {
          // ── 2. First-time user: seed default data ───────────────────────
          try {
            await Promise.all(SECTIONS.map(s => persistSection(uid, s, DEFAULTS[s])));
            if (!cancelled) setData(DEFAULTS);
          } catch (seedErr) {
            console.error('Failed to seed default data for new user:', seedErr.message);
            if (!cancelled) setData(DEFAULTS);
          }
        }
        if (!cancelled) setFirestoreLoaded(true);
      } catch (e) {
        console.error('Failed to load portfolio data from Firestore:', e.message);
        if (!cancelled) {
          setFirestoreError(true);
          setFirestoreLoaded(true); // unblock the spinner so the page renders
        }
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
    <DataContext.Provider value={{ ...data, uid, firestoreLoaded, firestoreError, saveSection }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
