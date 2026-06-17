import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { getResumeRequests, updateResumeRequest } from '../firebase/db';
import { FiFileText, FiMail, FiCheck, FiX, FiDownload, FiClock, FiRefreshCw } from 'react-icons/fi';
import { sendResumeEmail } from '../utils/sendResumeEmail';

// ── PDF generation ────────────────────────────────────────────────────────────
// Opens a print-ready resume in a new tab. Click "Print / Save as PDF" inside.
function openResumePDF(data) {
  const { profile, metrics, experience, healthcare, settings } = data;
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Resume';

  const contactLine = [
    profile.email   ? `<a href="mailto:${profile.email}">${profile.email}</a>` : '',
    profile.location ? profile.location : '',
    profile.linkedin ? `<a href="${profile.linkedin}">${profile.linkedin.replace('https://','').replace('www.','')}</a>` : '',
    profile.twitter  ? `<a href="${profile.twitter}">${profile.twitter.replace('https://','').replace('www.','')}</a>` : '',
  ].filter(Boolean).join('<span class="dot"> &middot; </span>');

  const jobsHtml = (experience.jobs ?? []).map(j => `
    <div class="job">
      <div class="job-row">
        <span class="job-role">${j.role ?? ''}</span>
        <span class="job-period">${j.period ?? ''}</span>
      </div>
      <div class="job-company">${j.company ?? ''}${j.location ? ' &middot; ' + j.location : ''}</div>
      ${(j.highlights ?? []).length
        ? `<ul class="bullets">${(j.highlights).map(h => `<li>${h}</li>`).join('')}</ul>`
        : ''}
    </div>`).join('');

  const eduHtml = (experience.education ?? []).map(e => `
    <div class="edu-row">
      <div>
        <div class="edu-degree">${e.degree ?? ''}</div>
        <div class="edu-school">${e.school ?? ''}</div>
      </div>
      ${e.year ? `<div class="edu-year">${e.year}</div>` : ''}
    </div>`).join('');

  const skillsHtml = (experience.skills ?? []).join('  &middot;  ');

  const metricsHtml = (metrics.items ?? []).map(m =>
    `<td class="metric-cell">
       <div class="metric-val">${m.prefix ?? ''}${m.value}${m.suffix ?? ''}</div>
       <div class="metric-lbl">${m.label}</div>
     </td>`
  ).join('');

  const specialtyHtml = healthcare?.summary && settings?.visible?.specialty !== false
    ? `<div class="section">
         <div class="section-head">${healthcare.label || 'Specialty Background'}</div>
         <p class="body-text">${healthcare.summary}</p>
         ${(healthcare.highlights ?? []).length
           ? `<ul class="bullets" style="margin-top:5px">${healthcare.highlights.map(h => `<li>${h}</li>`).join('')}</ul>`
           : ''}
       </div>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${fullName} &mdash; Resume</title>
<style>
  @page { size: letter portrait; margin: 0.65in 0.75in; }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 10pt;
    color: #1a1a1a;
    background: #fff;
    max-width: 7in;
    margin: 0 auto;
    padding: 0.5in 0;
  }

  /* ── Print button (screen only) ── */
  .print-btn {
    position: fixed; top: 18px; right: 18px;
    background: #1a1a1a; color: #fff; border: none;
    padding: 9px 20px; font-size: 12px; font-family: Arial, sans-serif;
    cursor: pointer; border-radius: 3px; letter-spacing: 0.03em;
    box-shadow: 0 2px 8px rgba(0,0,0,0.18);
  }
  .print-btn:hover { background: #333; }

  /* ── Header ── */
  .resume-name {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 26pt; font-weight: normal;
    letter-spacing: 0.01em; color: #111;
    line-height: 1;
  }
  .resume-title {
    font-size: 10.5pt; color: #444;
    margin-top: 4px; letter-spacing: 0.05em;
  }
  .resume-contact {
    font-size: 8.5pt; color: #555; margin-top: 6px;
  }
  .resume-contact a { color: #555; text-decoration: none; }
  .dot { color: #999; }
  .header-rule { border: none; border-top: 2px solid #1a1a1a; margin: 10px 0 14px; }

  /* ── Sections ── */
  .section { margin-bottom: 13px; }
  .section-head {
    font-size: 7.5pt; font-weight: bold;
    letter-spacing: 0.14em; text-transform: uppercase;
    color: #1a1a1a; padding-bottom: 3px;
    border-bottom: 1px solid #1a1a1a;
    margin-bottom: 8px;
  }

  /* Summary */
  .body-text { font-size: 9.5pt; color: #333; line-height: 1.65; }

  /* Metrics */
  .metrics-table { width: 100%; border-collapse: collapse; border: 1px solid #ccc; }
  .metric-cell { text-align: center; padding: 7px 4px; border-right: 1px solid #ccc; }
  .metric-cell:last-child { border-right: none; }
  .metric-val {
    font-family: Georgia, serif; font-size: 14pt;
    font-weight: bold; color: #1a1a1a; line-height: 1;
  }
  .metric-lbl { font-size: 7pt; color: #666; margin-top: 2px; line-height: 1.3; }

  /* Jobs */
  .job { margin-bottom: 11px; }
  .job-row { display: flex; justify-content: space-between; align-items: baseline; }
  .job-role { font-size: 10pt; font-weight: bold; color: #111; }
  .job-period { font-size: 8.5pt; color: #555; }
  .job-company { font-size: 9pt; color: #444; margin: 1px 0 4px; }

  /* Bullets (jobs + specialty) */
  .bullets { margin: 0; padding: 0; list-style: none; }
  .bullets li {
    font-size: 9pt; color: #333; line-height: 1.55;
    margin-bottom: 2px; padding-left: 13px; position: relative;
  }
  .bullets li::before { content: "\\25B8"; position: absolute; left: 0; color: #888; font-size: 7.5pt; top: 1px; }

  /* Education */
  .edu-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 7px; }
  .edu-degree { font-size: 9.5pt; font-weight: bold; color: #111; }
  .edu-school { font-size: 8.5pt; color: #444; margin-top: 1px; }
  .edu-year { font-size: 8.5pt; color: #555; }

  /* Skills */
  .skills-text { font-size: 9pt; color: #333; line-height: 1.8; }

  /* Footer */
  .resume-footer { margin-top: 16px; font-size: 7pt; color: #ccc; text-align: center; border-top: 1px solid #f0f0f0; padding-top: 7px; }

  @media print {
    .print-btn { display: none; }
    body { padding: 0; max-width: none; }
  }
</style>
</head>
<body>

<button class="print-btn" onclick="window.print()">&#128438; Save as PDF</button>

<!-- HEADER -->
<div class="resume-name">${fullName}</div>
${profile.title ? `<div class="resume-title">${profile.title}</div>` : ''}
<div class="resume-contact">${contactLine}</div>
<hr class="header-rule"/>

${profile.bio1 || profile.bio2 ? `
<div class="section">
  <div class="section-head">Professional Summary</div>
  <p class="body-text">${[profile.bio1, profile.bio2].filter(Boolean).join(' ')}</p>
</div>` : ''}

${metricsHtml ? `
<div class="section">
  <div class="section-head">Key Results</div>
  <table class="metrics-table"><tr>${metricsHtml}</tr></table>
</div>` : ''}

${jobsHtml ? `
<div class="section">
  <div class="section-head">Experience</div>
  ${jobsHtml}
</div>` : ''}

${eduHtml ? `
<div class="section">
  <div class="section-head">Education</div>
  ${eduHtml}
</div>` : ''}

${skillsHtml ? `
<div class="section">
  <div class="section-head">Skills</div>
  <div class="skills-text">${skillsHtml}</div>
</div>` : ''}

${specialtyHtml}

<div class="resume-footer">Generated via Yana &middot; findyana.com</div>

</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) { alert('Please allow popups to preview the resume.'); return; }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    pending:  { label: 'Pending',  cls: 'bg-amber-100 text-amber-700' },
    sent:     { label: 'Sent',     cls: 'bg-green-100 text-green-700' },
    declined: { label: 'Declined', cls: 'bg-gray-100 text-gray-500' },
  };
  const { label, cls } = map[status] ?? map.pending;
  return (
    <span className={`font-body text-xs font-semibold px-3 py-1 rounded-full ${cls}`}>{label}</span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function EditResumeRequests({ onToast }) {
  const { user, username } = useAuth();
  const portfolioData = useData();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getResumeRequests(user.uid);
      setRequests(data);
    } catch {
      onToast('Failed to load requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user]);

  const markSent = async (req) => {
    try {
      await sendResumeEmail({
        requesterEmail: req.requesterEmail,
        requesterName: req.requesterName,
        portfolioData,
        username,
      });
      await updateResumeRequest(user.uid, req.id, { status: 'sent', sentAt: new Date() });
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'sent' } : r));
      onToast(`Resume emailed to ${req.requesterEmail}!`);
    } catch (err) {
      console.error('Resume email failed:', err);
      onToast(`Email failed: ${err.message ?? 'Unknown error'}`);
    }
  };

  const decline = async (req) => {
    try {
      await updateResumeRequest(user.uid, req.id, { status: 'declined' });
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'declined' } : r));
      onToast('Request declined.');
    } catch {
      onToast('Update failed — try again.');
    }
  };

  const pending = requests.filter(r => r.status === 'pending');
  const handled = requests.filter(r => r.status !== 'pending');

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h2 className="admin-section-title">Resume Requests</h2>
        <button onClick={load} className="text-gray-400 hover:text-blush-500 transition-colors" aria-label="Refresh">
          <FiRefreshCw size={15} />
        </button>
      </div>
      <p className="admin-section-desc">Visitors who requested a formal copy of your resume.</p>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-7 h-7 border-2 border-blush-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="admin-card mt-6 flex flex-col items-center justify-center py-16 text-center">
          <FiFileText size={32} className="text-gray-200 mb-4" />
          <p className="font-body text-sm text-gray-400">No requests yet.</p>
          <p className="font-body text-xs text-gray-300 mt-1">They'll appear here when visitors use the resume request form on your portfolio.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-8">

          {pending.length > 0 && (
            <div>
              <p className="font-body text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                Pending · {pending.length}
              </p>
              <div className="space-y-4">
                {pending.map(req => (
                  <RequestCard
                    key={req.id}
                    req={req}
                    portfolioData={portfolioData}
                    onMarkSent={markSent}
                    onDecline={decline}
                  />
                ))}
              </div>
            </div>
          )}

          {handled.length > 0 && (
            <div>
              <p className="font-body text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                History
              </p>
              <div className="space-y-3">
                {handled.map(req => (
                  <RequestCard
                    key={req.id}
                    req={req}
                    portfolioData={portfolioData}
                    onMarkSent={markSent}
                    onDecline={decline}
                    compact
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Request card ──────────────────────────────────────────────────────────────
function RequestCard({ req, portfolioData, onMarkSent, onDecline, compact = false }) {
  const date = req.requestedAt?.toDate?.()?.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  }) ?? '—';

  return (
    <div className={`admin-card ${compact ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blush-100 rounded-xl flex items-center justify-center shrink-0">
            <FiMail className="text-blush-500" size={16} />
          </div>
          <div>
            <p className="font-body text-sm font-semibold text-gray-800">{req.requesterName}</p>
            <a href={`mailto:${req.requesterEmail}`} className="font-body text-xs text-blush-500 hover:underline">
              {req.requesterEmail}
            </a>
            {req.message && (
              <p className="font-body text-xs text-gray-400 mt-1 italic">"{req.message}"</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <FiClock size={11} className="text-gray-300" />
              <span className="font-body text-xs text-gray-400">{date}</span>
              <StatusBadge status={req.status} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 ml-14">
          <button
            onClick={() => openResumePDF(portfolioData)}
            className="admin-btn-sm flex items-center gap-1.5"
          >
            <FiDownload size={12} /> Preview PDF
          </button>

          {req.status === 'pending' && (
            <>
              <button
                onClick={() => onMarkSent(req)}
                className="flex items-center gap-1.5 font-body text-xs font-semibold text-green-700 bg-green-100 hover:bg-green-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                <FiMail size={12} /> Send Resume
              </button>
              <button
                onClick={() => onDecline(req)}
                className="flex items-center gap-1.5 font-body text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                <FiX size={12} /> Decline
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
