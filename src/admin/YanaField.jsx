import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { refineField } from '../utils/openai';

export const MODEL_LABELS = {
  'gpt-35-turbo':              'GPT-3.5 Turbo',
  'claude-haiku-4-5-20251001': 'Claude Haiku 4.5',
  'claude-sonnet-5':           'Claude Sonnet 5',
  'claude-opus-4-8':           'Claude Opus 4.8',
};

// Stable module-level component — import this wherever Ask Yana is needed.
// Props:
//   label      — field label shown in header and admin UI
//   type       — input type (default 'text'); ignored when rows is set
//   rows       — if set, renders a textarea; drives modal sizing (>=6 = XL 2-col)
//   value      — controlled value
//   onChange   — called as onChange({ target: { value } })
//   yanaField  — unique data attribute for scroll-and-focus after Apply
//   placeholder
//   yana       — pass true to enable the Ask Yana button
//   saveCount  — increment on save to reset Edited badges
export function YanaField({ label, type = 'text', rows, value, onChange, yanaField, placeholder, yana, saveCount = 0 }) {
  const [yanaOpen, setYanaOpen]         = useState(false);
  const [instruction, setInstruction]   = useState('');
  const [suggestion, setSuggestion]     = useState('');
  const [editedSuggestion, setEdited]   = useState('');
  const [generating, setGenerating]     = useState(false);
  const [genError, setGenError]         = useState('');
  const [isTyping, setIsTyping]         = useState(false);
  const [justFinished, setJustFinished] = useState(false);
  const [yanaApplied, setYanaApplied]   = useState(false);
  const typingTimer  = useRef(null);
  const fieldTimer   = useRef(null);
  const savedValue   = useRef(value);

  useEffect(() => {
    setYanaApplied(false);
    savedValue.current = value; // eslint-disable-line react-hooks/exhaustive-deps
  }, [saveCount]);

  const isEdited = (value ?? '') !== (savedValue.current ?? '');

  useEffect(() => {
    if (!suggestion) { setEdited(''); return; }
    clearInterval(typingTimer.current);
    setIsTyping(true);
    setJustFinished(false);
    setEdited('');
    let i = 0;
    const ms = suggestion.length > 400 ? 4 : suggestion.length > 150 ? 8 : 14;
    typingTimer.current = setInterval(() => {
      i++;
      setEdited(suggestion.slice(0, i));
      if (i >= suggestion.length) {
        clearInterval(typingTimer.current);
        setIsTyping(false);
        setJustFinished(true);
        setTimeout(() => setJustFinished(false), 2200);
      }
    }, ms);
    return () => clearInterval(typingTimer.current);
  }, [suggestion]);

  const skipTyping = () => {
    clearInterval(typingTimer.current);
    setEdited(suggestion);
    setIsTyping(false);
    setJustFinished(true);
    setTimeout(() => setJustFinished(false), 2200);
  };

  const generate = async () => {
    setGenerating(true);
    setGenError('');
    setSuggestion('');
    setEdited('');
    try {
      const result = await refineField(label, value ?? '', instruction);
      setSuggestion(result);
    } catch (e) {
      setGenError(e.message || 'Could not generate — please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleApply = async () => {
    const fullText = editedSuggestion;
    closeYana();
    setYanaApplied(true);
    const el = document.querySelector(`[data-yana-field="${yanaField}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await new Promise(r => setTimeout(r, 400));
    el?.focus();
    onChange({ target: { value: '' } });
    await new Promise(r => setTimeout(r, 60));
    const ms = fullText.length > 400 ? 4 : fullText.length > 150 ? 8 : 14;
    clearInterval(fieldTimer.current);
    let i = 0;
    await new Promise(resolve => {
      fieldTimer.current = setInterval(() => {
        i++;
        onChange({ target: { value: fullText.slice(0, i) } });
        if (i >= fullText.length) { clearInterval(fieldTimer.current); resolve(); }
      }, ms);
    });
  };

  const closeYana = () => {
    clearInterval(typingTimer.current);
    setYanaOpen(false);
    setSuggestion('');
    setEdited('');
    setInstruction('');
    setGenError('');
    setIsTyping(false);
    setJustFinished(false);
  };

  const isLarge     = (rows ?? 0) >= 6;
  const modalWidth  = !rows ? 'max-w-lg'  : isLarge ? 'max-w-5xl' : 'max-w-xl';
  const modalHeight = isLarge ? 'h-[90vh]' : 'max-h-[82vh]';
  const suggRows    = !rows ? 3            : isLarge ? 9           : 5;
  const previewMaxH = !rows ? 'max-h-16'  : isLarge ? ''          : 'max-h-24';

  const textareaCls = isTyping
    ? 'border-2 border-blush-300 ring-2 ring-blush-100 bg-blush-50/50 cursor-default text-gray-600'
    : justFinished
      ? 'border-2 border-green-400 ring-2 ring-green-100 bg-green-50/30 focus:ring-green-200'
      : 'border border-blush-200 bg-blush-50/40 focus:ring-2 focus:ring-blush-200 focus:bg-white';

  const fieldCls = (yanaApplied || isEdited)
    ? 'w-full font-body text-sm border-2 border-blush-300 rounded-xl px-4 py-2.5 bg-blush-50/30 focus:outline-none focus:ring-2 focus:ring-blush-200 transition-all'
    : 'admin-input';

  const badge = yanaApplied ? { text: '✨ Edited', cls: 'text-blush-600 bg-blush-100 border-blush-200' }
              : isEdited     ? { text: 'Edited',    cls: 'text-gray-500 bg-gray-100 border-gray-200' }
              : null;

  const modelLabel = MODEL_LABELS[localStorage.getItem('yana_ai_model') ?? 'gpt-35-turbo'] ?? 'GPT-3.5 Turbo';

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-body text-xs font-semibold text-gray-500 uppercase tracking-widest truncate">{label}</span>
            <AnimatePresence>
              {badge && (
                <motion.span
                  key={badge.text}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className={`shrink-0 inline-flex items-center font-body text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.cls}`}
                >
                  {badge.text}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          {yana && (
            <button
              type="button"
              onClick={() => setYanaOpen(true)}
              className="shrink-0 flex items-center gap-1 font-body text-[10px] font-semibold px-2.5 py-1 rounded-full text-gray-400 hover:text-blush-500 hover:bg-blush-50 transition-colors"
              title="Ask Yana to improve this"
            >
              ✨ <span className="hidden sm:inline">Ask Yana</span>
            </button>
          )}
        </div>

        {rows ? (
          <textarea
            rows={rows}
            value={value ?? ''}
            onChange={onChange}
            data-yana-field={yanaField}
            placeholder={placeholder}
            className={`${fieldCls} resize-none`}
          />
        ) : (
          <input
            type={type}
            value={value ?? ''}
            onChange={onChange}
            data-yana-field={yanaField}
            placeholder={placeholder}
            className={fieldCls}
          />
        )}
      </div>

      <AnimatePresence>
        {yana && yanaOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeYana}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.25 }}
              className={`bg-white rounded-3xl shadow-2xl w-full ${modalWidth} ${modalHeight} flex flex-col overflow-hidden`}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-br from-blush-50 to-blush-100 px-7 pt-6 pb-5 shrink-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">✨</span>
                      <p className="font-body text-[10px] font-semibold uppercase tracking-widest text-blush-400">Ask Yana</p>
                      <span className="inline-flex items-center font-body text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/70 text-gray-400 border border-white/60">
                        {modelLabel}
                      </span>
                    </div>
                    <h3 className="font-display text-2xl font-light text-gray-800 leading-tight">{label}</h3>
                  </div>
                  <button onClick={closeYana} className="shrink-0 w-8 h-8 rounded-full bg-white/60 hover:bg-white/90 flex items-center justify-center text-gray-500 transition-colors">
                    <FiX size={15} />
                  </button>
                </div>
              </div>

              {/* ── Large paragraph: 2-column layout ── */}
              {isLarge ? (
                <div className="flex flex-1 min-h-0 overflow-hidden divide-x divide-gray-100">
                  <div className="flex flex-col w-2/5 shrink-0 px-7 py-6 min-h-0">
                    <p className="font-body text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2 shrink-0">Current text</p>
                    <div className="flex-1 min-h-0 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 overflow-y-auto">
                      <p className="font-body text-sm text-gray-500 leading-relaxed whitespace-pre-wrap">
                        {(value ?? '').trim() || <span className="italic text-gray-300">Nothing written yet</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col flex-1 min-w-0 px-7 py-6 gap-4 min-h-0">
                    <div className="shrink-0">
                      <p className="font-body text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">How should Yana improve this?</p>
                      <div className="flex gap-2">
                        <input
                          value={instruction}
                          onChange={e => setInstruction(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && !generating && !isTyping) generate(); }}
                          autoFocus
                          placeholder="e.g. Make it more confident and results-focused…"
                          className="flex-1 font-body text-sm border border-gray-200 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blush-200 focus:border-transparent transition-all"
                        />
                        <button type="button" onClick={generate} disabled={generating || isTyping}
                          className="shrink-0 bg-blush-500 hover:bg-blush-600 text-white font-body text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2">
                          {generating ? (<><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Working…</>) : 'Generate'}
                        </button>
                      </div>
                      {genError && (
                        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="font-body text-xs text-red-500 mt-2">{genError}</motion.p>
                      )}
                    </div>

                    <AnimatePresence>
                      {(editedSuggestion || isTyping) ? (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                          className="flex flex-col flex-1 min-h-0 gap-2">
                          <div className="flex items-center justify-between shrink-0">
                            <p className="font-body text-[10px] font-semibold uppercase tracking-widest text-blush-400">
                              {isTyping ? 'Writing…' : 'Suggestion — edit if needed'}
                            </p>
                            <div className="flex items-center gap-2">
                              <AnimatePresence>
                                {justFinished && (
                                  <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                                    className="inline-flex items-center gap-1 font-body text-[10px] font-semibold text-green-600 bg-green-50 border border-green-200 px-2.5 py-0.5 rounded-full">
                                    ✓ Ready to edit
                                  </motion.span>
                                )}
                              </AnimatePresence>
                              {isTyping && (
                                <button type="button" onClick={skipTyping} className="font-body text-[10px] text-blush-400 hover:text-blush-600 transition-colors">Skip →</button>
                              )}
                            </div>
                          </div>
                          <textarea value={editedSuggestion} onChange={e => { if (!isTyping) setEdited(e.target.value); }} readOnly={isTyping}
                            className={`flex-1 min-h-0 w-full font-body text-sm rounded-2xl px-4 py-3 resize-none transition-all duration-300 focus:outline-none ${textareaCls}`} />
                          {!isTyping && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex gap-3 justify-end shrink-0">
                              <button type="button" onClick={closeYana} className="font-body text-sm text-gray-400 hover:text-gray-600 px-4 py-2 rounded-xl transition-colors">Cancel</button>
                              <button type="button" onClick={handleApply} className="bg-blush-500 hover:bg-blush-600 text-white font-body text-sm font-semibold px-6 py-2 rounded-xl transition-colors shadow-sm">Apply to field</button>
                            </motion.div>
                          )}
                        </motion.div>
                      ) : !generating && (
                        <div className="flex-1 flex items-center justify-center">
                          <p className="font-body text-sm text-gray-300 text-center leading-relaxed">Type your instruction above<br />and click Generate</p>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

              ) : (
                /* ── Small / medium: single-column scrollable ── */
                <div className="px-7 py-6 space-y-5 overflow-y-auto flex-1">
                  {(value ?? '').trim() && (
                    <div>
                      <p className="font-body text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Current text</p>
                      <div className={`bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 ${previewMaxH} overflow-y-auto`}>
                        <p className="font-body text-sm text-gray-500 leading-relaxed whitespace-pre-wrap">{value}</p>
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="font-body text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">How should Yana improve this?</p>
                    <div className="flex gap-2">
                      <input value={instruction} onChange={e => setInstruction(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !generating && !isTyping) generate(); }}
                        autoFocus placeholder="e.g. Make it more confident and results-focused…"
                        className="flex-1 font-body text-sm border border-gray-200 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blush-200 focus:border-transparent transition-all" />
                      <button type="button" onClick={generate} disabled={generating || isTyping}
                        className="shrink-0 bg-blush-500 hover:bg-blush-600 text-white font-body text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2">
                        {generating ? (<><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Working…</>) : 'Generate'}
                      </button>
                    </div>
                  </div>
                  {genError && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="font-body text-xs text-red-500">{genError}</motion.p>
                  )}
                  <AnimatePresence>
                    {(editedSuggestion || isTyping) && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-body text-[10px] font-semibold uppercase tracking-widest text-blush-400">
                            {isTyping ? 'Writing…' : 'Suggestion — edit if needed'}
                          </p>
                          <div className="flex items-center gap-2">
                            <AnimatePresence>
                              {justFinished && (
                                <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                                  className="inline-flex items-center gap-1 font-body text-[10px] font-semibold text-green-600 bg-green-50 border border-green-200 px-2.5 py-0.5 rounded-full">
                                  ✓ Ready to edit
                                </motion.span>
                              )}
                            </AnimatePresence>
                            {isTyping && (
                              <button type="button" onClick={skipTyping} className="font-body text-[10px] text-blush-400 hover:text-blush-600 transition-colors">Skip →</button>
                            )}
                          </div>
                        </div>
                        <textarea rows={suggRows} value={editedSuggestion} onChange={e => { if (!isTyping) setEdited(e.target.value); }} readOnly={isTyping}
                          className={`w-full font-body text-sm rounded-xl px-4 py-3 resize-none transition-all duration-300 focus:outline-none ${textareaCls}`} />
                        {!isTyping && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex gap-3 justify-end pt-2">
                            <button type="button" onClick={closeYana} className="font-body text-sm text-gray-400 hover:text-gray-600 px-4 py-2 rounded-xl transition-colors">Cancel</button>
                            <button type="button" onClick={handleApply} className="bg-blush-500 hover:bg-blush-600 text-white font-body text-sm font-semibold px-6 py-2 rounded-xl transition-colors shadow-sm">Apply to field</button>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
