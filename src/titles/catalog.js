import { validateTitle } from './region.js';

const metaModules = import.meta.glob('../../titles/*/meta.json', {
  eager: true,
  import: 'default',
});

const templateModules = import.meta.glob('../../titles/*/template/story.css', {
  eager: true,
  query: '?raw',
  import: 'default',
});

function slugFrom(path, suffix) {
  const match = path.match(new RegExp(`titles/([^/]+)/${suffix}$`));
  return match?.[1] ?? null;
}

export function listTitleSlugs() {
  return Object.keys(metaModules)
    .map((path) => slugFrom(path, 'meta\\.json'))
    .filter(Boolean)
    .sort();
}

/**
 * Load one title package by folder slug.
 * With no slug, open the only package, or the first slug in alphabetical order.
 */
export function loadTitle(slug = defaultSlug()) {
  const metaEntry = Object.entries(metaModules).find(([path]) => slugFrom(path, 'meta\\.json') === slug);
  if (!metaEntry) {
    const known = listTitleSlugs().join(', ') || '(none)';
    throw new Error(`Unknown title "${slug}". Known titles: ${known}`);
  }

  const templateEntry = Object.entries(templateModules).find(
    ([path]) => slugFrom(path, 'template/story\\.css') === slug,
  );
  if (!templateEntry) {
    throw new Error(`Title "${slug}" is missing template/story.css`);
  }

  const title = {
    ...metaEntry[1],
    templateCss: templateEntry[1],
  };
  validateTitle(title);
  if (title.slug !== slug) {
    throw new Error(`Title folder "${slug}" does not match meta slug "${title.slug}"`);
  }
  return title;
}

function defaultSlug() {
  const slugs = listTitleSlugs();
  if (slugs.length === 0) throw new Error('No title packages found');
  return slugs[0];
}
