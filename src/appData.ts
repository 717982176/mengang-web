export type Lang = 'zh' | 'en';
export type Theme = 'dark' | 'light';
export type ViewMode = 'grid' | 'list';
export type CategoryColor = 'blue' | 'violet' | 'emerald' | 'slate';

export interface BookmarkRecord {
  id: string;
  title: string;
  url: string;
  description: string;
  icon: string;
  tag: string;
  categoryId: string;
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: number;
}

export interface CategoryRecord {
  id: string;
  order: number;
  iconKey: string;
  color: CategoryColor;
  title?: string;
  subtitle?: string;
  bookmarks: BookmarkRecord[];
}

export const STORAGE_KEYS = {
  theme: 'lumina-theme',
  lang: 'lumina-lang',
  wallpaper: 'lumina-wallpaper',
  guestCategories: 'lumina-guest-categories',
} as const;

export const WALLPAPER_PRESETS = [
  'https://picsum.photos/seed/lumina-obsidian-1/1600/900',
  'https://picsum.photos/seed/lumina-obsidian-2/1600/900',
  'https://picsum.photos/seed/lumina-obsidian-3/1600/900',
];

export const CATEGORY_META = {
  work: { iconKey: 'Briefcase', color: 'blue', order: 0, title: { zh: 'Workbench', en: 'Workbench' }, subtitle: { zh: 'Projects, docs and tools', en: 'Projects, docs and tools' } },
  personal: { iconKey: 'UserIcon', color: 'violet', order: 1, title: { zh: 'Personal Space', en: 'Personal Space' }, subtitle: { zh: 'Inspiration and private links', en: 'Inspiration and private links' } },
  archive: { iconKey: 'Archive', color: 'slate', order: 2, title: { zh: 'Archive', en: 'Archive' }, subtitle: { zh: 'Recently archived items', en: 'Recently archived items' } },
  anime: { iconKey: 'Play', color: 'blue', order: 3, title: { zh: 'Anime Portal', en: 'Anime Portal' }, subtitle: { zh: 'Streaming and archive portals', en: 'Streaming and archive portals' } },
  illustration: { iconKey: 'Palette', color: 'violet', order: 4, title: { zh: 'Illustration', en: 'Illustration' }, subtitle: { zh: 'Portfolios and visual inspiration', en: 'Portfolios and visual inspiration' } },
  search: { iconKey: 'ImageIcon', color: 'emerald', order: 5, title: { zh: 'Discovery', en: 'Discovery' }, subtitle: { zh: 'Image search and discovery', en: 'Image search and discovery' } },
  community: { iconKey: 'MessageSquare', color: 'slate', order: 6, title: { zh: 'Community', en: 'Community' }, subtitle: { zh: 'Forums and creator spaces', en: 'Forums and creator spaces' } },
  tools: { iconKey: 'Wrench', color: 'blue', order: 7, title: { zh: 'Toolbelt', en: 'Toolbelt' }, subtitle: { zh: 'AI and productivity nodes', en: 'AI and productivity nodes' } },
} as const;

