'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate: {
        TranslateElement: new (options: { pageLanguage: string; autoDisplay: boolean }, containerId: string) => unknown;
      };
    };
  }
}

const SUPPORTED = ['sq', 'sr', 'tr', 'en', 'de', 'fr', 'it', 'bs', 'el', 'ru'];

// Triggering the translate <select> too early races Next.js's own
// hydration: React's reconciliation wipes Google's injected text nodes
// if translation lands before the page has settled. Firing (and
// re-verifying) after a delay avoids that revert.
const FIRST_TRIGGER_DELAY_MS = 3000;
const VERIFY_DELAY_MS = 3000;

export default function GoogleTranslate({ siteLang }: { siteLang: string }) {
  useEffect(() => {
    const browserLang = navigator.language.slice(0, 2);
    const shouldAutoTranslate = SUPPORTED.includes(browserLang) && browserLang !== siteLang;
    const timers: ReturnType<typeof setTimeout>[] = [];

    function applyTranslation() {
      const select = document.querySelector<HTMLSelectElement>('select.goog-te-combo');
      if (!select) return;
      select.value = browserLang;
      select.dispatchEvent(new Event('change'));
    }

    if (shouldAutoTranslate) {
      timers.push(setTimeout(applyTranslation, FIRST_TRIGGER_DELAY_MS));
      // Re-apply once more in case a late hydration/render reverted the first pass.
      timers.push(setTimeout(applyTranslation, FIRST_TRIGGER_DELAY_MS + VERIFY_DELAY_MS));
    }

    if (!document.getElementById('google-translate-script')) {
      window.googleTranslateElementInit = () => {
        if (window.google) {
          new window.google.translate.TranslateElement(
            { pageLanguage: 'auto', autoDisplay: false },
            'google_translate_element'
          );
        }
      };

      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    }

    return () => timers.forEach(clearTimeout);
  }, [siteLang]);

  return <div id="google_translate_element" style={{ position: 'absolute', top: '-9999px', left: '-9999px' }} />;
}
