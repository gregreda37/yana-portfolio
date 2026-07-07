// Splits text on URLs and returns an array of strings and <a> elements.
// Use separate regexes: g-flag for split (capturing group inserts matches into array),
// non-g for test (avoids stateful lastIndex bug).
const SPLIT_RE = /(https?:\/\/[^\s<>"']+)/g;
const TEST_RE  = /^https?:\/\//;

export function linkify(text, linkClassName = '') {
  if (!text) return null;
  const parts = String(text).split(SPLIT_RE);
  return parts.map((part, i) =>
    TEST_RE.test(part)
      ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" className={linkClassName} onClick={e => e.stopPropagation()}>{part}</a>
      : part
  );
}
