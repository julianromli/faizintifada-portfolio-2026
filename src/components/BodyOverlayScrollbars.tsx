import { useLayoutEffect } from 'react';
import { OverlayScrollbars } from 'overlayscrollbars';

const bodyOptions = {
  scrollbars: {
    theme: 'os-theme-faiz',
    autoHide: 'scroll' as const,
    autoHideSuspend: true,
  },
};

export function BodyOverlayScrollbars() {
  useLayoutEffect(() => {
    const instance = OverlayScrollbars(document.body, bodyOptions);
    return () => {
      instance.destroy();
    };
  }, []);

  return null;
}
