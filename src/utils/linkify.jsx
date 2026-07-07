// Splits text on URLs and returns an array of strings and <a> elements.
const URL_RE = /(https?:\/\/[^\s<>"']+)/g;

export function linkify(text, linkClassName = '') {
  if (!text) return null;
  const parts = String(text).split(URL_RE);
  return parts.map((part, i) =>
    URL_RE.test(part)
      ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" className={linkClassName} onClick={e => e.stopPropagation()}>{part}</a>
      : part
  );
}
