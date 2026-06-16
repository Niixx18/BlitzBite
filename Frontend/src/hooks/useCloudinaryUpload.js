import { useState, useCallback } from 'react';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

/**
 * Custom hook for unsigned Cloudinary image uploads.
 * Uses raw fetch — no Cloudinary SDK.
 *
 * @param {string} [folder] - Optional Cloudinary folder (e.g. 'blitzbite/shops')
 * @returns {{ upload, uploading, error, reset }}
 */
export const useCloudinaryUpload = (folder) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const reset = useCallback(() => {
    setError(null);
    setUploading(false);
  }, []);

  const upload = useCallback(async (file) => {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      const msg = 'Cloudinary env vars missing. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.';
      setError(msg);
      throw new Error(msg);
    }

    setUploading(true);
    setError(null);

    try {
      const body = new FormData();
      body.append('file', file);
      body.append('upload_preset', UPLOAD_PRESET);
      if (folder) body.append('folder', folder);

      const res = await fetch(UPLOAD_URL, { method: 'POST', body });
      const data = await res.json();

      if (!res.ok) {
        const msg = data?.error?.message || 'Image upload failed';
        setError(msg);
        throw new Error(msg);
      }

      return data.secure_url;
    } catch (err) {
      const msg = err.message || 'Image upload failed';
      setError(msg);
      throw err;
    } finally {
      setUploading(false);
    }
  }, [folder]);

  return { upload, uploading, error, reset };
};
