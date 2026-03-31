import { normalizeBookmarkUrl } from './bookmarkTransfer';

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
  work: {
    iconKey: 'Briefcase',
    color: 'blue',
    order: 0,
    title: { zh: '工作台', en: 'Workbench' },
    subtitle: { zh: '项目、文档与常用工具', en: 'Projects, docs and tools' },
  },
  personal: {
    iconKey: 'UserIcon',
    color: 'violet',
    order: 1,
    title: { zh: '个人空间', en: 'Personal Space' },
    subtitle: { zh: '灵感、收藏与私人链接', en: 'Inspiration and private links' },
  },
  archive: {
    iconKey: 'Archive',
    color: 'slate',
    order: 2,
    title: { zh: '回收站', en: 'Archive' },
    subtitle: { zh: '最近归档的内容', en: 'Recently archived items' },
  },
  anime: {
    iconKey: 'Play',
    color: 'blue',
    order: 3,
    title: { zh: '在线动漫', en: 'Anime Portal' },
    subtitle: { zh: '追番与资料入口', en: 'Streaming and archive portals' },
  },
  illustration: {
    iconKey: 'Palette',
    color: 'violet',
    order: 4,
    title: { zh: '插画灵感', en: 'Illustration' },
    subtitle: { zh: '作品集与视觉参考', en: 'Portfolios and visual inspiration' },
  },
  search: {
    iconKey: 'ImageIcon',
    color: 'emerald',
    order: 5,
    title: { zh: '识图检索', en: 'Discovery' },
    subtitle: { zh: '以图搜图与素材发现', en: 'Image search and discovery' },
  },
  community: {
    iconKey: 'MessageSquare',
    color: 'slate',
    order: 6,
    title: { zh: '社区讨论', en: 'Community' },
    subtitle: { zh: '论坛与创作者社区', en: 'Forums and creator spaces' },
  },
  tools: {
    iconKey: 'Wrench',
    color: 'blue',
    order: 7,
    title: { zh: '效率工具', en: 'Toolbelt' },
    subtitle: { zh: 'AI 与生产力入口', en: 'AI and productivity nodes' },
  },
} as const;

