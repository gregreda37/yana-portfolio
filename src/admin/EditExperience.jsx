import { useState } from 'react';
import { useData } from '../contexts/DataContext';

const blankJob = () => ({ id: Date.now(), role: '', company: '', period: '', location: '', highlights: [] });
const blankEdu = () => ({ id: Date.now(), degree: '', school: '', year: '' });

export default function EditExperience({ onToast }) {
  const { experience, saveSection } = useData();
  const [jobs, setJobs] = useState(experience.jobs.map((j, i) => ({ ...j, id: j.id ?? i })));
  const [education, setEducation] = useState(experience.education.map((e, i) => ({ ...e, id: e.id ?? i })));
  const [skills, setSkills] = useState(experience.skills.join(', '));
  const [editJobIdx, setEditJobIdx] = useState(null);
  const [editJob, setEditJob] = useState(null);
  const [editEduIdx, setEditEduIdx] = useState(null);
  const [editEdu, setEditEdu] = useState(null);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('jobs');

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSection('experience', {
        jobs,
        education,
        skills: skills.split(',').map(s => s.trim()).filter(Boolean),
      });
      onToast('Experience saved!');
    } finally {
      setSaving(false);
    }
  };

  // Jobs
  const openJob = (idx) => { setEditJobIdx(idx); setEditJob({ ...jobs[idx], highlights: [...jobs[idx].highlights] }); };
  const applyJob = () => { setJobs(p => p.map((j, i) => i === editJobIdx ? editJob : j)); setEditJobIdx(null); };
  const setJobField = (k, v) => setEditJob(j => ({ ...j, [k]: v }));
  const addJob = () => { const b = blankJob(); setJobs(p => [...p, b]); setEditJobIdx(jobs.length); setEditJob({ ...b, highlights: [] }); };

  // Education
  const openEdu = (idx) => { setEditEduIdx(idx); setEditEdu({ ...education[idx] }); };
  const applyEdu = () => { setEducation(p => p.map((e, i) => i === editEduIdx ? editEdu : e)); setEditEduIdx(null); };
  const addEdu = () => { const b = blankEdu(); setEducation(p => [...p, b]); setEditEduIdx(education.length); setEditEdu({ ...b }); };

  const TAB = 'font-body text-sm font-semibold px-4 py-2 rounded-full transition-colors';

  return (
    <div>
      <h2 className="admin-section-title">Experience</h2>
      <p className="admin-section-desc">Work history, education, and skills listed on the resume section.</p>

      <div className="flex gap-2 mt-5 mb-6">
        {['jobs', 'education', 'skills'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`${TAB} ${tab === t ? 'bg-blush-500 text-white' : 'bg-blush-50 text-gray-600 hover:bg-blush-100'}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'jobs' && (
        <div className="space-y-3">
          {jobs.map((job, idx) => (
            <div key={job.id}>
              {editJobIdx === idx ? (
                <div className="admin-card border-2 border-blush-300 space-y-3">
                  {[['Role / Title', 'role'], ['Company', 'company'], ['Period', 'period'], ['Location', 'location']].map(([label, key]) => (
                    <div key={key}>
                      <label className="admin-label">{label}</label>
                      <input value={editJob[key]} onChange={e => setJobField(key, e.target.value)} className="admin-input" />
                    </div>
                  ))}
                  <div>
                    <label className="admin-label">Highlights (one per line)</label>
                    <textarea
                      rows={5}
                      className="admin-input resize-none"
                      value={editJob.highlights.join('\n')}
                      onChange={e => setJobField('highlights', e.target.value.split('\n'))}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={applyJob} className="btn-primary text-xs px-4 py-2">Apply</button>
                    <button onClick={() => setEditJobIdx(null)} className="btn-outline text-xs px-4 py-2">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="admin-card flex items-start justify-between gap-4">
                  <div>
                    <p className="font-body font-semibold text-gray-800 text-sm">{job.role} <span className="text-blush-500">@ {job.company}</span></p>
                    <p className="font-body text-xs text-gray-400">{job.period} · {job.location}</p>
                    <p className="font-body text-xs text-gray-500 mt-1">{job.highlights.length} highlight{job.highlights.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => openJob(idx)} className="admin-btn-sm">Edit</button>
                    <button onClick={() => setJobs(p => p.filter((_, i) => i !== idx))} className="admin-btn-sm text-red-500">Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          <button onClick={addJob} className="btn-outline text-sm mt-2">+ Add Position</button>
        </div>
      )}

      {tab === 'education' && (
        <div className="space-y-3">
          {education.map((ed, idx) => (
            <div key={ed.id}>
              {editEduIdx === idx ? (
                <div className="admin-card border-2 border-blush-300 space-y-3">
                  {[['Degree / Cert', 'degree'], ['School / Issuer', 'school'], ['Year', 'year']].map(([label, key]) => (
                    <div key={key}>
                      <label className="admin-label">{label}</label>
                      <input value={editEdu[key]} onChange={e => setEditEdu(e2 => ({ ...e2, [key]: e.target.value }))} className="admin-input" />
                    </div>
                  ))}
                  <div className="flex gap-3">
                    <button onClick={applyEdu} className="btn-primary text-xs px-4 py-2">Apply</button>
                    <button onClick={() => setEditEduIdx(null)} className="btn-outline text-xs px-4 py-2">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="admin-card flex items-start justify-between gap-4">
                  <div>
                    <p className="font-body font-semibold text-gray-800 text-sm">{ed.degree}</p>
                    <p className="font-body text-xs text-gray-400">{ed.school} · {ed.year}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => openEdu(idx)} className="admin-btn-sm">Edit</button>
                    <button onClick={() => setEducation(p => p.filter((_, i) => i !== idx))} className="admin-btn-sm text-red-500">Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          <button onClick={addEdu} className="btn-outline text-sm mt-2">+ Add Education</button>
        </div>
      )}

      {tab === 'skills' && (
        <div>
          <label className="admin-label">Skills (comma-separated)</label>
          <textarea rows={4} className="admin-input resize-none" value={skills} onChange={e => setSkills(e.target.value)} />
          <p className="font-body text-xs text-gray-400 mt-2">These appear as pill tags in the About section.</p>
        </div>
      )}

      <div className="mt-8">
        <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">
          {saving ? 'Saving…' : 'Save Experience'}
        </button>
      </div>
    </div>
  );
}
