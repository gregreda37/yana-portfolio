import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { FiMail, FiLinkedin, FiSend, FiMapPin, FiInstagram, FiFacebook, FiTwitter, FiYoutube, FiFileText, FiCheck } from 'react-icons/fi';
import { SiTiktok } from 'react-icons/si';
import { useData } from '../contexts/DataContext';
import { submitResumeRequest } from '../firebase/db';
import { sendContactEmail } from '../utils/sendContactEmail';

const SOCIAL_ICONS = [
  { key: 'linkedin',  Icon: FiLinkedin,  label: 'LinkedIn',    bg: 'bg-lavender-100', color: 'text-lavender-500' },
  { key: 'instagram', Icon: FiInstagram, label: 'Instagram',   bg: 'bg-pink-100',     color: 'text-pink-500' },
  { key: 'facebook',  Icon: FiFacebook,  label: 'Facebook',    bg: 'bg-blue-100',     color: 'text-blue-500' },
  { key: 'tiktok',    Icon: SiTiktok,    label: 'TikTok',      bg: 'bg-gray-100',     color: 'text-gray-700' },
  { key: 'twitter',   Icon: FiTwitter,   label: 'Twitter / X', bg: 'bg-sky-100',      color: 'text-sky-500' },
  { key: 'youtube',   Icon: FiYoutube,   label: 'YouTube',     bg: 'bg-red-100',      color: 'text-red-500' },
];

