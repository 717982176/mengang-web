import type { BookmarkRecord } from './appData';

export interface BookmarkImportCandidate {
  title: string;
  url: string;
  description: string;
  tag: string;
  categoryId: string;
  isFavorite: boolean;
  isArchived: boolean;
}

export interface BookmarkImportResult {
  bookmarks: BookmarkImportCandidate[];
  invalidCount: number;
}

const CATEGORY_ALIASES: Record<string, string> = {
  work: 'work',
  workbench: 'work',
  workspaces: 'work',
  '工作': 'work',
  '工作台': 'work',
  personal: 'personal',
  private: 'personal',
  '个人': 'personal',
  '私人': 'personal',
  archive: 'archive',
  archived: 'archive',
  '回收站': 'archive',
  anime: 'anime',
  '动漫': 'anime',
  '动画': 'anime',
  illustration: 'illustration',
  art: 'illustration',
  '插画': 'illustration',
  discovery: 'search',
  search: 'search',
  '发现': 'search',
  '识图': 'search',
  community: 'community',
  forum: 'community',
  '社区': 'community',
  tools: 'tools',
  toolbelt: 'tools',
  utility: 'tools',
  '工具': 'tools',
};

export function normalizeBookmarkUrl(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  const hasProtocol = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmed);
  const candidate = hasProtocol ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
  } catch {
    return '';
  }

  return '';
}

export function canImportBookmarkUrl(raw: string) {
  return normalizeBookmarkUrl(raw).length > 0;
}

export function createBookmarkFingerprint(bookmark: Pick<BookmarkRecord, 'title' | 'url'> | BookmarkImportCandidate) {
  return `${bookmark.title.trim().toLowerCase()}|${normalizeBookmarkUrl(bookmark.url).replace(/\/$/, '').toLowerCase()}`;
}

export function buildBookmarkExportJson(bookmarks: BookmarkRecord[]) {
  return JSON.stringify(
    bookmarks.map((bookmark) => ({
      title: bookmark.title,
      url: bookmark.url,
      description: bookmark.description,
      tag: bookmark.tag,
      categoryId: bookmark.categoryId,
      isFavorite: bookmark.isFavorite,
      isArchived: bookmark.isArchived,
      createdAt: new Date(bookmark.createdAt).toISOString(),
    })),
    null,
    2,
  );
}

export function parseBookmarkImportText(
  fileName: string,
  text: string,
  knownCategoryIds: string[],
  defaultCategoryId?: string,
): BookmarkImportResult {
  const fallbackCategoryId = defaultCategoryId && knownCategoryIds.includes(defaultCategoryId)
    ? defaultCategoryId
    : knownCategoryIds.includes('personal')
      ? 'personal'
      : knownCategoryIds[0] || 'personal';

  if (fileName.toLowerCase().endsWith('.html') || fileName.toLowerCase().endsWith('.htm')) {
    return parseHtmlImport(text, knownCategoryIds, fallbackCategoryId);
  }

  if (fileName.toLowerCase().endsWith('.json')) {
    return parseJsonImport(text, knownCategoryIds, fallbackCategoryId);
  }

  return parseCsvImport(text, knownCategoryIds, fallbackCategoryId);
}

function parseJsonImport(text: string, knownCategoryIds: string[], defaultCategoryId: string): BookmarkImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('INVALID_JSON');
  }
  const items = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object' && Array.isArray((parsed as { bookmarks?: unknown[] }).bookmarks)
      ? (parsed as { bookmarks: unknown[] }).bookmarks
      : [];

  return normalizeImportEntries(items, knownCategoryIds, defaultCategoryId);
}

function parseCsvImport(text: string, knownCategoryIds: string[], defaultCategoryId: string): BookmarkImportResult {
  const rows = parseCsv(text);
  if (rows.length <= 1) {
    return { bookmarks: [], invalidCount: 0 };
  }

  const headers = rows[0].map((header) => header.trim().toLowerCase());
  const entries = rows.slice(1).map((row) =>
    headers.reduce<Record<string, string>>((accumulator, header, index) => {
      accumulator[header] = row[index] ?? '';
      return accumulator;
    }, {}),
  );

  return normalizeImportEntries(entries, knownCategoryIds, defaultCategoryId);
}

