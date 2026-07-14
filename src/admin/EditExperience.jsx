import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { sortJobsByDate, computePeriod, MONTHS, YEARS } from '../utils/sortJobs';

const blankJob = () => ({
  id: Date.now(), role: '', company: '',
  startMonth: '', startYear: '', endMonth: '', endYear: '', endPresent: false,
  period: '', location: '', highlights: [],
});
const blankEdu = () => ({ id: Date.now(), degree: '', school: '', year: '', type: 'Education', description: '', courses: '' });
const blankLang = () => ({ id: Date.now(), name: '', level: 'Professional' });
const LEVELS = ['Native', 'Fluent', 'Professional', 'Conversational', 'Basic'];

export default function EditExperience({ onToast }) {
  const { experience, saveSection } = useData();
  const [jobs, setJobs] = useState(experience.jobs.map((j, i) => ({ ...j, id: j.id ?? i })));
  const [education, setEducation] = useState(experience.education.map((e, i) => ({ ...e, id: e.id ?? i })));
  const [skills, setSkills] = useState(experience.skills.join(', '));
  const [languages, setLanguages] = useState((experience.languages ?? []).map((l, i) => ({ ...l, id: l.id ?? i })));
  const [editLangIdx, setEditLangIdx] = useState(null);
  const [editLang, setEditLang] = useState(null);
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
        jobs: sortJobsByDate(jobs.map(j => ({ ...j, period: computePeriod(j) }))),
        education,
        skills: skills.split(',').map(s => s.trim()).filter(Boolean),
        languages,
      });
      onToast('Experience saved!');
    } catch {
      onToast('Save failed — check your connection and try again.');
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

  // Languages
  const openLang = (idx) => { setEditLangIdx(idx); setEditLang({ ...languages[idx] }); };
  const applyLang = () => { setLanguages(p => p.map((l, i) => i === editLangIdx ? editLang : l)); setEditLangIdx(null); };
  const addLang = () => { const b = blankLang(); setLanguages(p => [...p, b]); setEditLangIdx(languages.length); setEditLang({ ...b }); };

  const TAB = 'font-body text-sm font-semibold px-4 py-2 rounded-full transition-colors';

  return (
    <div>
      <h2 className="admin-section-title">Experience</h2>
      <p className="admin-section-desc">Work history, education, and skills listed on the resume section.</p>

      <div className="flex flex-wrap gap-2 mt-5 mb-6">
        {[['jobs', 'Jobs'], ['education', 'Education'], ['skills', 'Skills'], ['languages', 'Languages']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`${TAB} ${tab === key ? 'bg-blush-500 text-white' : 'bg-blush-50 text-gray-600 hover:bg-blush-100'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'jobs' && (
        <div className="space-y-3">
          {jobs.map((job, idx) => (
            <div key={job.id}>
              {editJobIdx === idx ? (
                <div className="admin-card border-2 border-blush-300 space-y-3">
                  {[['Role / Title', 'role'], ['Company', 'company'], ['Location', 'location']].map(([label, key]) => (
                    <div key={key}>
                      <label className="admin-label">{label}</label>
                      <input value={editJob[key] ?? ''} onChange={e => setJobField(key, e.target.value)} className="admin-input" />
                    </div>
                  ))}

                  {/* Period — structured month + year pickers */}
                  <div>
                    <label className="admin-label">Period</label>
                    <div className="flex flex-wrap gap-2 items-center">
                      <select value={editJob.startMonth ?? ''} onChange={e => setJobField('startMonth', e.target.value)} className="admin-input w-auto">
                        <option value="">Month</option>
                        {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <select value={editJob.startYear ?? ''} onChange={e => setJobField('startYear', e.target.value)} className="admin-input w-auto">
                        <option value="">Year</option>
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                      <span className="font-body text-gray-400 px-1">–</span>
                      {editJob.endPresent ? (
                        <button
                          type="button"
                          onClick={() => setJobField('endPresent', false)}
                          className="font-body text-xs font-semibold px-3 py-1.5 rounded-full bg-accent-100 text-accent-700 border border-accent-200 hover:bg-accent-200 transition-colors"
                        >
                          Present ✕
                        </button>
                      ) : (
                        <>
                          <select value={editJob.endMonth ?? ''} onChange={e => setJobField('endMonth', e.target.value)} className="admin-input w-auto">
                            <option value="">Month</option>
                            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                          <select value={editJob.endYear ?? ''} onChange={e => setJobField('endYear', e.target.value)} className="admin-input w-auto">
                            <option value="">Year</option>
                            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                          <button
                            type="button"
                            onClick={() => { setJobField('endPresent', true); setJobField('endMonth', ''); setJobField('endYear', ''); }}
                            className="font-body text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 transition-colors"
                          >
                            Set Present
                          </button>
                        </>
                      )}
                    </div>
                  </div>
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
                    <p className="font-body text-xs text-gray-400">{computePeriod(job)} · {job.location}</p>
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
                  <div>
                    <label className="admin-label">Type</label>
                    <select value={editEdu.type ?? 'Education'} onChange={e => setEditEdu(e2 => ({ ...e2, type: e.target.value }))} className="admin-input">
                      <option value="Education">Education</option>
                      <option value="Certification">Certification</option>
                    </select>
                  </div>
                  {[['Degree / Cert / Program', 'degree'], ['School / Issuer', 'school'], ['Year', 'year']].map(([label, key]) => (
                    <div key={key}>
                      <label className="admin-label">{label}</label>
                      <input value={editEdu[key]} onChange={e => setEditEdu(e2 => ({ ...e2, [key]: e.target.value }))} className="admin-input" />
                    </div>
                  ))}
                  {(editEdu.type ?? 'Education') === 'Education' ? (
                    <div>
                      <label className="admin-label">Relevant Courses <span className="text-gray-300 font-normal">(one per line)</span></label>
                      <textarea
                        rows={4}
                        className="admin-input resize-none"
                        placeholder={"e.g.\nAdvanced Sales Strategy\nConsumer Behavior\nBusiness Communications"}
                        value={editEdu.courses ?? ''}
                        onChange={e => setEditEdu(e2 => ({ ...e2, courses: e.target.value }))}
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="admin-label">Description</label>
                      <textarea
                        rows={4}
                        className="admin-input resize-none"
                        placeholder="What this certification covers, what skills it validates..."
                        value={editEdu.description ?? ''}
                        onChange={e => setEditEdu(e2 => ({ ...e2, description: e.target.value }))}
                      />
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button onClick={applyEdu} className="btn-primary text-xs px-4 py-2">Apply</button>
                    <button onClick={() => setEditEduIdx(null)} className="btn-outline text-xs px-4 py-2">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="admin-card flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-body font-semibold text-gray-800 text-sm">{ed.degree}</p>
                      <span className="font-body text-[10px] px-2 py-0.5 rounded-full bg-blush-50 text-blush-500 border border-blush-100">{ed.type ?? 'Education'}</span>
                    </div>
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

      {tab === 'languages' && (
        <div className="space-y-3">
          {languages.map((lang, idx) => (
            <div key={lang.id}>
              {editLangIdx === idx ? (
                <div className="admin-card border-2 border-blush-300 space-y-3">
                  <div>
                    <label className="admin-label">Language</label>
                    <input
                      value={editLang.name}
                      onChange={e => setEditLang(l => ({ ...l, name: e.target.value }))}
                      className="admin-input"
                      placeholder="e.g. Spanish"
                    />
                  </div>
                  <div>
                    <label className="admin-label">Proficiency</label>
                    <select
                      value={editLang.level}
                      onChange={e => setEditLang(l => ({ ...l, level: e.target.value }))}
                      className="admin-input"
                    >
                      {LEVELS.map(lv => <option key={lv} value={lv}>{lv}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={applyLang} className="btn-primary text-xs px-4 py-2">Apply</button>
                    <button onClick={() => setEditLangIdx(null)} className="btn-outline text-xs px-4 py-2">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="admin-card flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <p className="font-body font-semibold text-sm text-gray-800">{lang.name}</p>
                    <span className="font-body text-xs px-2.5 py-1 rounded-full bg-blush-50 text-blush-600 border border-blush-100">
                      {lang.level}
                    </span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => openLang(idx)} className="admin-btn-sm">Edit</button>
                    <button onClick={() => setLanguages(p => p.filter((_, i) => i !== idx))} className="admin-btn-sm text-red-500">Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          <button onClick={addLang} className="btn-outline text-sm mt-2">+ Add Language</button>
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
