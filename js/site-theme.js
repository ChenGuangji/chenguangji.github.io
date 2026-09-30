(() => {
  'use strict';

  const root = document.documentElement;
  const toggle = document.querySelector('[data-theme-toggle]');
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  const storageKey = 'academic-site-theme';

  const getStoredTheme = () => {
    try {
      const value = window.localStorage.getItem(storageKey);
      return value === 'light' || value === 'dark' ? value : null;
    } catch (_) {
      return null;
    }
  };

  const systemTheme = () => (
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  );

  const applyTheme = (theme, persist = false) => {
    const nextTheme = theme === 'dark' ? 'dark' : 'light';
    root.dataset.theme = nextTheme;
    root.classList.remove('appearance-light', 'appearance-dark');
    root.classList.add(`appearance-${nextTheme}`);

    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', nextTheme === 'dark' ? '#111111' : '#ffffff');
    }

    if (toggle) {
      toggle.setAttribute('aria-pressed', nextTheme === 'dark' ? 'true' : 'false');
      toggle.setAttribute(
        'aria-label',
        nextTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
      );
      toggle.dataset.activeTheme = nextTheme;
    }

    if (persist) {
      try {
        window.localStorage.setItem(storageKey, nextTheme);
      } catch (_) {
        // Theme still works for this page view when storage is unavailable.
      }
    }
  };

  applyTheme(root.dataset.theme || getStoredTheme() || systemTheme(), false);

  if (toggle) {
    toggle.addEventListener('click', () => {
      applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true);
    });
  }

  if (window.matchMedia) {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener?.('change', (event) => {
      if (!getStoredTheme()) applyTheme(event.matches ? 'dark' : 'light', false);
    });
  }
})();
