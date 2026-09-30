(() => {
  'use strict';

  const entries = document.querySelectorAll('.publication-year-group .publication-entry');
  if (!entries.length) return;

  const authorshipLabels = new Set(['First author', 'Co-first author']);

  entries.forEach((entry) => {
    const tagBox = entry.querySelector(':scope > .publication-tags');
    const link = entry.querySelector(':scope > a');
    if (!tagBox || !link) return;

    const authorshipTags = [];
    const metadataTags = [];

    Array.from(tagBox.querySelectorAll(':scope > span')).forEach((tag) => {
      const label = tag.textContent.trim();

      if (label === 'Collaboration') {
        tag.remove();
        return;
      }

      if (authorshipLabels.has(label)) {
        authorshipTags.push(tag);
      } else {
        metadataTags.push(tag);
      }
    });

    tagBox.classList.add('publication-tags-authorship');
    tagBox.replaceChildren(...authorshipTags);
    if (!authorshipTags.length) tagBox.hidden = true;

    const actions = document.createElement('div');
    actions.className = 'publication-entry-actions';

    if (metadataTags.length) {
      const metadataBox = document.createElement('div');
      metadataBox.className = 'publication-tags publication-tags-meta';
      metadataBox.append(...metadataTags);
      actions.append(metadataBox);
    }

    actions.append(link);
    entry.append(actions);
    entry.classList.add('publication-entry-tags-organized');
  });
})();
