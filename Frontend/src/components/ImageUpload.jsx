import { useState, useRef, useCallback } from 'react';
import { useCloudinaryUpload } from '../hooks/useCloudinaryUpload';

/**
 * Reusable image upload component with drag-and-drop, local preview,
 * spinner during upload, and error messaging.
 *
 * @param {'banner' | 'item'} variant - 'banner' = wide 16:9, 'item' = square 1:1
 * @param {string}  [value]           - Current Cloudinary URL (for edit mode)
 * @param {string}  [folder]          - Cloudinary folder (e.g. 'blitzbite/shops')
 * @param {(url: string) => void} onUpload - Callback with final Cloudinary URL
 * @param {() => void} [onRemove]     - Callback when image is removed
 */
export default function ImageUpload({ variant = 'item', value, folder, onUpload, onRemove }) {
  const { upload, uploading, error, reset } = useCloudinaryUpload(folder);
  const [preview, setPreview] = useState(value || null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const isBanner = variant === 'banner';

  /* ── Handle file selection ──────────────────────────────── */
  const processFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    reset();

    // Instant local preview
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    try {
      const url = await upload(file);
      setPreview(url);
      onUpload?.(url);
    } catch {
      // Error is already in hook state; revert preview
      setPreview(value || null);
    }
  }, [upload, reset, onUpload, value]);

  /* ── Drag events ────────────────────────────────────────── */
  const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); };
  const handleDragOver  = (e) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) processFile(file);
  };

  /* ── Click / input change ───────────────────────────────── */
  const handleClick = () => { if (!uploading) inputRef.current?.click(); };
  const handleChange = (e) => { processFile(e.target.files?.[0]); e.target.value = ''; };

  /* ── Remove ─────────────────────────────────────────────── */
  const handleRemove = (e) => {
    e.stopPropagation();
    setPreview(null);
    reset();
    onRemove?.();
    onUpload?.('');
  };

  /* ── Aspect ratio classes ───────────────────────────────── */
  const aspectClass = isBanner ? 'aspect-[16/9]' : 'aspect-square';
  const maxSizeClass = isBanner ? 'max-w-full' : 'w-40';

  return (
    <div className={`relative ${maxSizeClass}`}>
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />

      {/* Drop zone */}
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative overflow-hidden rounded-2xl cursor-pointer transition-all
          ${aspectClass}
          ${preview
            ? 'border-2 border-outline-variant/30'
            : dragActive
              ? 'border-2 border-dashed border-primary bg-primary/5'
              : 'border-2 border-dashed border-outline-variant/40 bg-surface-container hover:border-primary/60 hover:bg-primary/5'
          }
        `}
      >
        {/* Preview image */}
        {preview && (
          <img
            src={preview}
            alt="Upload preview"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Spinner overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-on-surface/40 flex items-center justify-center z-10 backdrop-blur-[2px]">
            <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Placeholder content (when no preview) */}
        {!preview && !uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4">
            <span className="material-symbols-outlined text-3xl text-on-surface-variant/40 select-none">
              {isBanner ? 'panorama' : 'add_photo_alternate'}
            </span>
            <p className="text-[10px] font-bold text-on-surface-variant/50 text-center leading-tight">
              {dragActive
                ? 'Drop image here'
                : isBanner
                  ? 'Drag & drop banner image or click to browse'
                  : 'Drag & drop or click'
              }
            </p>
          </div>
        )}

        {/* Remove button (when image is set and not uploading) */}
        {preview && !uploading && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-on-surface/60 hover:bg-on-surface/80 flex items-center justify-center transition-all z-10 cursor-pointer"
            title="Remove image"
          >
            <span className="material-symbols-outlined text-sm text-white select-none">close</span>
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-2 p-2.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-700 text-[10px] font-semibold flex items-center gap-1.5">
          <span className="material-symbols-outlined text-xs">warning</span>
          {error}
        </div>
      )}
    </div>
  );
}
