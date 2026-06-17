import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { FiMail, FiSend, FiMapPin, FiLinkedin, FiInstagram, FiFacebook, FiTwitter, FiYoutube, FiFileText, FiCheck } from 'react-icons/fi';
import { SiTiktok } from 'react-icons/si';
import { useData } from '../contexts/DataContext';
import { submitContactMessage, submitResumeRequest } from '../firebase/db';

const SOCIAL_ICONS = [
  { key: 'linkedin',  Icon: FiLinkedin,  label: 'LinkedIn' },
  { key: 'instagram', Icon: FiInstagram, label: 'Instagram' },
  { key: 'facebook',  Icon: FiFacebook,  label: 'Facebook' },
  { key: 'tiktok',    Icon: SiTiktok,    label: 'TikTok' },
  { key: 'twitter',   Icon: FiTwitter,   label: 'Twitter / X' },
  { key: 'youtube',   Icon: FiYoutube,   label: 'YouTube' },
];

const inputCls = 'w-full font-body text-sm border border-accent-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-accent-300 focus:border-transparent transition-all placeholder:text-gray-300';

export default function Contact() {
  const { profile, uid } = useData();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState(null); // null | 'sending' | 'sent' | 'error'

  const [reqForm, setReqForm] = useState({ name: '', email: '', message: '' });
  const [reqStatus, setReqStatus] = useState(null);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleReqChange = e => setReqForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!uid) return;
    setStatus('sending');
    try {
      await submitContactMessage(uid, form);
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  };

  const handleReqSubmit = async (e) => {
    e.preventDefault();
    if (!uid) return;
    setReqStatus('submitting');
    try {
      await submitResumeRequest(uid, {
        requesterName: reqForm.name,
        requesterEmail: reqForm.email,
        message: reqForm.message,
      });
      setReqStatus('sent');
    } catch {
      setReqStatus('error');
    }
  };

  const activeSocials = SOCIAL_ICONS.filter(s => profile[s.key]);

  return (
    <section id="contact" className="py-24 px-6 bg-gradient-to-br from-accent-50 to-accent-100" ref={ref}>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <p className="section-subtitle">Let's Connect</p>
          <h2 className="section-title">Get in touch.</h2>
          <p className="font-body text-gray-400 mt-3 max-w-md mx-auto">
            Whether it's a new opportunity, a collaboration, or just a conversation — I'd love to hear from you.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-10 items-start">

          {/* Left — contact info */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2 flex flex-col gap-5"
          >
            {profile.email && (
              <a href={`mailto:${profile.email}`} className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-accent-100 rounded-xl flex items-center justify-center shrink-0">
                  <FiMail className="text-accent-500" size={16} />
                </div>
                <span className="font-body text-sm text-gray-600 group-hover:text-accent-500 transition-colors">
                  {profile.email}
                </span>
              </a>
            )}

            {profile.location && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                  <FiMapPin className="text-gray-400" size={16} />
                </div>
                <div>
                  <p className="font-body text-sm text-gray-600">{profile.location}</p>
                  <p className="font-body text-xs text-gray-400 mt-0.5">Open to remote & hybrid</p>
                </div>
              </div>
            )}

            {activeSocials.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {activeSocials.map(({ key, Icon, label }) => (
                  <a
                    key={key}
                    href={profile[key]}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="flex items-center gap-2 font-body text-xs font-semibold px-3.5 py-2 rounded-full border transition-colors hover:opacity-80"
                    style={{ color: 'var(--accent-600)', borderColor: 'var(--accent-200)', backgroundColor: 'var(--accent-50)' }}
                  >
                    <Icon size={13} />
                    {label}
                  </a>
                ))}
              </div>
            )}

            <p className="font-body text-sm text-gray-400 italic pt-1">
              Typically responds within 24 hours on business days.
            </p>
          </motion.div>

          {/* Right — contact form */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-3"
          >
            {status === 'sent' ? (
              <div className="card flex flex-col items-center justify-center text-center py-16">
                <div className="w-14 h-14 bg-accent-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">💌</span>
                </div>
                <h3 className="font-display text-2xl text-gray-800 mb-2">Message sent!</h3>
                <p className="font-body text-gray-400 text-sm">Thanks for reaching out. I'll be in touch soon.</p>
                <button
                  onClick={() => { setStatus(null); setForm({ name: '', email: '', subject: '', message: '' }); }}
                  className="mt-6 btn-outline"
                >
                  Send another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="card space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="font-body text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-2">Name</label>
                    <input type="text" name="name" required value={form.name} onChange={handleChange} placeholder="Your name" className={inputCls} />
                  </div>
                  <div>
                    <label className="font-body text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-2">Email</label>
                    <input type="email" name="email" required value={form.email} onChange={handleChange} placeholder="you@company.com" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="font-body text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-2">Subject</label>
                  <input type="text" name="subject" required value={form.subject} onChange={handleChange} placeholder="What's this about?" className={inputCls} />
                </div>
                <div>
                  <label className="font-body text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-2">Message</label>
                  <textarea name="message" required rows={5} value={form.message} onChange={handleChange} placeholder="Tell me about the opportunity or project..." className={`${inputCls} resize-none`} />
                </div>
                {status === 'error' && (
                  <p className="font-body text-xs text-red-500">Something went wrong — please try again.</p>
                )}
                <button type="submit" disabled={status === 'sending'} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60">
                  <FiSend size={14} />
                  {status === 'sending' ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            )}
          </motion.div>
        </div>

        {/* Resume request */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-10 rounded-3xl border border-accent-100 bg-white/60 p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-accent-100 rounded-2xl flex items-center justify-center">
              <FiFileText className="text-accent-500" size={18} />
            </div>
            <div>
              <h3 className="font-display text-xl text-gray-800">Request My Formal Resume</h3>
              <p className="font-body text-sm text-gray-400">I'll send a PDF directly to your inbox</p>
            </div>
          </div>

          {reqStatus === 'sent' ? (
            <div className="flex items-center gap-3 py-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                <FiCheck size={18} className="text-green-500" />
              </div>
              <div>
                <p className="font-body text-sm font-semibold text-gray-800">Request received!</p>
                <p className="font-body text-xs text-gray-400">I'll review and send your resume shortly.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleReqSubmit} className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="font-body text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-2">Your Name</label>
                <input type="text" name="name" required value={reqForm.name} onChange={handleReqChange} placeholder="Jane Smith" className={inputCls} />
              </div>
              <div>
                <label className="font-body text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-2">Your Email</label>
                <input type="email" name="email" required value={reqForm.email} onChange={handleReqChange} placeholder="you@company.com" className={inputCls} />
              </div>
              <div>
                <label className="font-body text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-2">
                  Note <span className="text-gray-300 font-normal normal-case">(optional)</span>
                </label>
                <input type="text" name="message" value={reqForm.message} onChange={handleReqChange} placeholder="e.g. Hiring for a sales role" className={inputCls} />
              </div>
              {reqStatus === 'error' && (
                <p className="sm:col-span-3 font-body text-xs text-red-500">Something went wrong — please try again.</p>
              )}
              <div className="sm:col-span-3">
                <button type="submit" disabled={reqStatus === 'submitting'} className="btn-primary flex items-center gap-2 disabled:opacity-60">
                  <FiFileText size={14} />
                  {reqStatus === 'submitting' ? 'Sending…' : 'Request Resume'}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