export const TRANSLATIONS = {
  zh: {
    dashboard: '仪表盘',
    favorites: '收藏夹',
    personal: '个人',
    archive: '回收站',
    settings: '设置',
    commandPlaceholder: '搜索命令、书签或分类...',
    searchPlaceholder: '筛选当前内容...',
    welcome: '欢迎回来',
    subtitle: '一个把灵感、日常工具和书签整理到同一空间里的指挥台。',
    quickActions: '快捷操作',
    addBookmark: '添加书签',
    addBookmarkDesc: '保存一个常用站点、资料或工具入口。',
    switchTheme: '切换主题',
    switchThemeDesc: '在夜间模式和白天模式之间切换。',
    toggleLanguage: '切换语言',
    openSettings: '打开设置',
    featured: '精选',
    pinned: '固定资源',
    collections: '分类收藏',
    recentBookmarks: '最近书签',
    viewAll: '查看全部',
    noResults: '没有匹配结果',
    noBookmarks: '还没有书签',
    noBookmarksDesc: '先添加一个入口，整个面板就会活起来。',
    archiveDesc: '归档的项目会暂存在这里，你可以恢复或永久删除。',
    emptyArchive: '回收站是空的',
    restore: '恢复',
    deleteForever: '永久删除',
    deleteAll: '清空归档',
    account: '账户',
    appearance: '外观',
    wallpaper: '壁纸',
    uploadImage: '上传图片',
    resetWallpaper: '恢复默认',
    recommendedWallpapers: '推荐壁纸',
    language: '语言',
    darkTheme: '夜间主题',
    lightTheme: '白天主题',
    systemStatus: '系统状态',
    networkLoad: '网络负载',
    processing: '处理负载',
    diagnostics: '展开诊断',
    guest: '访客模式',
    guestDesc: '未登录也可以先本地使用，之后再同步到你的账户。',
    signIn: '使用 Google 登录',
    signOut: '退出登录',
    personalSpace: '个人空间',
    personalDesc: '查看你的统计数据、常用分类和个性化设置。',
    yourCollections: '你的收藏区',
    activeDays: '活跃天数',
    totalAssets: '总书签数',
    favoritesCount: '已收藏',
    categoryCount: '分类数',
    submit: '保存',
    title: '标题',
    url: '链接',
    description: '描述',
    tag: '标签',
    category: '分类',
    cancel: '取消',
    commandPalette: '命令面板',
    jumpTo: '快速跳转',
    commandEmpty: '没有匹配的动作或书签',
    grid: '网格',
    list: '列表',
    support: '帮助',
    syncState: '同步状态',
    synced: '已同步',
    localOnly: '本地模式',
    addHint: '按 Enter 快速保存',
    dashboardHeroTag: 'OBSIDIAN COMMAND',
    sectionCategory: '分类',
    preview: '预览',
    lastSync: '最后同步',
    statsActiveHint: '当前可用的全部书签',
    statsFavoriteHint: '已标记为优先项',
    statsCategoryHint: '当前可浏览的分区',
    statsDaysHint: '根据最近使用估算',
    paletteLanguageDesc: '在中文和英文之间切换界面文案。',
    paletteSettingsDesc: '管理主题、壁纸、语言和账户。',
    bookmarkTitlePlaceholder: 'Pixiv / GitHub / Notion',
    bookmarkUrlPlaceholder: 'https://...',
    bookmarkDescriptionPlaceholder: '写一句说明，帮助你记住这个入口为什么重要',
    bookmarkTagPlaceholder: '设计 / 开发 / 资料',
    themeDarkDesc: '夜间模式参考 stitch 的 Obsidian 风格整理。',
    themeLightDesc: '白天模式保留原有亮色基调，只修正布局和切换体验。',
    wallpaperPlaceholder: 'https://...',
    interfaceQuickActions: '快捷切换',
    interfaceQuickActionsDesc: '手机端也可以直接在这里切换语言和主题。',
    currentLanguage: '当前语言',
    currentTheme: '当前主题',
    lastSyncValueSynced: '2 分钟前',
    lastSyncValueOffline: '离线',
    loadingAuth: '正在加载登录状态...',
    languageLabelZh: '中文',
    languageLabelEn: '英文',
    themeLabelDark: '夜间',
    themeLabelLight: '白天',
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
    subtitle: 'A command center that keeps inspiration, daily tools, and bookmarks in one place.',
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
    statsActiveHint: 'All active bookmarks',
    statsFavoriteHint: 'Marked as priority',
    statsCategoryHint: 'Available sections',
    statsDaysHint: 'Estimated from usage',
    paletteLanguageDesc: 'Switch interface copy between Chinese and English.',
    paletteSettingsDesc: 'Manage theme, wallpaper, language, and account.',
    bookmarkTitlePlaceholder: 'Pixiv / GitHub / Notion',
    bookmarkUrlPlaceholder: 'https://...',
    bookmarkDescriptionPlaceholder: 'Add a short note explaining why this bookmark matters',
    bookmarkTagPlaceholder: 'Design / Dev / Research',
    themeDarkDesc: 'Dark mode is aligned to the stitch Obsidian reference.',
    themeLightDesc: 'Light mode keeps the existing bright direction and only fixes layout and switching.',
    wallpaperPlaceholder: 'https://...',
    interfaceQuickActions: 'Quick Toggles',
    interfaceQuickActionsDesc: 'Theme and language are available here on mobile too.',
    currentLanguage: 'Current Language',
    currentTheme: 'Current Theme',
    lastSyncValueSynced: '2 min ago',
    lastSyncValueOffline: 'Offline',
    loadingAuth: 'Loading auth...',
    languageLabelZh: 'Chinese',
    languageLabelEn: 'English',
    themeLabelDark: 'Dark',
    themeLabelLight: 'Light',
  },
} as const;

