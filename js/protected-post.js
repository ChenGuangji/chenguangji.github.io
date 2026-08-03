(() => {
  'use strict';

  const gate = document.getElementById('protected-post-gate');
  const content = document.getElementById('protected-post-content');

  if (!gate || !content) return;

  const form = gate.querySelector('form');
  const input = gate.querySelector('input[type="password"]');
  const button = gate.querySelector('button[type="submit"]');
  const message = document.getElementById('protected-post-message');
  const expectedHash = gate.dataset.passwordHash || '';
  const storageKey = `protected-post:${window.location.pathname}:${expectedHash.slice(0, 16)}`;

  const unlock = () => {
    gate.hidden = true;
    content.hidden = false;
    document.documentElement.classList.add('protected-post-unlocked');
  };

  try {
    if (window.localStorage.getItem(storageKey) === 'unlocked') {
      unlock();
      return;
    }
  } catch (_) {
    // Continue without persistent browser storage.
  }

  const sha256 = async (value) => {
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error('Web Crypto is unavailable');
    }

    const data = new TextEncoder().encode(value);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.textContent = '';
    button.disabled = true;
    button.textContent = '正在验证…';

    try {
      const submittedHash = await sha256(input.value);
      if (submittedHash !== expectedHash) {
        input.value = '';
        input.focus();
        message.textContent = '密码不正确，请重新输入。';
        return;
      }

      try {
        window.localStorage.setItem(storageKey, 'unlocked');
      } catch (_) {
        // Unlock for this page view even when storage is unavailable.
      }

      input.value = '';
      unlock();
      content.setAttribute('tabindex', '-1');
      content.focus({ preventScroll: true });
    } catch (_) {
      message.textContent = '当前浏览器无法完成密码验证，请使用较新的浏览器。';
    } finally {
      button.disabled = false;
      button.textContent = '打开文章';
    }
  });

  window.requestAnimationFrame(() => input.focus());
})();