export const TRANSLATIONS = {
  zh: {
    dashboard: 'Dashboard',
    favorites: 'Favorites',
    personal: 'Personal',
    archive: 'Archive',
    settings: 'Settings',
    commandPlaceholder: 'Search commands, bookmarks, or collections...',
    searchPlaceholder: 'Filter current content...',
    welcome: 'Welcome back',
    subtitle: 'A dark editorial command center that keeps inspiration, daily tools, and bookmarks in one place.',
    quickActions: 'Quick Actions',
    addBookmark: 'Add Bookmark',
    addBookmarkDesc: 'Save a frequently used site, resource, or tool.',
    switchTheme: 'Switch Theme',
    switchThemeDesc: 'Toggle between dark and light workspace modes.',
    toggleLanguage: 'Toggle Language',
    openSettings: 'Open Settings',
    featured: 'Featured',
    pinned: 'Pinned Resources',
    collections: 'Collections',
    recentBookmarks: 'Recent Bookmarks',
    viewAll: 'View All',
    noResults: 'No matches found',
    noBookmarks: 'No bookmarks yet',
    noBookmarksDesc: 'Add your first link and this dashboard starts feeling alive.',
    archiveDesc: 'Archived items stay here until you restore them or delete them permanently.',
    emptyArchive: 'Archive is empty',
    restore: 'Restore',
    deleteForever: 'Delete Permanently',
    deleteAll: 'Clear Archive',
    account: 'Account',
    appearance: 'Appearance',
    wallpaper: 'Wallpaper',
    uploadImage: 'Upload Image',
    resetWallpaper: 'Reset',
    recommendedWallpapers: 'Recommended',
    language: 'Language',
    darkTheme: 'Dark Theme',
    lightTheme: 'Light Theme',
    systemStatus: 'System Status',
    networkLoad: 'Network Load',
    processing: 'Processing',
    diagnostics: 'Expand Diagnostics',
    guest: 'Guest Mode',
    guestDesc: 'You can interact locally first, then sign in later to sync everything.',
    signIn: 'Sign In with Google',
    signOut: 'Sign Out',
    personalSpace: 'Personal Space',
    personalDesc: 'Review your stats, favorite collections, and personalization settings.',
    yourCollections: 'Your Collections',
    activeDays: 'Active Days',
    totalAssets: 'Total Assets',
    favoritesCount: 'Favorites',
    categoryCount: 'Categories',
    submit: 'Save',
    title: 'Title',
    url: 'URL',
    description: 'Description',
    tag: 'Tag',
    category: 'Category',
    cancel: 'Cancel',
    commandPalette: 'Command Palette',
    jumpTo: 'Jump To',
    commandEmpty: 'No matching actions or bookmarks',
    grid: 'Grid',
    list: 'List',
    support: 'Support',
    syncState: 'Sync State',
    synced: 'Synced',
    localOnly: 'Local Only',
    addHint: 'Press Enter to save quickly',
    dashboardHeroTag: 'OBSIDIAN COMMAND',
    sectionCategory: 'Category',
    preview: 'Preview',
    lastSync: 'Last Sync',
  },
  en: {
    dashboard: 'Dashboard',
    favorites: 'Favorites',
    personal: 'Personal',
    archive: 'Archive',
    settings: 'Settings',
    commandPlaceholder: 'Search commands, bookmarks, or collections...',
    searchPlaceholder: 'Filter current content...',
    welcome: 'Welcome back',
    subtitle: 'A dark editorial command center that keeps inspiration, daily tools, and bookmarks in one place.',
    quickActions: 'Quick Actions',
    addBookmark: 'Add Bookmark',
    addBookmarkDesc: 'Save a frequently used site, resource, or tool.',
    switchTheme: 'Switch Theme',
    switchThemeDesc: 'Toggle between dark and light workspace modes.',
    toggleLanguage: 'Toggle Language',
    openSettings: 'Open Settings',
    featured: 'Featured',
    pinned: 'Pinned Resources',
    collections: 'Collections',
    recentBookmarks: 'Recent Bookmarks',
    viewAll: 'View All',
    noResults: 'No matches found',
    noBookmarks: 'No bookmarks yet',
    noBookmarksDesc: 'Add your first link and this dashboard starts feeling alive.',
    archiveDesc: 'Archived items stay here until you restore them or delete them permanently.',
    emptyArchive: 'Archive is empty',
    restore: 'Restore',
    deleteForever: 'Delete Permanently',
    deleteAll: 'Clear Archive',
    account: 'Account',
    appearance: 'Appearance',
    wallpaper: 'Wallpaper',
    uploadImage: 'Upload Image',
    resetWallpaper: 'Reset',
    recommendedWallpapers: 'Recommended',
    language: 'Language',
    darkTheme: 'Dark Theme',
    lightTheme: 'Light Theme',
    systemStatus: 'System Status',
    networkLoad: 'Network Load',
    processing: 'Processing',
    diagnostics: 'Expand Diagnostics',
    guest: 'Guest Mode',
    guestDesc: 'You can interact locally first, then sign in later to sync everything.',
    signIn: 'Sign In with Google',
    signOut: 'Sign Out',
    personalSpace: 'Personal Space',
    personalDesc: 'Review your stats, favorite collections, and personalization settings.',
    yourCollections: 'Your Collections',
    activeDays: 'Active Days',
    totalAssets: 'Total Assets',
    favoritesCount: 'Favorites',
    categoryCount: 'Categories',
    submit: 'Save',
    title: 'Title',
    url: 'URL',
    description: 'Description',
    tag: 'Tag',
    category: 'Category',
    cancel: 'Cancel',
    commandPalette: 'Command Palette',
    jumpTo: 'Jump To',
    commandEmpty: 'No matching actions or bookmarks',
    grid: 'Grid',
    list: 'List',
    support: 'Support',
    syncState: 'Sync State',
    synced: 'Synced',
    localOnly: 'Local Only',
    addHint: 'Press Enter to save quickly',
    dashboardHeroTag: 'OBSIDIAN COMMAND',
    sectionCategory: 'Category',
    preview: 'Preview',
    lastSync: 'Last Sync',
  },
} as const;

