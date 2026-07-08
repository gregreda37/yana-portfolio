import { useState, useRef, useCallback } from 'react';
import { FiVideo, FiUploadCloud, FiCheck, FiTrash2, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import { useData } from '../contexts/DataContext';
import { uploadVideo, deleteStorageFile } from '../firebase/storage';

const MAX_BYTES = 500 * 1024 * 1024; // 500 MB
const ACCEPT = 'video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo';

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function EditVideo({ onToast }) {
  const { video, uid, saveSection } = useData();
  const [title, setTitle] = useState(video?.title ?? '');
  const [description, setDescription] = useState(video?.description ?? '');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [localFile, setLocalFile] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const hasVideo = !!video?.url;

  const validateAndStage = (file) => {
    setError('');
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setError('Please select a video file (MP4, MOV, WebM, etc.)');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`File is too large (${formatBytes(file.size)}). Maximum size is 500 MB.`);
      return;
    }
    setLocalFile(file);
  };

  const handleFileChange = (e) => validateAndStage(e.target.files?.[0]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    validateAndStage(e.dataTransfer.files?.[0]);
  }, []);

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  const handleUpload = async () => {
    if (!localFile || !uid) return;
    setUploading(true);
    setProgress(0);
    setError('');
    try {
      const { url, storagePath } = await uploadVideo(uid, localFile, setProgress);
      await saveSection('video', { url, storagePath, title: title.trim(), description: description.trim() });
      setLocalFile(null);
      onToast('Video uploaded!');
    } catch (e) {
      setError('Upload failed — check your connection and try again.');
      console.error(e);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleSaveMeta = async () => {
    setSaving(true);
    try {
      await saveSection('video', { ...video, title: title.trim(), description: description.trim() });
      onToast('Video details saved!');
    } catch {
      onToast('Save failed — check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm('Remove your intro video? This cannot be undone.')) return;
    try {
      await deleteStorageFile(video?.storagePath);
      await saveSection('video', { url: '', storagePath: '', title: '', description: '' });
      setTitle('');
      setDescription('');
      setLocalFile(null);
      onToast('Video removed.');
    } catch {
      onToast('Remove failed — try again.');
    }
  };

  return (
    <div>
      <h2 className="admin-section-title">Intro Video</h2>
      <p className="admin-section-desc">
        Upload a personal intro video. When set, a "Watch My Story" button appears on your hero — visitors get a dedicated video page with your key details alongside it.
      </p>

      <div className="mt-6 space-y-5">

        {/* ── Current video preview ── */}
        {hasVideo && !localFile && (
          <div className="admin-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiCheck className="text-green-500" size={15} />
                <p className="font-body text-sm font-semibold text-gray-700">Video uploaded</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="admin-btn-sm flex items-center gap-1.5"
                >
                  <FiRefreshCw size={12} /> Replace
                </button>
                <button
                  onClick={handleRemove}
                  className="admin-btn-sm text-red-500 flex items-center gap-1.5"
                >
                  <FiTrash2 size={12} /> Remove
                </button>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden bg-gray-900 aspect-video">
              <video
                src={video.url}
                controls
                className="w-full h-full"
                preload="metadata"
              />
            </div>
          </div>
        )}

        {/* ── Drop zone (shown when no video or when replacing) ── */}
        {(!hasVideo || localFile) && !uploading && (
          <div
            className={`relative rounded-2xl border-2 border-dashed transition-colors cursor-pointer ${
              dragOver
                ? 'border-accent-400 bg-accent-50'
                : localFile
                ? 'border-accent-300 bg-accent-50/50'
                : 'border-gray-200 bg-gray-50 hover:border-accent-300 hover:bg-accent-50/50'
            }`}
            onClick={() => !localFile && fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={handleFileChange}
            />

            {localFile ? (
              /* Staged file ready to upload */
              <div className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-accent-100 rounded-2xl flex items-center justify-center shrink-0">
                  <FiVideo className="text-accent-500" size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-body text-sm font-semibold text-gray-800 truncate">{localFile.name}</p>
                  <p className="font-body text-xs text-gray-400 mt-0.5">{formatBytes(localFile.size)}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setLocalFile(null); setError(''); }}
                  className="font-body text-xs text-gray-400 hover:text-red-400 transition-colors shrink-0"
                >
                  Clear
                </button>
              </div>
            ) : (
              /* Empty drop zone */
              <div className="py-14 px-6 text-center">
                <div className="w-14 h-14 bg-accent-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FiUploadCloud className="text-accent-400" size={24} />
                </div>
                <p className="font-body text-sm font-semibold text-gray-700 mb-1">
                  Drag & drop your video here
                </p>
                <p className="font-body text-xs text-gray-400 mb-4">
                  or click to browse your files
                </p>
                <p className="font-body text-[11px] text-gray-300">
                  MP4, MOV, WebM, AVI · Max 500 MB
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Upload progress ── */}
        {uploading && (
          <div className="admin-card space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-body text-sm font-semibold text-gray-700">Uploading…</p>
              <p className="font-body text-sm font-semibold text-accent-500">{progress}%</p>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent-400 to-accent-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="font-body text-xs text-gray-400">
              Large videos may take a minute. Please keep this tab open.
            </p>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <FiAlertCircle className="text-red-400 shrink-0 mt-0.5" size={14} />
            <p className="font-body text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* ── Title & description ── */}
        <div className="admin-card space-y-4">
          <div>
            <label className="admin-label">
              Video Title <span className="text-gray-300 font-normal">(optional)</span>
            </label>
            <input
              className="admin-input"
              placeholder='e.g. "A little bit about me"'
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="admin-label">
              Short Description <span className="text-gray-300 font-normal">(optional)</span>
            </label>
            <textarea
              rows={3}
              className="admin-input resize-none"
              placeholder="Give visitors a quick sense of what the video covers..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── Action buttons ── */}
      <div className="mt-6 flex items-center gap-3 flex-wrap">
        {localFile && !uploading && (
          <button
            onClick={handleUpload}
            disabled={!!error}
            className="btn-primary flex items-center gap-2 disabled:opacity-60"
          >
            <FiUploadCloud size={14} />
            Upload Video
          </button>
        )}
        {hasVideo && !localFile && (
          <button
            onClick={handleSaveMeta}
            disabled={saving}
            className="btn-primary disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Details'}
          </button>
        )}
      </div>

      {/* ── Status hint ── */}
      {hasVideo && !localFile && (
        <div className="mt-4 bg-green-50 border border-green-100 rounded-2xl px-4 py-3 flex items-center gap-3">
          <FiCheck className="text-green-500 shrink-0" size={15} />
          <p className="font-body text-xs text-green-700">
            A "Watch My Story" button is live on your hero, linking to your dedicated video page.
          </p>
        </div>
      )}
      {!hasVideo && !localFile && (
        <div className="mt-4 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3">
          <p className="font-body text-xs text-gray-400">
            No video uploaded yet. The hero button and video page will appear once you upload one.
          </p>
        </div>
      )}
    </div>
  );
}
