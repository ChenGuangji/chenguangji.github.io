(() => {
  'use strict';

  document.querySelectorAll('[data-wedding-video-browser]').forEach((browser) => {
    const mainVideo = browser.querySelector('[data-wedding-main-video]');
    const emptyState = browser.querySelector('[data-wedding-video-empty]');
    const titleNode = browser.querySelector('[data-wedding-video-title]');
    const indexNode = browser.querySelector('[data-wedding-video-index]');
    const track = browser.querySelector('[data-wedding-video-track]');
    const prevButton = browser.querySelector('[data-wedding-video-prev]');
    const nextButton = browser.querySelector('[data-wedding-video-next]');
    const base = browser.dataset.videoBase || '';

    if (!mainVideo || !emptyState || !titleNode || !indexNode || !base) return;

    let videos = [];
    try {
      videos = JSON.parse(browser.dataset.videoFiles || '[]');
    } catch (_) {
      videos = [];
    }

    if (!Array.isArray(videos) || !videos.length) {
      mainVideo.hidden = true;
      emptyState.hidden = false;
      return;
    }

    emptyState.hidden = true;
    mainVideo.hidden = false;

    const cards = [];
    const pickerItems = videos.map((item, videoIndex) => ({
      ...item,
      videoIndex,
      comingSoon: false
    }));
    pickerItems.splice(Math.min(2, pickerItems.length), 0, {
      title: '婚礼现场视频（敬请期待）',
      comingSoon: true,
      videoIndex: null,
      cover: null
    });

    const pad = (value) => String(value).padStart(2, '0');

    const setActiveVideo = (index, autoplay = false) => {
      const item = videos[index];
      if (!item) return;

      mainVideo.pause();

      if (item.cover) {
        mainVideo.poster = base + encodeURIComponent(item.cover);
      } else {
        mainVideo.removeAttribute('poster');
      }

      mainVideo.src = base + encodeURIComponent(item.file);
      mainVideo.setAttribute('aria-label', item.title);
      mainVideo.load();

      titleNode.textContent = item.title;
      indexNode.textContent = pad(index + 1) + ' / ' + pad(videos.length);

      cards.forEach((card) => {
        const active = Number(card.dataset.videoIndex) === index;
        card.classList.toggle('is-active', active);
        card.setAttribute('aria-current', active ? 'true' : 'false');
        card.setAttribute('aria-pressed', active ? 'true' : 'false');
      });

      cards.find((card) => Number(card.dataset.videoIndex) === index)?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });

      if (autoplay) {
        const playPromise = mainVideo.play();
        if (playPromise?.catch) playPromise.catch(() => {});
      }
    };

    if (track) {
      pickerItems.forEach((item) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'wedding-video-choice';

        if (item.comingSoon) {
          card.classList.add('is-coming-soon');
          card.disabled = true;
          card.setAttribute('aria-label', item.title);
        } else {
          card.dataset.videoIndex = String(item.videoIndex);
          card.setAttribute('aria-label', '播放' + item.title);
        }

        const preview = document.createElement('span');
        preview.className = 'wedding-video-choice-preview';

        if (item.cover) {
          const cover = document.createElement('img');
          cover.className = 'wedding-video-choice-cover';
          cover.src = base + encodeURIComponent(item.cover);
          cover.alt = '';
          cover.loading = 'lazy';
          cover.decoding = 'async';
          cover.addEventListener('error', () => {
            cover.remove();
            preview.classList.remove('has-cover');
          }, { once: true });
          preview.classList.add('has-cover');
          preview.append(cover);
        }

        const play = document.createElement('span');
        play.className = item.comingSoon
          ? 'wedding-video-choice-coming'
          : 'wedding-video-choice-play';
        play.setAttribute('aria-hidden', 'true');
        play.textContent = item.comingSoon ? '敬请期待' : '▶';

        const copy = document.createElement('span');
        copy.className = 'wedding-video-choice-copy';

        const label = document.createElement('strong');
        label.textContent = item.title;

        const meta = document.createElement('small');
        meta.textContent = item.comingSoon ? 'Coming soon' : 'Wedding film';

        preview.append(play);
        copy.append(label, meta);
        card.append(preview, copy);

        if (!item.comingSoon) {
          card.addEventListener('click', () => setActiveVideo(item.videoIndex, true));
        }

        cards.push(card);
        track.append(card);
      });
    }

    const updateNavState = () => {
      if (!track || !prevButton || !nextButton) return;

      const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
      prevButton.disabled = track.scrollLeft <= 4;
      nextButton.disabled = track.scrollLeft >= maxScroll - 4;

      const needsScroll = maxScroll > 8;
      prevButton.hidden = !needsScroll;
      nextButton.hidden = !needsScroll;
    };

    const scrollTrack = (direction) => {
      if (!track) return;
      const amount = Math.max(track.clientWidth * 0.78, 260);
      track.scrollBy({
        left: direction * amount,
        behavior: 'smooth'
      });
    };

    prevButton?.addEventListener('click', () => scrollTrack(-1));
    nextButton?.addEventListener('click', () => scrollTrack(1));
    track?.addEventListener('scroll', updateNavState, { passive: true });
    window.addEventListener('resize', updateNavState, { passive: true });

    setActiveVideo(0, false);
    window.requestAnimationFrame(updateNavState);
  });

  document.querySelectorAll('[data-wedding-photo-feed]').forEach((feed) => {
    const stream = feed.querySelector('.wedding-feed-stream');
    const sentinel = feed.querySelector('.wedding-feed-sentinel');
    const base = feed.dataset.photoBase || '';
    const batchSize = 12;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (!stream || !sentinel || !base) return;

    let files = [];
    try {
      files = JSON.parse(feed.dataset.photoFiles || '[]');
    } catch (_) {
      files = [];
    }

    if (!Array.isArray(files) || !files.length) {
      sentinel.classList.add('is-complete');
      sentinel.innerHTML = '<span>Wedding photos coming soon</span>';
      return;
    }

    let nextIndex = 0;
    let loading = false;
    let loadObserver = null;
    let revealObserver = null;
    let columnCount = 0;
    let columns = [];
    const rendered = [];

    const getColumnCount = () => {
      if (window.matchMedia('(max-width: 560px)').matches) return 1;
      if (window.matchMedia('(max-width: 900px)').matches) return 2;
      return 3;
    };

    const createColumns = (count) => {
      columnCount = count;
      stream.replaceChildren();
      stream.style.setProperty('--wedding-columns', String(count));
      columns = Array.from({ length: count }, () => {
        const column = document.createElement('div');
        column.className = 'wedding-feed-column';
        stream.append(column);
        return column;
      });
    };

    const shortestColumn = () => {
      return columns.reduce((shortest, column) => {
        return column.offsetHeight < shortest.offsetHeight ? column : shortest;
      }, columns[0]);
    };

    const reflowForBreakpoint = () => {
      const nextCount = getColumnCount();
      if (nextCount === columnCount) return;

      createColumns(nextCount);

      rendered
        .slice()
        .sort((a, b) => Number(a.dataset.photoOrder) - Number(b.dataset.photoOrder))
        .forEach((figure) => {
          shortestColumn().append(figure);
        });
    };

    const preloadPhoto = (filename, order) => {
      return new Promise((resolve) => {
        const url = base + encodeURIComponent(filename);
        const probe = new Image();

        probe.onload = () => {
          resolve({
            filename,
            order,
            url,
            width: probe.naturalWidth || 1,
            height: probe.naturalHeight || 1
          });
        };

        probe.onerror = () => resolve(null);
        probe.src = url;
      });
    };

    if (!reduceMotion && 'IntersectionObserver' in window) {
      revealObserver = new IntersectionObserver((entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => {
            const vertical = a.boundingClientRect.top - b.boundingClientRect.top;
            if (Math.abs(vertical) > 24) return vertical;
            return a.boundingClientRect.left - b.boundingClientRect.left;
          });

        visibleEntries.forEach((entry, index) => {
          const figure = entry.target;
          figure.style.transitionDelay = Math.min(index * 110, 220) + 'ms';
          figure.classList.add('is-visible');
          revealObserver.unobserve(figure);

          figure.addEventListener('transitionend', () => {
            figure.style.transitionDelay = '';
          }, { once: true });
        });
      }, {
        root: null,
        rootMargin: '90px 0px 70px',
        threshold: 0.08
      });
    }

    const createFigure = (photo) => {
      const figure = document.createElement('figure');
      figure.className = 'wedding-feed-photo';
      figure.dataset.photoOrder = String(photo.order);
      figure.style.aspectRatio = photo.width + ' / ' + photo.height;

      const image = document.createElement('img');
      image.src = photo.url;
      image.alt = 'Wedding portrait';
      image.decoding = 'async';
      image.width = photo.width;
      image.height = photo.height;

      figure.append(image);
      rendered.push(figure);
      shortestColumn().append(figure);

      if (reduceMotion) {
        figure.classList.add('is-visible');
      } else if (revealObserver) {
        revealObserver.observe(figure);
      } else {
        window.setTimeout(() => {
          figure.classList.add('is-visible');
        }, 80);
      }
    };

    const appendBatch = async () => {
      if (loading || nextIndex >= files.length) return;

      loading = true;
      sentinel.classList.add('is-loading');

      const start = nextIndex;
      const end = Math.min(start + batchSize, files.length);
      nextIndex = end;

      const loaded = await Promise.all(
        files.slice(start, end).map((filename, index) => {
          return preloadPhoto(filename, start + index);
        })
      );

      loaded
        .filter(Boolean)
        .sort((a, b) => a.order - b.order)
        .forEach((photo) => createFigure(photo));

      loading = false;
      sentinel.classList.remove('is-loading');

      if (nextIndex >= files.length) {
        sentinel.classList.add('is-complete');
        sentinel.innerHTML = '<span>End of photo diary</span>';
        loadObserver?.disconnect();
      }
    };

    createColumns(getColumnCount());
    appendBatch();

    const desktopColumns = window.matchMedia('(min-width: 901px)');
    const tabletColumns = window.matchMedia('(min-width: 561px) and (max-width: 900px)');
    const mobileColumns = window.matchMedia('(max-width: 560px)');

    [desktopColumns, tabletColumns, mobileColumns].forEach((media) => {
      media.addEventListener?.('change', reflowForBreakpoint);
    });

    if ('IntersectionObserver' in window) {
      loadObserver = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) appendBatch();
      }, {
        root: null,
        rootMargin: '900px 0px',
        threshold: 0
      });

      loadObserver.observe(sentinel);
    } else {
      const onScroll = () => {
        const rect = sentinel.getBoundingClientRect();
        if (rect.top < window.innerHeight + 900) appendBatch();
      };

      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
  });
})();
