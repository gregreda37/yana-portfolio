import { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { getUidByUsername } from '../firebase/db';
import { DataProvider, useData } from '../contexts/DataContext';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import About from '../components/About';
import Metrics from '../components/Metrics';
import Experience from '../components/Experience';
import Testimonials from '../components/Testimonials';
import Blog from '../components/Blog';
import Contact from '../components/Contact';
import Footer from '../components/Footer';

function PublicSiteContent() {
  const { settings, firestoreLoaded, firestoreError } = useData();
  const accentColor = settings?.accentColor ?? 'blush';
  const v = settings?.visible ?? {};

  if (!firestoreLoaded) {
    return (
      <div className="min-h-screen bg-blush-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blush-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (firestoreError) return <Navigate to="/" replace />;

  return (
    <div data-accent={accentColor}>
      <Navbar />
      <main>
        <Hero />
        <About />
        {v.metrics !== false && <Metrics />}
        {v.experience !== false && <Experience />}
        {v.testimonials !== false && <Testimonials />}
        {v.blog !== false && <Blog />}
        {v.contact !== false && <Contact />}
      </main>
      <Footer />
    </div>
  );
}

export default function PublicPortfolio() {
  const { username } = useParams();
  const [uid, setUid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getUidByUsername(username)
      .then(found => {
        if (found) setUid(found);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-blush-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blush-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) return <Navigate to="/" replace />;

  return (
    <DataProvider uid={uid} readOnly>
      <PublicSiteContent />
    </DataProvider>
  );
}
