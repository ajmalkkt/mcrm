import { useEffect } from 'react';

export const useScreenProtection = (enabled = true) => {
  useEffect(() => {
    if (!enabled) return undefined;

    const preventDefault = (event: Event) => {
      event.preventDefault();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const blockedKeys = ['PrintScreen', 'MetaLeft', 'MetaRight', 'ControlLeft', 'ControlRight'];
      const isCopyShortcut = (event.ctrlKey || event.metaKey) && ['c', 'C', 's', 'S', 'p', 'P', 'x', 'X'].includes(event.key);
      if (blockedKeys.includes(event.key) || isCopyShortcut) {
        event.preventDefault();
      }
    };

    document.addEventListener('contextmenu', preventDefault, { passive: false });
    document.addEventListener('copy', preventDefault, { passive: false });
    document.addEventListener('cut', preventDefault, { passive: false });
    document.addEventListener('paste', preventDefault, { passive: false });
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('dragstart', preventDefault, { passive: false });
    document.addEventListener('selectstart', preventDefault, { passive: false });

    return () => {
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('copy', preventDefault);
      document.removeEventListener('cut', preventDefault);
      document.removeEventListener('paste', preventDefault);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('dragstart', preventDefault);
      document.removeEventListener('selectstart', preventDefault);
    };
  }, [enabled]);
};
