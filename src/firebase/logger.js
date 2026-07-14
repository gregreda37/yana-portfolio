import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

// One session ID per page load — groups all events from a single browser session
const SESSION_ID = Math.random().toString(36).slice(2, 10);

let currentUid = null;

// Called from AuthContext when the auth state changes
export function setLoggerUid(uid) {
  currentUid = uid;
}

// Rate limiting — avoid log floods (max 30 writes per minute per session)
const _written = [];
function underRateLimit() {
  const now = Date.now();
  _written.push(now);
  const recent = _written.filter(t => now - t < 60_000);
  _written.splice(0, _written.length, ...recent);
  return recent.length <= 30;
}

function sanitize(obj) {
  if (!obj || typeof obj !== 'object') return {};
  try {
    return JSON.parse(JSON.stringify(obj, (_, v) => {
      if (typeof v === 'function') return '[function]';
      if (typeof v === 'string' && v.length > 300) return v.slice(0, 300) + '…';
      return v;
    }));
  } catch {
    return {};
  }
}

async function write(type, level, message, data = {}) {
  if (!currentUid) return;
  if (level !== 'error' && !underRateLimit()) return; // errors always get through
  try {
    await addDoc(collection(db, 'users', currentUid, 'logs'), {
      type,
      level,
      message: String(message).slice(0, 400),
      data: sanitize(data),
      url: window.location.pathname,
      sessionId: SESSION_ID,
      timestamp: serverTimestamp(),
    });
  } catch {
    // Never throw from the logger
  }
}

export const logger = {
  /** Generic info-level event (user actions, navigation, saves) */
  event: (name, data)  => write('event', 'info', name, data),
  /** Warning — unexpected but non-fatal state */
  warn:  (message, data) => write('event', 'warn', message, data),
  /** Error — caught exception or failed operation */
  error: (message, data) => write('error', 'error', message, data),
  /** Performance timing — pass a label and duration in milliseconds */
  perf:  (label, ms, data) => write('perf', 'info', label, { durationMs: Math.round(ms), ...data }),
};

/**
 * Call once at app startup (App.jsx).
 * Registers window.onerror and unhandledrejection so JS crashes are captured.
 */
export function initGlobalErrorHandlers() {
  window.addEventListener('error', (e) => {
    logger.error(e.message || 'Uncaught error', {
      filename: e.filename,
      line: e.lineno,
      col: e.colno,
      stack: e.error?.stack?.slice(0, 600) ?? '',
    });
  });

  window.addEventListener('unhandledrejection', (e) => {
    logger.error('Unhandled promise rejection', {
      reason: String(e.reason).slice(0, 300),
      stack: e.reason?.stack?.slice(0, 600) ?? '',
    });
  });
}