function parseHtmlImport(text: string, knownCategoryIds: string[], defaultCategoryId: string): BookmarkImportResult {
  const parser = new DOMParser();
  const documentNode = parser.parseFromString(text, 'text/html');
  const anchors = Array.from(documentNode.querySelectorAll('a[href]')) as HTMLAnchorElement[];
  const entries = anchors.map((anchor) => {
    const folderLabel = findClosestFolderLabel(anchor);

    return {
      title: anchor.textContent?.trim() || anchor.getAttribute('href') || '',
      url: anchor.getAttribute('href') || '',
      description: anchor.getAttribute('description') || '',
      tag: folderLabel,
      category: folderLabel,
    };
  });

  return normalizeImportEntries(entries, knownCategoryIds, defaultCategoryId);
}

function normalizeImportEntries(
  entries: unknown[],
  knownCategoryIds: string[],
  defaultCategoryId: string,
): BookmarkImportResult {
  const bookmarks: BookmarkImportCandidate[] = [];
  let invalidCount = 0;

  for (const entry of entries) {
    const bookmark = normalizeImportEntry(entry, knownCategoryIds, defaultCategoryId);
    if (!bookmark) {
      invalidCount += 1;
      continue;
    }

    bookmarks.push(bookmark);
  }

  return { bookmarks, invalidCount };
}

function normalizeImportEntry(
  entry: unknown,
  knownCategoryIds: string[],
  defaultCategoryId: string,
): BookmarkImportCandidate | null {
  if (!entry || typeof entry !== 'object') return null;

  const record = entry as Record<string, unknown>;
  const title = readString(record, ['title', 'name']);
  const rawUrl = readString(record, ['url', 'link', 'href']);
  const url = normalizeBookmarkUrl(rawUrl);

  if (!title || !url) return null;

  return {
    title,
    url,
    description: readString(record, ['description', 'summary', 'note']) || '',
    tag: readString(record, ['tag', 'label', 'type']) || readString(record, ['folder']) || 'General',
    categoryId: resolveCategoryId(
      readString(record, ['categoryId', 'category_id', 'category', 'collection', 'group']),
      knownCategoryIds,
      defaultCategoryId,
    ),
    isFavorite: readBoolean(record, ['isFavorite', 'favorite', 'starred']),
    isArchived: readBoolean(record, ['isArchived', 'archived']),
  };
}

function resolveCategoryId(raw: string, knownCategoryIds: string[], defaultCategoryId: string) {
  const normalized = raw.trim().toLowerCase();
  if (normalized && knownCategoryIds.includes(normalized)) {
    return normalized;
  }

  if (normalized && CATEGORY_ALIASES[normalized] && knownCategoryIds.includes(CATEGORY_ALIASES[normalized])) {
    return CATEGORY_ALIASES[normalized];
  }

  return defaultCategoryId;
}

function readString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
}

function readBoolean(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (['1', 'true', 'yes', 'y'].includes(normalized)) return true;
      if (['0', 'false', 'no', 'n'].includes(normalized)) return false;
    }
  }

  return false;
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentValue = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (quoted && next === '"') {
        currentValue += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (!quoted && char === ',') {
      currentRow.push(currentValue.trim());
      currentValue = '';
      continue;
    }

    if (!quoted && (char === '\n' || char === '\r')) {
      if (char === '\r' && next === '\n') {
        index += 1;
      }
      currentRow.push(currentValue.trim());
      if (currentRow.some((cell) => cell.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentValue = '';
      continue;
    }

    currentValue += char;
  }

  currentRow.push(currentValue.trim());
  if (currentRow.some((cell) => cell.length > 0)) {
    rows.push(currentRow);
  }

  return rows;
}

function findClosestFolderLabel(anchor: HTMLAnchorElement) {
  let currentList = anchor.closest('dl');

  while (currentList) {
    let sibling = currentList.previousElementSibling;
    while (sibling) {
      if (/^H[1-6]$/i.test(sibling.tagName)) {
        const label = sibling.textContent?.trim();
        if (label) {
          return label;
        }
      }
      sibling = sibling.previousElementSibling;
    }

    currentList = currentList.parentElement?.closest('dl') ?? null;
  }

  return '';
}
