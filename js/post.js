(function () {
  function initialiseHighlighting() {
    if (window.hljs && typeof window.hljs.initHighlighting === 'function') {
      window.hljs.initHighlighting();
    }
  }

  function initialiseImages() {
    if (window.$claudia && typeof window.$claudia.fadeInImage === 'function') {
      window.$claudia.fadeInImage(document.querySelectorAll('.article-content img'));
    }
  }

  function initialiseTocHighlight() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.article-toc .toc a'));
    if (!links.length) return;

    var headings = links.map(function (link) {
      var hash = decodeURI(link.hash || '').replace(/^#/, '');
      return hash ? document.getElementById(hash) : null;
    });

    function updateActiveLink() {
      var activeIndex = -1;
      var threshold = window.pageYOffset + 140;

      headings.forEach(function (heading, index) {
        if (heading && heading.offsetTop <= threshold) activeIndex = index;
      });

      links.forEach(function (link, index) {
        link.classList.toggle('is-active', index === activeIndex);
      });
    }

    window.addEventListener('scroll', updateActiveLink, { passive: true });
    updateActiveLink();
  }

  function initialiseValine() {
    var el = document.getElementById('vcomments');
    if (!el || !window.Valine) return;

    new window.Valine({
      el: '#vcomments',
      appId: el.dataset.comment_valine_id,
      appKey: el.dataset.comment_valine_key
    });
  }

  initialiseHighlighting();
  initialiseImages();
  initialiseTocHighlight();
  initialiseValine();
})();
