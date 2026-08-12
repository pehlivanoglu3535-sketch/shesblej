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

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

export default function GoogleTranslate({ siteLang }: { siteLang: string }) {
  useEffect(() => {
    if (document.getElementById('google-translate-script')) return;

    const browserLang = navigator.language.slice(0, 2);
    const existingCookie = getCookie('googtrans');
    if (!existingCookie && SUPPORTED.includes(browserLang) && browserLang !== siteLang) {
      document.cookie = `googtrans=/auto/${browserLang};path=/`;
    }

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
  }, [siteLang]);

  return <div id="google_translate_element" style={{ position: 'absolute', top: '-9999px', left: '-9999px' }} />;
}