const DEFAULT_BOOKMARKS: Record<string, BookmarkRecord[]> = {
  work: [
    {
      id: 'work-figma',
      title: 'Figma',
      url: 'https://www.figma.com',
      description: 'UI, prototypes, and design systems',
      icon: '',
      tag: 'Design',
      categoryId: 'work',
      isFavorite: true,
      isArchived: false,
      createdAt: Date.now() - 1000 * 60 * 8,
    },
    {
      id: 'work-notion',
      title: 'Notion',
      url: 'https://www.notion.so',
      description: 'Project boards, docs, and notes',
      icon: '',
      tag: 'Docs',
      categoryId: 'work',
      isFavorite: false,
      isArchived: false,
      createdAt: Date.now() - 1000 * 60 * 120,
    },
  ],
  personal: [
    {
      id: 'personal-youtube',
      title: 'YouTube',
      url: 'https://www.youtube.com',
      description: 'Watch later, learning, and inspiration',
      icon: '',
      tag: 'Media',
      categoryId: 'personal',
      isFavorite: true,
      isArchived: false,
      createdAt: Date.now() - 1000 * 60 * 30,
    },
  ],
  anime: [
    {
      id: 'anime-bilibili',
      title: 'Bilibili',
      url: 'https://www.bilibili.com',
      description: 'Streaming, creators, and anime updates',
      icon: '',
      tag: 'Hot',
      categoryId: 'anime',
      isFavorite: false,
      isArchived: false,
      createdAt: Date.now() - 1000 * 60 * 180,
    },
    {
      id: 'anime-bangumi',
      title: 'Bangumi',
      url: 'https://bgm.tv',
      description: 'Anime database and progress tracking',
      icon: '',
      tag: 'Wiki',
      categoryId: 'anime',
      isFavorite: false,
      isArchived: false,
      createdAt: Date.now() - 1000 * 60 * 220,
    },
  ],
  illustration: [
    {
      id: 'illustration-pixiv',
      title: 'Pixiv',
      url: 'https://www.pixiv.net',
      description: 'Illustration trends and collections',
      icon: '',
      tag: 'Art',
      categoryId: 'illustration',
      isFavorite: true,
      isArchived: false,
      createdAt: Date.now() - 1000 * 60 * 260,
    },
    {
      id: 'illustration-artstation',
      title: 'ArtStation',
      url: 'https://www.artstation.com',
      description: 'Portfolios and visual references',
      icon: '',
      tag: 'Portfolio',
      categoryId: 'illustration',
      isFavorite: false,
      isArchived: false,
      createdAt: Date.now() - 1000 * 60 * 320,
    },
  ],
  search: [
    {
      id: 'search-saucenao',
      title: 'SauceNAO',
      url: 'https://saucenao.com',
      description: 'Reverse image search and source lookup',
      icon: '',
      tag: 'Search',
      categoryId: 'search',
      isFavorite: false,
      isArchived: false,
      createdAt: Date.now() - 1000 * 60 * 400,
    },
  ],
  community: [
    {
      id: 'community-nga',
      title: 'NGA',
      url: 'https://nga.178.com',
      description: 'Forums and community discussions',
      icon: '',
      tag: 'Forum',
      categoryId: 'community',
      isFavorite: false,
      isArchived: false,
      createdAt: Date.now() - 1000 * 60 * 520,
    },
  ],
  tools: [
    {
      id: 'tools-github',
      title: 'GitHub',
      url: 'https://github.com',
      description: 'Repositories, PRs, and automation',
      icon: '',
      tag: 'Dev',
      categoryId: 'tools',
      isFavorite: false,
      isArchived: false,
      createdAt: Date.now() - 1000 * 60 * 640,
    },
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
  const url = normalizeBookmarkUrl(bookmark.url || '') || 'https://example.com/';
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
