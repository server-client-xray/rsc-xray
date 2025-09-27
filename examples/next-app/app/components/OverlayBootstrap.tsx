'use client';

import { useEffect } from 'react';

import { scheduleHydrationSnapshot } from '../../lib/hydrationTelemetry';

declare global {
  interface Window {
    __SCX_OVERLAY__?: {
      open: () => void;
      close: () => void;
      toggle: () => void;
      dispose: () => void;
    };
  }
}

const WARNING_MESSAGE =
  'RSC XRay Pro overlay not detected. Install @rsc-xray/pro-overlay and call autoInstallOverlay() to enable the in-app view.';

export function OverlayBootstrap(): JSX.Element | null {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const existing = window.__SCX_OVERLAY__;
    if (existing && typeof existing.toggle === 'function') {
      return;
    }

    const warn = () => console.warn(WARNING_MESSAGE);

    scheduleHydrationSnapshot();
    window.__SCX_OVERLAY__ = {
      open: warn,
      close: warn,
      toggle: warn,
      dispose: warn,
    };
  }, []);

  return null;
}