const DEFAULT_BOOKMARKS: Record<string, BookmarkRecord[]> = {
  work: [
    { id: 'work-figma', title: 'Figma', url: 'https://www.figma.com', description: 'UI, prototypes, and design systems', icon: '', tag: 'Design', categoryId: 'work', isFavorite: true, isArchived: false, createdAt: Date.now() - 1000 * 60 * 8 },
    { id: 'work-notion', title: 'Notion', url: 'https://www.notion.so', description: 'Project boards, docs, and notes', icon: '', tag: 'Docs', categoryId: 'work', isFavorite: false, isArchived: false, createdAt: Date.now() - 1000 * 60 * 120 },
  ],
  personal: [
    { id: 'personal-youtube', title: 'YouTube', url: 'https://www.youtube.com', description: 'Watch later, learning, and inspiration', icon: '', tag: 'Media', categoryId: 'personal', isFavorite: true, isArchived: false, createdAt: Date.now() - 1000 * 60 * 30 },
  ],
  anime: [
    { id: 'anime-bilibili', title: 'Bilibili', url: 'https://www.bilibili.com', description: 'Streaming, creators, and anime updates', icon: '', tag: 'Hot', categoryId: 'anime', isFavorite: false, isArchived: false, createdAt: Date.now() - 1000 * 60 * 180 },
    { id: 'anime-bangumi', title: 'Bangumi', url: 'https://bgm.tv', description: 'Anime database and progress tracking', icon: '', tag: 'Wiki', categoryId: 'anime', isFavorite: false, isArchived: false, createdAt: Date.now() - 1000 * 60 * 220 },
  ],
  illustration: [
    { id: 'illustration-pixiv', title: 'Pixiv', url: 'https://www.pixiv.net', description: 'Illustration trends and collections', icon: '', tag: 'Art', categoryId: 'illustration', isFavorite: true, isArchived: false, createdAt: Date.now() - 1000 * 60 * 260 },
    { id: 'illustration-artstation', title: 'ArtStation', url: 'https://www.artstation.com', description: 'Portfolios and visual references', icon: '', tag: 'Portfolio', categoryId: 'illustration', isFavorite: false, isArchived: false, createdAt: Date.now() - 1000 * 60 * 320 },
  ],
  search: [
    { id: 'search-saucenao', title: 'SauceNAO', url: 'https://saucenao.com', description: 'Reverse image search and source lookup', icon: '', tag: 'Search', categoryId: 'search', isFavorite: false, isArchived: false, createdAt: Date.now() - 1000 * 60 * 400 },
  ],
  community: [
    { id: 'community-nga', title: 'NGA', url: 'https://nga.178.com', description: 'Forums and community discussions', icon: '', tag: 'Forum', categoryId: 'community', isFavorite: false, isArchived: false, createdAt: Date.now() - 1000 * 60 * 520 },
  ],
  tools: [
    { id: 'tools-github', title: 'GitHub', url: 'https://github.com', description: 'Repositories, PRs, and automation', icon: '', tag: 'Dev', categoryId: 'tools', isFavorite: false, isArchived: false, createdAt: Date.now() - 1000 * 60 * 640 },
  ],
};

export function buildFavicon(url: string, title: string) {
  if (url.startsWith('http')) {
    return `https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent(url)}`;
  }
  const initials = encodeURIComponent(title.slice(0, 2).toUpperCase());
  return `https://ui-avatars.com/api/?name=${initials}&background=0b1326&color=d8e2ff&rounded=true&size=128`;
}

export function normalizeBookmark(bookmark: Partial<BookmarkRecord>): BookmarkRecord {
  const title = bookmark.title?.trim() || 'Untitled';
  const url = bookmark.url?.trim() || '#';
  return {
    id: bookmark.id || crypto.randomUUID(),
    title,
    url,
    description: bookmark.description?.trim() || 'No description yet.',
    icon: bookmark.icon?.trim() || buildFavicon(url, title),
    tag: bookmark.tag?.trim() || 'General',
    categoryId: bookmark.categoryId?.trim() || 'personal',
    isFavorite: Boolean(bookmark.isFavorite),
    isArchived: Boolean(bookmark.isArchived),
    createdAt: Number(bookmark.createdAt) || Date.now(),
  };
}

export function buildDefaultCategories(): CategoryRecord[] {
  return Object.entries(CATEGORY_META)
    .sort(([, left], [, right]) => left.order - right.order)
    .map(([id, meta]) => ({
      id,
      order: meta.order,
      iconKey: meta.iconKey,
      color: meta.color,
      bookmarks: (DEFAULT_BOOKMARKS[id] || []).map((bookmark) => normalizeBookmark(bookmark)),
    }));
}

export function resolveCategoryTitle(category: CategoryRecord, lang: Lang) {
  const meta = CATEGORY_META[category.id as keyof typeof CATEGORY_META];
  return meta?.title[lang] || category.title || category.id;
}

export function resolveCategorySubtitle(category: CategoryRecord, lang: Lang) {
  const meta = CATEGORY_META[category.id as keyof typeof CATEGORY_META];
  return meta?.subtitle[lang] || category.subtitle || '';
}

export function filterBookmarks(bookmarks: BookmarkRecord[], query: string) {
  if (!query) return bookmarks;
  return bookmarks.filter((bookmark) =>
    `${bookmark.title} ${bookmark.description} ${bookmark.tag}`.toLowerCase().includes(query),
  );
}

export function readGuestCategories() {
  const raw = localStorage.getItem(STORAGE_KEYS.guestCategories);
  if (!raw) return buildDefaultCategories();
  try {
    const parsed = JSON.parse(raw) as CategoryRecord[];
    return parsed.map((category) => ({
      ...category,
      bookmarks: (category.bookmarks || []).map((bookmark) => normalizeBookmark(bookmark)),
    }));
  } catch {
    return buildDefaultCategories();
  }
}

export function persistGuestCategories(categories: CategoryRecord[]) {
  localStorage.setItem(STORAGE_KEYS.guestCategories, JSON.stringify(categories));
}
