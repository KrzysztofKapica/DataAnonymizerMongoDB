import { useState, useCallback } from 'react';

export function useDirectoryPicker() {
  const [handle, setHandle] = useState(null);
  const [error, setError] = useState(null);

  const pick = useCallback(async () => {
    setError(null);
    if (!('showDirectoryPicker' in window)) {
      setError('Directory picker not supported (needs Chromium + https/localhost).');
      return null;
    }
    try {
      const h = await window.showDirectoryPicker();
      // optional: request write permission up front
      if (h.requestPermission) {
        await h.requestPermission({ mode: 'readwrite' });
      }
      setHandle(h);
      return h;
    } catch (e) {
      if (e?.name !== 'AbortError') setError(e.message || 'Directory selection failed.');
      return null;
    }
  }, []);

  return { handle, pick, setHandle, error };
}
