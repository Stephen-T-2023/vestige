/* ============================================
    _document.js
    Vestige — Ashborne
    Custom document — sets up the base HTML
    structure. The inline script reads the saved
    theme from localStorage before the page renders
    to prevent a flash of the wrong theme.
   ============================================ */

import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        {/* Inline script runs before React hydrates —
            prevents flash of wrong theme on page load */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var theme = localStorage.getItem('vestige-theme');
                if (theme === 'dark') {
                  document.documentElement.setAttribute('data-theme', 'dark');
                }
              } catch(e) {}
            })();
          `
        }} />
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}