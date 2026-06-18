import { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiX, FiSend, FiCheck, FiCopy, FiRefreshCw, FiUpload, FiArrowRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { analyzeSection, streamChat, SECTION_LABELS } from '../utils/openai';

// ── Sub-components ────────────────────────────────────────────────────────────

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5 h-4">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-blush-300 block"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.65, repeat: Infinity, delay: i * 0.13, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

function YanaAvatar() {
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blush-400 to-lavender-400 flex items-center justify-center shrink-0 shadow-sm">
      <span className="text-white text-xs font-bold font-display">Y</span>
    </div>
  );
}

// Profile fields that can be written directly to Firestore
const PROFILE_FIELDS = new Set([
  'firstName', 'lastName', 'title', 'bio1', 'bio2',
  'location', 'email', 'linkedin', 'availabilityNote',
]);

function SuggestionCard({ s, section, onApply, onSkip, applied }) {
  const [working, setWorking] = useState(false);
  const [copied, setCopied] = useState(false);

  const isProfileField = section === 'profile' && PROFILE_FIELDS.has(s.field);

  const handleApply = async () => {
    if (working) return;
    setWorking(true);
    await onApply(s); // parent (YanaAssistant → AdminDashboard) decides: typewrite or copy
    setWorking(false);
  };

  const handleCopy = () => {
    if (!s.newValue) return;
    navigator.clipboard.writeText(s.newValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={`rounded-2xl border p-4 ${
        applied ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100 shadow-sm'
      }`}
    >
      <div className="flex gap-3">
        <span className="text-lg shrink-0 mt-0.5">{s.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className={`font-body text-sm font-semibold mb-1 ${applied ? 'text-green-700' : 'text-gray-800'}`}>
            {s.title}
          </p>
          <p className="font-body text-xs text-gray-500 leading-relaxed mb-3">{s.reason}</p>

          {s.newValue && !applied && (
            <div className="bg-blush-50/70 border border-blush-100 rounded-xl p-3 mb-3">
              <p className="font-body text-[10px] text-blush-400 uppercase tracking-widest mb-1.5">
                {isProfileField ? 'Suggested text' : 'Suggestion'}
              </p>
              <p className="font-body text-xs text-gray-700 leading-relaxed line-clamp-4">{s.newValue}</p>
            </div>
          )}

          {applied ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1.5 text-green-600"
            >
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <FiCheck size={9} strokeWidth={3} className="text-white" />
              </div>
              <span className="font-body text-xs font-semibold">
                {isProfileField ? 'Applied to your profile!' : 'Copied to clipboard!'}
              </span>
            </motion.div>
          ) : (
            <div className="flex items-center gap-2">
              {s.newValue && (
                <button
                  onClick={handleApply}
                  disabled={working}
                  className="inline-flex items-center gap-1.5 font-body text-xs font-semibold text-white bg-blush-500 hover:bg-blush-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {working ? (
                    <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FiCheck size={11} strokeWidth={2.5} />
                  )}
                  {isProfileField ? 'Apply' : 'Copy'}
                </button>
              )}
              {s.newValue && !isProfileField && (
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 font-body text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-1.5"
                >
                  {copied ? <FiCheck size={11} className="text-green-500" /> : <FiCopy size={11} />}
                  {copied ? 'Copied!' : 'Copy text'}
                </button>
              )}
              <button
                onClick={() => onSkip(s.id)}
                className="font-body text-xs text-gray-300 hover:text-gray-500 transition-colors ml-auto"
              >
                Skip
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export default function YanaAssistant({ open, onClose, section, analysisKey, onApply }) {
  const dataCtx  = useData();
  const navigate = useNavigate();
  const sectionData = dataCtx[section];
  const sectionLabel = SECTION_LABELS[section] ?? section;

  // Analysis state
  const [analyzing,     setAnalyzing]     = useState(false);
  const [analysisMsg,   setAnalysisMsg]   = useState('');
  const [suggestions,   setSuggestions]   = useState([]);
  const [appliedIds,    setAppliedIds]    = useState(new Set());
  const [skippedIds,    setSkippedIds]    = useState(new Set());
  const [analysisError, setAnalysisError] = useState('');

  // Chat state
  const [chatInput,      setChatInput]      = useState('');
  const [apiMessages,    setApiMessages]    = useState([]); // OpenAI format
  const [displayMsgs,    setDisplayMsgs]    = useState([]); // { id, role, content }
  const [isStreaming,    setIsStreaming]    = useState(false);
  const [streamText,     setStreamText]     = useState('');
  const [chatError,      setChatError]      = useState('');

  const scrollEl = useRef(null);
  const inputEl  = useRef(null);

  const scrollBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollEl.current) scrollEl.current.scrollTop = scrollEl.current.scrollHeight;
    }, 80);
  }, []);

  // Re-analyze when explicitly triggered (open toggle or user nav change via analysisKey).
  // analysisKey is NOT bumped when AdminDashboard switches sections for typewrite, so this won't reset mid-apply.
  useEffect(() => {
    if (open && section && sectionData) doAnalysis();
  }, [open, analysisKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const doAnalysis = async () => {
    setAnalyzing(true);
    setAnalysisError('');
    setAnalysisMsg('');
    setSuggestions([]);
    setAppliedIds(new Set());
    setSkippedIds(new Set());
    setDisplayMsgs([]);
    setApiMessages([]);
    setStreamText('');
    setChatError('');

    try {
      const result = await analyzeSection(section, sectionData);
      const msg  = result.analysis ?? 'Here are some suggestions for your section.';
      const sugs = result.suggestions ?? [];
      setAnalysisMsg(msg);
      setSuggestions(sugs);
      // Seed API history so follow-up chat inherits context
      setApiMessages([{
        role: 'assistant',
        content: msg + '\n\nSuggestions: ' + sugs.map(s => `${s.title} — ${s.reason}`).join('; '),
      }]);
      scrollBottom();
    } catch (err) {
      setAnalysisError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApply = async (suggestion) => {
    if (!suggestion.newValue) return;
    await onApply?.(suggestion); // AdminDashboard: typewrite for profile fields, clipboard for others
    setAppliedIds(prev => new Set([...prev, suggestion.id]));
  };

  const handleSkip = (id) => setSkippedIds(prev => new Set([...prev, id]));

  const sendMessage = async () => {
    const text = chatInput.trim();
    if (!text || isStreaming || analyzing) return;

    setChatInput('');
    setChatError('');

    const userEntry = { id: Date.now(), role: 'user', content: text };
    setDisplayMsgs(prev => [...prev, userEntry]);

    const newApiMsgs = [...apiMessages, { role: 'user', content: text }];
    setApiMessages(newApiMsgs);

    setIsStreaming(true);
    setStreamText('');
    scrollBottom();

    await streamChat({
      messages:     newApiMsgs,
      sectionLabel,
      sectionData,
      onChunk: (acc) => { setStreamText(acc); scrollBottom(); },
      onComplete: (final) => {
        const yanaEntry = { id: Date.now() + 1, role: 'yana', content: final };
        setDisplayMsgs(prev => [...prev, yanaEntry]);
        setApiMessages(prev => [...prev, { role: 'assistant', content: final }]);
        setStreamText('');
        setIsStreaming(false);
        scrollBottom();
        inputEl.current?.focus();
      },
      onError: (msg) => { setChatError(msg); setIsStreaming(false); },
    });
  };

  const allReviewed = suggestions.length > 0 &&
    suggestions.every(s => appliedIds.has(s.id) || skippedIds.has(s.id));
  const hasAnalysis = !analyzing && !analysisError && analysisMsg;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Mobile backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/20 md:hidden"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed right-0 top-14 bottom-0 w-full sm:w-[390px] z-50 flex flex-col bg-white border-l border-gray-100 shadow-2xl"
          >
            {/* ── Header ── */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-white shrink-0">
              <YanaAvatar />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-body text-sm font-semibold text-gray-800">Yana AI</p>
                  <span className="inline-flex items-center gap-1.5 bg-blush-50 border border-blush-100 rounded-full px-2.5 py-0.5">
                    <span className="w-1.5 h-1.5 bg-blush-400 rounded-full animate-pulse" />
                    <span className="font-body text-[10px] text-blush-500 font-medium">{sectionLabel}</span>
                  </span>
                </div>
                <p className="font-body text-[11px] text-gray-400 mt-0.5">Your portfolio coach</p>
              </div>
              <button
                onClick={doAnalysis}
                disabled={analyzing}
                title="Re-analyze this section"
                className="p-2 text-gray-300 hover:text-blush-400 transition-colors disabled:opacity-30 rounded-lg hover:bg-blush-50"
              >
                <FiRefreshCw size={14} className={analyzing ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-300 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-50"
              >
                <FiX size={16} />
              </button>
            </div>

            {/* ── Messages ── */}
            <div ref={scrollEl} className="flex-1 overflow-y-auto p-4 space-y-4">

              {/* Analyzing state */}
              {analyzing && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3"
                >
                  <YanaAvatar />
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-none px-4 py-3">
                    <p className="font-body text-xs text-gray-400 mb-2">
                      Reviewing your {sectionLabel.toLowerCase()}…
                    </p>
                    <ThinkingDots />
                  </div>
                </motion.div>
              )}

              {/* Analysis error */}
              {analysisError && !analyzing && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl bg-red-50 border border-red-100 p-5 text-center"
                >
                  <p className="font-body text-xs text-red-500 mb-3 leading-relaxed">{analysisError}</p>
                  <button
                    onClick={doAnalysis}
                    className="font-body text-xs font-semibold text-red-500 border border-red-200 rounded-xl px-4 py-2 hover:bg-red-50 bg-white transition-colors"
                  >
                    Try again
                  </button>
                </motion.div>
              )}

              {/* Analysis message */}
              {hasAnalysis && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="flex items-start gap-3"
                >
                  <YanaAvatar />
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-none px-4 py-3 max-w-[290px]">
                    <p className="font-body text-sm text-gray-700 leading-relaxed">{analysisMsg}</p>
                  </div>
                </motion.div>
              )}

              {/* Suggestion cards */}
              {hasAnalysis && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="ml-11 space-y-2.5"
                >
                  <AnimatePresence>
                    {suggestions
                      .filter(s => !skippedIds.has(s.id))
                      .map((s, i) => (
                        <motion.div
                          key={s.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.08 }}
                        >
                          <SuggestionCard
                            s={s}
                            section={section}
                            onApply={handleApply}
                            onSkip={handleSkip}
                            applied={appliedIds.has(s.id)}
                          />
                        </motion.div>
                      ))}
                  </AnimatePresence>

                  {allReviewed && (
                    <motion.p
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="font-body text-xs text-center text-gray-400 py-3"
                    >
                      All suggestions reviewed ✨ Ask me anything below.
                    </motion.p>
                  )}
                </motion.div>
              )}

              {/* Chat messages */}
              {displayMsgs.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'items-start gap-3'}`}
                >
                  {msg.role === 'yana' && <YanaAvatar />}
                  <div className={`px-4 py-3 rounded-2xl max-w-[290px] ${
                    msg.role === 'user'
                      ? 'bg-blush-500 text-white rounded-tr-none'
                      : 'bg-gray-50 border border-gray-100 text-gray-700 rounded-tl-none'
                  }`}>
                    <p className="font-body text-sm leading-relaxed">{msg.content}</p>
                  </div>
                </motion.div>
              ))}

              {/* Streaming response */}
              {isStreaming && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3"
                >
                  <YanaAvatar />
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-none px-4 py-3 max-w-[290px]">
                    {streamText ? (
                      <p className="font-body text-sm text-gray-700 leading-relaxed">
                        {streamText}
                        <span className="inline-block w-0.5 h-3.5 bg-blush-400 ml-0.5 animate-pulse align-middle rounded-full" />
                      </p>
                    ) : (
                      <ThinkingDots />
                    )}
                  </div>
                </motion.div>
              )}

              {/* Chat error */}
              {chatError && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-body text-xs text-red-400 text-center"
                >
                  {chatError}
                </motion.p>
              )}

              <div className="h-1" />
            </div>

            {/* ── Import Resume shortcut ── */}
            <div className="px-4 pb-3 shrink-0">
              <button
                onClick={() => { onClose(); navigate('/admin/import'); }}
                className="w-full flex items-center gap-2.5 bg-blush-50 hover:bg-blush-100 border border-blush-100 rounded-xl px-4 py-2.5 transition-colors"
              >
                <FiUpload size={13} className="text-blush-400 shrink-0" />
                <span className="font-body text-xs text-blush-600 font-medium">Import Resume with AI</span>
                <FiArrowRight size={12} className="text-blush-300 ml-auto shrink-0" />
              </button>
            </div>

            {/* ── Input ── */}
            <div className="px-4 py-3 border-t border-gray-100 shrink-0 bg-white">
              <form
                onSubmit={e => { e.preventDefault(); sendMessage(); }}
                className="flex items-center gap-2.5 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2.5 focus-within:border-blush-200 transition-colors"
              >
                <input
                  ref={inputEl}
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder={
                    analyzing
                      ? 'Yana is thinking…'
                      : `Ask about your ${sectionLabel.toLowerCase()}…`
                  }
                  disabled={analyzing || isStreaming}
                  className="flex-1 bg-transparent font-body text-sm text-gray-800 placeholder:text-gray-300 outline-none disabled:opacity-50"
                />
                <motion.button
                  type="submit"
                  disabled={!chatInput.trim() || analyzing || isStreaming}
                  whileTap={{ scale: 0.88 }}
                  className="w-7 h-7 rounded-full bg-blush-500 hover:bg-blush-600 text-white flex items-center justify-center transition-colors disabled:opacity-30 shrink-0"
                >
                  <FiSend size={12} />
                </motion.button>
              </form>
              <p className="font-body text-[10px] text-gray-300 text-center mt-2">
                Powered by OpenAI · Suggestions may need review
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