export default function Contact() {
  const { profile, uid } = useData();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);

  // Resume request state
  const [reqForm, setReqForm] = useState({ name: '', email: '', message: '' });
  const [reqStatus, setReqStatus] = useState(null); // null | 'submitting' | 'sent' | 'error'

  const handleReqChange = e => setReqForm(f => ({ ...f, [e.target.name]: e.target.value }));

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

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!profile.email) { setSubmitted(true); return; }
    setSending(true);
    setSendError(false);
    try {
      await sendContactEmail({
        senderName: form.name,
        senderEmail: form.email,
        subject: form.subject,
        message: form.message,
        ownerEmail: profile.email,
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Contact email failed:', err);
      setSendError(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contact" className="py-24 px-6 bg-gradient-to-br from-accent-50 to-accent-100" ref={ref}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="section-subtitle">Let's Connect</p>
          <h2 className="section-title">Get in touch.</h2>
          <p className="font-body text-gray-400 mt-3 max-w-md mx-auto">
            Whether it's a new opportunity, a collaboration, or just a conversation — I'd love to hear from you.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-10">
          {/* Contact info */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="card flex items-start gap-4">
              <div className="w-10 h-10 bg-accent-100 rounded-xl flex items-center justify-center shrink-0">
                <FiMail className="text-accent-500" size={16} />
              </div>
              <div>
                <p className="font-body text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Email</p>
                <a href={`mailto:${profile.email}`} className="font-body text-sm text-gray-700 hover:text-accent-500 transition-colors">
                  {profile.email}
                </a>
              </div>
            </div>

            {SOCIAL_ICONS.filter(s => profile[s.key]).map(({ key, Icon, label, bg, color }) => (
              <div key={key} className="card flex items-start gap-4">
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
                  <Icon className={color} size={16} />
                </div>
                <div>
                  <p className="font-body text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">{label}</p>
                  <a href={profile[key]} target="_blank" rel="noreferrer" className="font-body text-sm text-gray-700 hover:text-accent-500 transition-colors break-all">
                    {profile[key]?.replace('https://', '').replace('www.', '')}
                  </a>
                </div>
              </div>
            ))}

            <div className="card flex items-start gap-4">
              <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center shrink-0">
                <FiMapPin className="text-pink-500" size={16} />
              </div>
              <div>
                <p className="font-body text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Location</p>
                <p className="font-body text-sm text-gray-700">{profile.location}</p>
                <p className="font-body text-xs text-gray-400">Open to remote & hybrid</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-accent-400 to-accent-600 rounded-2xl p-6 text-white">
              <p className="font-display text-2xl font-light mb-2">Response time</p>
              <p className="font-body text-sm opacity-90">Usually within 24 hours on business days.</p>
            </div>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-3"
          >
            {submitted ? (
              <div className="card h-full flex flex-col items-center justify-center text-center py-16">
                <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-3xl">💌</span>
                </div>
                <h3 className="font-display text-2xl text-gray-800 mb-2">Message sent!</h3>
                <p className="font-body text-gray-400 text-sm">Thanks for reaching out. I'll be in touch soon.</p>
                <button
                  onClick={() => setSubmitted(false)}
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
                    <input
                      type="text"
                      name="name"
                      required
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      className="w-full font-body text-sm border border-accent-200 rounded-xl px-4 py-3 bg-accent-50 focus:outline-none focus:ring-2 focus:ring-accent-300 focus:border-transparent transition-all placeholder:text-gray-300"
                    />
                  </div>
                  <div>
                    <label className="font-body text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@company.com"
                      className="w-full font-body text-sm border border-accent-200 rounded-xl px-4 py-3 bg-accent-50 focus:outline-none focus:ring-2 focus:ring-accent-300 focus:border-transparent transition-all placeholder:text-gray-300"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-body text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-2">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    required
                    value={form.subject}
                    onChange={handleChange}
                    placeholder="What's this about?"
                    className="w-full font-body text-sm border border-accent-200 rounded-xl px-4 py-3 bg-accent-50 focus:outline-none focus:ring-2 focus:ring-accent-300 focus:border-transparent transition-all placeholder:text-gray-300"
                  />
                </div>
                <div>
                  <label className="font-body text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-2">Message</label>
                  <textarea
                    name="message"
                    required
                    value={form.message}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Tell me about the opportunity or project..."
                    className="w-full font-body text-sm border border-accent-200 rounded-xl px-4 py-3 bg-accent-50 focus:outline-none focus:ring-2 focus:ring-accent-300 focus:border-transparent transition-all placeholder:text-gray-300 resize-none"
                  />
                </div>
                {sendError && (
                  <p className="font-body text-xs text-red-500">Something went wrong — please try again or email me directly.</p>
                )}
                <button
                  type="submit"
                  disabled={sending}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <FiSend size={14} />
                  {sending ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            )}
          </motion.div>
        </div>
        {/* Resume request */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10"
        >
          <div className="rounded-3xl border border-accent-100 bg-gradient-to-br from-accent-50 to-accent-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-accent-100">
                <FiFileText className="text-accent-500" size={18} />
              </div>
              <div>
                <h3 className="font-display text-xl text-gray-800">Request My Formal Resume</h3>
                <p className="font-body text-sm text-gray-400">I'll send a PDF directly to your inbox</p>
              </div>
            </div>

            {reqStatus === 'sent' ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <FiCheck size={24} className="text-green-500" />
                </div>
                <p className="font-display text-lg text-gray-800 mb-1">Request received!</p>
                <p className="font-body text-sm text-gray-400">I'll review and send your resume shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleReqSubmit} className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-body text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-2">Your Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={reqForm.name}
                    onChange={handleReqChange}
                    placeholder="Jane Smith"
                    className="w-full font-body text-sm border border-accent-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-accent-300 focus:border-transparent transition-all placeholder:text-gray-300"
                  />
                </div>
                <div>
                  <label className="font-body text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-2">Your Email</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={reqForm.email}
                    onChange={handleReqChange}
                    placeholder="you@company.com"
                    className="w-full font-body text-sm border border-accent-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-accent-300 focus:border-transparent transition-all placeholder:text-gray-300"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-body text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-2">Note <span className="text-gray-300 font-normal normal-case">(optional)</span></label>
                  <input
                    type="text"
                    name="message"
                    value={reqForm.message}
                    onChange={handleReqChange}
                    placeholder="e.g. Hiring for a sales role at Acme Co."
                    className="w-full font-body text-sm border border-accent-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-accent-300 focus:border-transparent transition-all placeholder:text-gray-300"
                  />
                </div>
                {reqStatus === 'error' && (
                  <p className="sm:col-span-2 font-body text-xs text-red-500">Something went wrong — please try again.</p>
                )}
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={reqStatus === 'submitting'}
                    className="btn-primary flex items-center gap-2 disabled:opacity-60"
                  >
                    <FiFileText size={14} />
                    {reqStatus === 'submitting' ? 'Sending request…' : 'Request Resume'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
