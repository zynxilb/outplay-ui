"use client";

import { useServerInsertedHTML } from "next/navigation";

const SCRIPT = `
  (function() {
    try {
      if (sessionStorage.getItem('outplay_visited')) {
        document.documentElement.classList.add('splash-skip');
      }
    } catch (e) {}
  })();
`;

export function SplashSkipScript() {
  useServerInsertedHTML(() => (
    <script
      id="splash-skip-script"
      dangerouslySetInnerHTML={{ __html: SCRIPT }}
    />
  ));

  return null;
}
