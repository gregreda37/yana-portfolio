import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSection, saveSection as persistSection } from '../firebase/db';

import { metrics as defaultMetrics } from '../data/metrics';
import { experience as defaultJobs, education as defaultEducation, skills as defaultSkills, healthcareBackground as defaultHealthcare } from '../data/experience';
import { testimonials as defaultTestimonials } from '../data/testimonials';
import { blogPosts as defaultBlog } from '../data/blog';
import { recentReads as defaultBooks } from '../data/books';

const defaultProfile = {
  name: 'Yana',
  title: 'Sales Professional',
  bio1: "With 7+ years in B2B sales, I've built a career on one principle: genuine relationships close deals. I bring data-driven strategy, deep listening, and relentless follow-through to every opportunity.",
  bio2: "Based in New York, I specialize in complex sales cycles, enterprise accounts, and building the internal champions that turn conversations into closed-won. Whether I'm running discovery, negotiating contracts, or onboarding a new client, I show up with energy and intention.",
  location: 'New York, NY',
  email: 'yana@example.com',
  linkedin: 'https://linkedin.com/in/yana',
  availabilityNote: 'New opportunities in enterprise or mid-market SaaS sales',
};

const DEFAULTS = {
  profile: defaultProfile,
  metrics: { items: defaultMetrics },
  experience: { jobs: defaultJobs, education: defaultEducation, skills: defaultSkills },
  healthcare: defaultHealthcare,
  testimonials: { items: defaultTestimonials },
  blog: { posts: defaultBlog },
  books: { items: defaultBooks },
};

const SECTIONS = Object.keys(DEFAULTS);
const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [data, setData] = useState(DEFAULTS);
  const [firestoreLoaded, setFirestoreLoaded] = useState(false);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const results = await Promise.all(SECTIONS.map(s => getSection(s)));
        const updates = {};
        let hasAny = false;
        SECTIONS.forEach((s, i) => {
          if (results[i]) { updates[s] = results[i]; hasAny = true; }
        });
        if (hasAny) {
          setData(prev => ({ ...prev, ...updates }));
          setSeeded(true);
        }
      } catch (e) {
        console.warn('Firestore unavailable — using static defaults.', e.message);
      } finally {
        setFirestoreLoaded(true);
      }
    }
    load();
  }, []);

  const saveSection = useCallback(async (section, sectionData) => {
    await persistSection(section, sectionData);
    setData(prev => ({ ...prev, [section]: sectionData }));
    setSeeded(true);
  }, []);

  const seedAll = useCallback(async () => {
    await Promise.all(SECTIONS.map(s => persistSection(s, DEFAULTS[s])));
    setData(DEFAULTS);
    setSeeded(true);
  }, []);

  return (
    <DataContext.Provider value={{ ...data, firestoreLoaded, seeded, saveSection, seedAll }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
