import type { User as FirebaseUser } from 'firebase/auth';
import type { FieldValue } from 'firebase/firestore';
import {
  buildFavicon,
  resolveCategorySubtitle,
  resolveCategoryTitle,
  type BookmarkRecord,
  type CategoryColor,
  type CategoryRecord,
  type Lang,
  type Theme,
} from './appData';

export interface UserProfileDocument {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: 'user' | 'admin';
  createdAt?: FieldValue;
}

export interface CategoryDocument {
  id: string;
  uid: string;
  title: string;
  subtitle: string;
  iconKey: string;
  color: CategoryColor;
  order: number;
}

export interface BookmarkDocument {
  id: string;
  uid: string;
  categoryId: string;
  title: string;
  url: string;
  description: string;
  icon: string;
  tag: string;
  isFavorite: boolean;
  isArchived: boolean;
  createdAt?: FieldValue | number | string | FirestoreTimestampLike | null;
}

export interface PreferencesDocument {
  lang: Lang;
  theme: Theme;
  wallpaper: string | null;
  updatedAt?: FieldValue;
}

export interface UserPreferences {
  lang: Lang;
  theme: Theme;
  wallpaper: string | null;
}

interface FirestoreTimestampLike {
  seconds?: number;
  nanoseconds?: number;
  toMillis?: () => number;
}

const VALID_LANGS = new Set<Lang>(['zh', 'en']);
const VALID_THEMES = new Set<Theme>(['dark', 'light']);
const VALID_CATEGORY_COLORS = new Set<CategoryColor>(['blue', 'violet', 'emerald', 'slate']);

export function buildUserProfileDocument(user: FirebaseUser): UserProfileDocument {
  return {
    uid: user.uid,
    email: user.email ?? '',
    displayName: user.displayName ?? null,
    photoURL: user.photoURL ?? null,
    role: 'user',
  };
}

export function buildCategoryDocument(category: CategoryRecord, uid: string): CategoryDocument {
  return {
    id: category.id,
    uid,
    title: category.title ?? resolveCategoryTitle(category, 'en'),
    subtitle: category.subtitle ?? resolveCategorySubtitle(category, 'en'),
    iconKey: category.iconKey,
    color: category.color,
    order: category.order,
  };
}

export function normalizeCategoryDocument(
  id: string,
  data: Partial<CategoryDocument>,
  fallback: Pick<CategoryRecord, 'order' | 'iconKey' | 'color'>,
): Omit<CategoryRecord, 'bookmarks'> {
  return {
    id,
    order: typeof data.order === 'number' ? data.order : fallback.order,
    iconKey: typeof data.iconKey === 'string' && data.iconKey.trim() ? data.iconKey : fallback.iconKey,
    color: VALID_CATEGORY_COLORS.has(data.color as CategoryColor) ? (data.color as CategoryColor) : fallback.color,
    title: typeof data.title === 'string' && data.title.trim() ? data.title : undefined,
    subtitle: typeof data.subtitle === 'string' && data.subtitle.trim() ? data.subtitle : undefined,
  };
}

export function buildBookmarkDocument(bookmark: BookmarkRecord, uid: string): BookmarkDocument {
  const title = bookmark.title.trim() || 'Untitled';
  const url = bookmark.url.trim() || '#';

  return {
    id: bookmark.id,
    uid,
    categoryId: bookmark.categoryId.trim() || 'personal',
    title,
    url,
    description: bookmark.description.trim() || 'No description yet.',
    icon: bookmark.icon.trim() || buildFavicon(url, title),
    tag: bookmark.tag.trim() || 'General',
    isFavorite: Boolean(bookmark.isFavorite),
    isArchived: Boolean(bookmark.isArchived),
  };
}

export function normalizeBookmarkDocument(id: string, data: Partial<BookmarkDocument>): BookmarkRecord {
  const title = typeof data.title === 'string' && data.title.trim() ? data.title.trim() : 'Untitled';
  const url = typeof data.url === 'string' && data.url.trim() ? data.url.trim() : '#';

  return {
    id,
    title,
    url,
    description: typeof data.description === 'string' && data.description.trim() ? data.description.trim() : 'No description yet.',
    icon: typeof data.icon === 'string' && data.icon.trim() ? data.icon.trim() : buildFavicon(url, title),
    tag: typeof data.tag === 'string' && data.tag.trim() ? data.tag.trim() : 'General',
    categoryId: typeof data.categoryId === 'string' && data.categoryId.trim() ? data.categoryId.trim() : 'personal',
    isFavorite: Boolean(data.isFavorite),
    isArchived: Boolean(data.isArchived),
    createdAt: toMillis(data.createdAt),
  };
}

export function normalizePreferences(
  data: Partial<PreferencesDocument> | undefined,
  fallback: UserPreferences,
): UserPreferences {
  return {
    lang: VALID_LANGS.has(data?.lang as Lang) ? (data?.lang as Lang) : fallback.lang,
    theme: VALID_THEMES.has(data?.theme as Theme) ? (data?.theme as Theme) : fallback.theme,
    wallpaper: typeof data?.wallpaper === 'string' && data.wallpaper.trim() ? data.wallpaper.trim() : null,
  };
}

export function buildPreferencesDocument(preferences: UserPreferences): PreferencesDocument {
  return {
    lang: preferences.lang,
    theme: preferences.theme,
    wallpaper: preferences.wallpaper,
  };
}

function toMillis(value: BookmarkDocument['createdAt'], fallback = Date.now()): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value >= 1_000_000_000_000) {
      return Math.round(value);
    }

    if (value >= 1_000_000_000 && value < 100_000_000_000) {
      return Math.round(value * 1000);
    }
  }

  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  if (value && typeof value === 'object') {
    const timestampValue = value as FirestoreTimestampLike;

    if (typeof timestampValue.toMillis === 'function') {
      return timestampValue.toMillis();
    }

    if (typeof timestampValue.seconds === 'number') {
      const nanos = typeof timestampValue.nanoseconds === 'number' ? timestampValue.nanoseconds : 0;
      return timestampValue.seconds * 1000 + Math.round(nanos / 1_000_000);
    }
  }

  return fallback;
}
