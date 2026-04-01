/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Archive,
  Briefcase,
  ChevronDown,
  Command,
  ExternalLink,
  Languages,
  LayoutGrid,
  Loader2,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Pencil,
  Plus,
  Search,
  Settings,
  Sparkles,
  Star,
  Sun,
  Trash2,
  User as UserIcon,
  WandSparkles,
  X,
  Zap,
} from 'lucide-react';
import { type User as FirebaseUser } from 'firebase/auth';
import { signIn } from './firebase';
import {
  buildDefaultCategories,
  buildFavicon,
  filterBookmarks,
  formatRelativeTime,
  resolveCategorySubtitle,
  resolveCategoryTitle,
  TRANSLATIONS,
  WALLPAPER_PRESETS,
  type BookmarkRecord,
  type CategoryRecord,
  type ViewMode,
} from './appData';
import {
  ArchiveGrid,
  BookmarkSection,
  CategoryCard,
  DesktopNavItem,
  ErrorBoundary,
  MetricCard,
  ViewSwitch,
} from './appComponents';
import { usePreferences } from './hooks/usePreferences';
import { useAuth } from './hooks/useAuth';
import { useCloudSync } from './hooks/useCloudSync';
import { useBookmarkActions } from './hooks/useBookmarkActions';
import { useCommandPalette } from './hooks/useCommandPalette';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMac, setIsMac] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryRecord[]>(buildDefaultCategories);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const nonArchivedBookmarksRef = useRef<BookmarkRecord[]>([]);
  // userRef lets usePreferences read the current user without a prop that creates
  // a circular dependency (usePreferences needs user, useAuth needs preferencesRef).
  const userRef = useRef<FirebaseUser | null>(null);

  // ─── Preferences hook ──────────────────────────────────────────────────────
  const {
    lang,
    setLang,
    theme,
    setTheme,
    wallpaper,
    setWallpaper,
    wallpaperInput,
    setWallpaperInput,
    preferencesRef,
    toggleLang,
    toggleTheme,
    applyWallpaper,
    resetWallpaper,
    handleWallpaperUpload,
    setThemePreference,
  } = usePreferences({
    userRef,
    setNotice,
    setSyncError,
    setLastSyncAt,
  });

  // ─── Auth hook ─────────────────────────────────────────────────────────────
  const {
    user,
    isAuthReady,
    isBootstrapDone,
    authError,
    isSigningOut,
    handleSignIn,
    handleSignOut,
  } = useAuth({
    preferencesRef,
    setCategories,
    setNotice,
    setSyncError,
    setLastSyncAt,
    lang,
  });

  // Keep userRef current so usePreferences.persistPreferences always reads the real user
  userRef.current = user;

  // ─── Cloud sync hook ───────────────────────────────────────────────────────
  useCloudSync({
    user,
    isAuthReady,
    isBootstrapDone,
    preferencesRef,
    setLang,
    setTheme,
    setWallpaper,
    setCategories,
    setSyncError,
    setLastSyncAt,
  });

  // Notice auto-dismiss
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  // Detect Mac
  useEffect(() => {
    setIsMac(/mac/i.test(navigator.platform));
  }, []);

  // ─── Derived data ──────────────────────────────────────────────────────────
  const t = TRANSLATIONS[lang];
  const currentLanguageCode = lang.toUpperCase();
  const currentLanguageLabel = lang === 'zh' ? t.languageLabelZh : t.languageLabelEn;
  const currentThemeLabel = theme === 'dark' ? t.themeLabelDark : t.themeLabelLight;
  const createMessage = (zh: string, en: string) => (lang === 'zh' ? zh : en);
  const syncStateLabel = !user
    ? t.localOnly
    : syncError
      ? (lang === 'zh' ? '同步异常' : 'Sync issue')
      : t.synced;
  const lastSyncLabel = !user
    ? t.lastSyncValueOffline
    : syncError
      ? (lang === 'zh' ? '请检查连接或权限' : 'Check connection or permissions')
      : lastSyncAt
        ? formatRelativeTime(lastSyncAt, lang)
        : t.lastSyncValueSynced;
  const authTitle = lang === 'zh' ? '登录后继续使用 Lumina' : 'Sign in to continue with Lumina';
  const authDescription =
    lang === 'zh'
      ? '访客模式已关闭。请使用 Google 登录后再查看、编辑并同步你的书签与设置。'
      : 'Guest mode is disabled. Sign in with Google to view, edit, and sync your bookmarks and settings.';
  const authHint =
    lang === 'zh'
      ? '登录后数据会保存到云端，并在同一账户下自动同步。'
      : 'Your data will be saved to the cloud and synced automatically across the same account.';
  const authButtonLabel = lang === 'zh' ? '使用 Google 登录' : 'Continue with Google';
  const authErrorLabel =
    authError || (lang === 'zh' ? '登录失败，请稍后重试。' : 'Sign-in failed. Please try again.');

  const allBookmarks = useMemo(
    () => categories.flatMap((category) => category.bookmarks),
    [categories],
  );
  const activeCategory = useMemo(
    () => categories.find((category) => category.id === activeTab),
    [categories, activeTab],
  );
  const nonArchivedBookmarks = useMemo(
    () => allBookmarks.filter((bookmark) => !bookmark.isArchived),
    [allBookmarks],
  );
  // Keep a ref so the AI search effect always reads the latest value without re-triggering the debounce
  nonArchivedBookmarksRef.current = nonArchivedBookmarks;
  const favoriteBookmarks = useMemo(
    () => nonArchivedBookmarks.filter((bookmark) => bookmark.isFavorite),
    [nonArchivedBookmarks],
  );
  const archivedBookmarks = useMemo(
    () => allBookmarks.filter((bookmark) => bookmark.isArchived),
    [allBookmarks],
  );
  const featuredBookmarks = useMemo(
    () =>
      Array.from(
        new Map([...favoriteBookmarks, ...nonArchivedBookmarks].map((bookmark) => [bookmark.id, bookmark])).values(),
      ).slice(0, 4),
    [favoriteBookmarks, nonArchivedBookmarks],
  );
  const queryText = searchQuery.trim().toLowerCase();
  const filteredCategories = useMemo(
    () =>
      categories
        .map((category) => ({ ...category, bookmarks: filterBookmarks(category.bookmarks, queryText) }))
        .filter((category) => {
          if (category.bookmarks.length > 0 || !queryText) return true;
          const text = `${resolveCategoryTitle(category, lang)} ${resolveCategorySubtitle(category, lang)}`.toLowerCase();
          return text.includes(queryText);
        }),
    [categories, queryText, lang],
  );

  const displayedBookmarks = useMemo(() => {
    if (activeTab === 'favorites') return filterBookmarks(favoriteBookmarks, queryText);
    if (activeTab === 'archive') return filterBookmarks(archivedBookmarks, queryText);
    if (activeTab === 'dashboard')
      return filterBookmarks([...nonArchivedBookmarks].sort((left, right) => right.createdAt - left.createdAt), queryText);
    return filterBookmarks((activeCategory?.bookmarks || []).filter((bookmark) => !bookmark.isArchived), queryText);
  }, [activeTab, favoriteBookmarks, archivedBookmarks, nonArchivedBookmarks, activeCategory, queryText]);

  const navItems = useMemo(
    () => [
      { id: 'dashboard', label: t.dashboard, icon: LayoutGrid },
      { id: 'favorites', label: t.favorites, icon: Star },
      { id: 'work', label: resolveCategoryTitle(categories.find((item) => item.id === 'work') || buildDefaultCategories()[0], lang), icon: Briefcase },
      { id: 'personal', label: t.personal, icon: UserIcon },
      { id: 'archive', label: t.archive, icon: Archive },
      { id: 'settings', label: t.settings, icon: Settings },
    ],
    [categories, lang, t],
  );

  // ─── Command palette hook ──────────────────────────────────────────────────
  const {
    paletteQuery,
    setPaletteQuery,
    aiSearchResults,
    setAiSearchResults,
    isAiSearching,
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
  } = useCommandPalette({
    searchQuery,
    lang,
    nonArchivedBookmarksRef,
    setIsMobileMenuOpen,
    setIsAddModalOpen,
  });

  // ─── Bookmark actions hook ─────────────────────────────────────────────────
  const {
    isSavingBookmark,
    isImporting,
    isAiFilling,
    newBookmark,
    setNewBookmark,
    editingBookmark,
    setEditingBookmark,
    editForm,
    setEditForm,
    toggleFavorite,
    toggleArchive,
    deleteBookmark,
    handleDeleteArchivedAll,
    openAddModal,
    openEditModal,
    handleSaveEdit,
    handleAddBookmark,
    handleUrlBlur,
    handleImportBookmarks,
    handleExportBookmarks,
  } = useBookmarkActions({
    user,
    categories,
    setCategories,
    allBookmarks,
    archivedBookmarks,
    activeTab,
    lang,
    setNotice,
    setSyncError,
    setLastSyncAt,
    setIsAddModalOpen,
    setIsCommandPaletteOpen,
  });

  const goToTab = (tab: string) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    setIsCommandPaletteOpen(false);
  };

  const stats = useMemo(
    () => [
      {
        label: t.totalAssets,
        value: nonArchivedBookmarks.length,
        hint: t.statsActiveHint,
        icon: LayoutGrid,
      },
      {
        label: t.favoritesCount,
        value: favoriteBookmarks.length,
        hint: t.statsFavoriteHint,
        icon: Star,
      },
      {
        label: t.categoryCount,
        value: categories.filter((category) => category.id !== 'archive').length,
        hint: t.statsCategoryHint,
        icon: Sparkles,
      },
      {
        label: t.activeDays,
        value: (() => {
          if (allBookmarks.length === 0) return 0;
          const earliest = allBookmarks.reduce((min, b) =>
            b.createdAt < min ? b.createdAt : min,
            allBookmarks[0].createdAt,
          );
          const diffMs = Date.now() - new Date(earliest).getTime();
          return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        })(),
        hint: t.statsDaysHint,
        icon: Zap,
      },
    ],
    [allBookmarks, nonArchivedBookmarks, favoriteBookmarks, categories, t],
  );

  const paletteFilter = paletteQuery.trim().toLowerCase();
  const paletteActions = useMemo(
    () =>
      [
        { id: 'add', title: t.addBookmark, subtitle: t.addBookmarkDesc, onSelect: openAddModal },
        { id: 'theme', title: t.switchTheme, subtitle: t.switchThemeDesc, onSelect: toggleTheme },
        { id: 'language', title: t.toggleLanguage, subtitle: t.paletteLanguageDesc, onSelect: toggleLang },
        { id: 'settings', title: t.openSettings, subtitle: t.paletteSettingsDesc, onSelect: () => goToTab('settings') },
      ].filter((item) => `${item.title} ${item.subtitle}`.toLowerCase().includes(paletteFilter)),
    // openAddModal / toggleTheme / toggleLang / goToTab are stable inline functions; only text content and filter matter
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [paletteFilter, t],
  );

  const paletteNav = useMemo(
    () => navItems.filter((item) => item.label.toLowerCase().includes(paletteFilter)),
    [navItems, paletteFilter],
  );
  const paletteBookmarks = useMemo(
    () =>
      nonArchivedBookmarks
        .filter((bookmark) => filterBookmarks([bookmark], paletteFilter).length > 0)
        .slice(0, 6),
    [nonArchivedBookmarks, paletteFilter],
  );

  if (!isAuthReady) {
    return (
      <ErrorBoundary>
        <div className="app-shell flex min-h-screen items-center justify-center px-4 py-10 text-on-surface sm:px-6">
          <div className="panel-surface flex w-full max-w-md items-center justify-center gap-3 rounded-[2rem] px-6 py-8 text-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm font-medium">{t.loadingAuth}</span>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  if (!user) {
    return (
      <ErrorBoundary>
        <div className="app-shell min-h-screen px-4 py-6 text-on-surface sm:px-6 lg:px-8">
          <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col justify-between gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-container text-[#06101f] shadow-[0_0_40px_rgba(75,142,255,0.35)]">
                  <LayoutGrid className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="font-headline text-3xl font-black tracking-tight">Lumina</h1>
                  <p className="label-meta">{t.dashboardHeroTag}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="ghost-button h-10 px-3" onClick={toggleLang} type="button">
                  <Languages className="h-4 w-4" />
                  <span className="text-sm font-semibold text-on-surface">{currentLanguageCode}</span>
                </button>
                <button className="icon-button" onClick={toggleTheme} type="button">
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="grid flex-1 items-center gap-6 xl:grid-cols-[minmax(0,1.1fr)_420px]">
              <section className="hero-panel overflow-hidden px-6 py-8 sm:px-8 sm:py-10">
                <div className="relative z-10 max-w-3xl">
                  <span className="label-meta text-primary">{t.syncState}</span>
                  <h2 className="mt-4 font-headline text-4xl font-black tracking-[-0.04em] sm:text-6xl">
                    {authTitle}
                  </h2>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-on-surface/66 sm:text-lg">
                    {authDescription}
                  </p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <button className="primary-button" onClick={() => void handleSignIn()} type="button">
                      <LogIn className="h-4 w-4" />
                      {authButtonLabel}
                    </button>
                  </div>
                  <p className="mt-5 text-sm text-on-surface/55">{authHint}</p>
                  {authError && <p className="mt-4 text-sm font-medium text-red-300">{authErrorLabel}</p>}
                </div>
                <div className="hero-orb hero-orb-primary" />
                <div className="hero-orb hero-orb-secondary" />
              </section>

              <aside className="panel-surface p-6 sm:p-7">
                <p className="label-meta">{t.systemStatus}</p>
                <h3 className="mt-3 font-headline text-2xl font-extrabold tracking-tight">
                  {lang === 'zh' ? 'Google 云端同步' : 'Google Cloud Sync'}
                </h3>
                <div className="mt-6 space-y-3 text-sm text-on-surface/62">
                  <div className="rounded-[1.4rem] bg-white/[0.03] px-4 py-3">
                    {lang === 'zh' ? '登录后可在同一 Google 账户下同步全部书签。' : 'Sync all bookmarks across the same Google account after sign-in.'}
                  </div>
                  <div className="rounded-[1.4rem] bg-white/[0.03] px-4 py-3">
                    {lang === 'zh' ? '新增、收藏、归档和设置修改都会直接写入云端。' : 'Adds, favorites, archives, and settings changes are written directly to the cloud.'}
                  </div>
                  <div className="rounded-[1.4rem] bg-white/[0.03] px-4 py-3">
                    {lang === 'zh' ? '当前已关闭访客模式，未登录时不可进入工作区。' : 'Guest mode is disabled, and the workspace stays locked until you sign in.'}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="app-shell min-h-screen text-on-surface">
        <AnimatePresence>
          {isMobileMenuOpen && (
            <div className="fixed inset-0 z-[90] lg:hidden">
              <motion.button
                aria-label="Close menu"
                className="absolute inset-0 bg-background/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                type="button"
              />
              <motion.aside
                className="panel-surface absolute left-4 flex w-[min(84vw,320px)] flex-col p-5"
                style={{
                  top: 'max(1rem, env(safe-area-inset-top))',
                  bottom: 'max(1rem, env(safe-area-inset-bottom))',
                }}
                initial={{ x: -24, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -24, opacity: 0 }}
              >
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <h2 className="font-headline text-2xl font-black tracking-tight">Lumina</h2>
                    <p className="label-meta mt-2">{t.dashboardHeroTag}</p>
                  </div>
                  <button className="icon-button" onClick={() => setIsMobileMenuOpen(false)} type="button">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {navItems.map((item) => (
                    <DesktopNavItem
                      active={activeTab === item.id}
                      icon={item.icon}
                      key={item.id}
                      label={item.label}
                      onClick={() => goToTab(item.id)}
                    />
                  ))}
                </div>
                <div className="mt-auto rounded-[1.5rem] bg-white/[0.03] p-4">
                  <p className="label-meta">{t.syncState}</p>
                  <p className="mt-2 text-sm text-on-surface/62">{syncStateLabel}</p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button className="ghost-button w-full justify-between px-3 py-2.5" onClick={toggleLang} type="button">
                      <span className="inline-flex items-center gap-2">
                        <Languages className="h-4 w-4" />
                      </span>
                      <span className="text-xs font-semibold text-on-surface">{currentLanguageCode}</span>
                    </button>
                    <button className="ghost-button w-full justify-center gap-2 px-3 py-2.5" onClick={toggleTheme} type="button">
                      <span className="inline-flex items-center gap-2">
                        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        <span className="text-[11px] font-bold uppercase tracking-[0.18em]">THEME</span>
                      </span>
                    </button>
                  </div>
                </div>
              </motion.aside>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isCommandPaletteOpen && (
            <div className="fixed inset-0 z-[110] flex items-start justify-center px-4 pt-4 sm:pt-[10vh]">
              <motion.button
                aria-label="Close command palette"
                className="absolute inset-0 bg-background/60 backdrop-blur-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsCommandPaletteOpen(false)}
                type="button"
              />
              <motion.div
                className="curator-glass relative w-full max-w-3xl overflow-hidden rounded-[2rem]"
                initial={{ opacity: 0, scale: 0.96, y: -18 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -18 }}
              >
                <div className="border-b border-white/8 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Search className="h-5 w-5 text-primary" />
                    <input
                      autoComplete="off"
                      autoFocus
                      className="w-full bg-transparent text-lg font-medium outline-none placeholder:text-on-surface/35"
                      placeholder={t.commandPlaceholder}
                      value={paletteQuery}
                      onChange={(event) => setPaletteQuery(event.target.value)}
                    />
                    <kbd className="rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold text-on-surface/55">
                      ESC
                    </kbd>
                  </div>
                </div>
                <div className="max-h-[65vh] overflow-y-auto px-4 py-4">
                  <div className="space-y-2">
                    <p className="label-meta px-2">{t.quickActions}</p>
                    {paletteActions.map((action) => (
                      <button className="palette-item" key={action.id} onClick={action.onSelect} type="button">
                        <div className="palette-icon">
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{action.title}</p>
                          <p className="truncate text-xs text-on-surface/55">{action.subtitle}</p>
                        </div>
                      </button>
                    ))}
                    <p className="label-meta px-2 pt-4">{t.jumpTo}</p>
                    {paletteNav.map((item) => (
                      <button className="palette-item" key={item.id} onClick={() => goToTab(item.id)} type="button">
                        <div className="palette-icon">
                          <item.icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{item.label}</p>
                        </div>
                      </button>
                    ))}
                    <p className="label-meta px-2 pt-4">{t.recentBookmarks}</p>
                    {paletteBookmarks.map((bookmark) => (
                      <button
                        className="palette-item"
                        key={bookmark.id}
                        onClick={() => {
                          setIsCommandPaletteOpen(false);
                          window.open(bookmark.url, '_blank', 'noopener,noreferrer');
                        }}
                        type="button"
                      >
                        <img alt={bookmark.title} className="h-9 w-9 rounded-xl border border-white/10 object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = buildFavicon('', bookmark.title); }} referrerPolicy="no-referrer" src={bookmark.icon} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{bookmark.title}</p>
                          <p className="truncate text-xs text-on-surface/55">{bookmark.description}</p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-on-surface/45" />
                      </button>
                    ))}
                    {paletteActions.length === 0 && paletteNav.length === 0 && paletteBookmarks.length === 0 && aiSearchResults.length === 0 && !isAiSearching && (
                      <div className="px-2 py-8 text-center text-sm text-on-surface/55">
                        <p>{t.commandEmpty}</p>
                        <p className="mt-2 text-xs text-on-surface/40">{t.aiSearchHint}</p>
                      </div>
                    )}
                    {isAiSearching && (
                      <div className="flex items-center gap-2 px-2 py-6 text-sm text-primary">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t.aiSearching}
                      </div>
                    )}
                    {aiSearchResults.length > 0 && (
                      <>
                        <p className="label-meta flex items-center gap-1.5 px-2 pt-4">
                          <WandSparkles className="h-3 w-3 text-primary" />
                          {t.aiSearchLabel}
                        </p>
                        {aiSearchResults.map((bookmark) => (
                          <button
                            className="palette-item"
                            key={bookmark.id}
                            onClick={() => {
                              setIsCommandPaletteOpen(false);
                              setAiSearchResults([]);
                              window.open(bookmark.url, '_blank', 'noopener,noreferrer');
                            }}
                            type="button"
                          >
                            <img alt={bookmark.title} className="h-9 w-9 rounded-xl border border-white/10 object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = buildFavicon('', bookmark.title); }} referrerPolicy="no-referrer" src={bookmark.icon} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold">{bookmark.title}</p>
                              <p className="truncate text-xs text-on-surface/55">{bookmark.description}</p>
                            </div>
                            <ExternalLink className="h-4 w-4 text-on-surface/45" />
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                </div>
                <div className="border-t border-white/8 bg-white/[0.02] px-5 py-3 text-xs text-on-surface/48">
                  {isMac ? 'Cmd+K' : 'Ctrl+K'} | {t.addHint} | ? {lang === 'zh' ? 'AI 搜索' : 'AI search'}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isAddModalOpen && (
            <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto px-4 py-4 sm:items-center sm:py-8">
              <motion.button
                aria-label="Close add bookmark modal"
                className="absolute inset-0 bg-background/60 backdrop-blur-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAddModalOpen(false)}
                type="button"
              />
              <motion.form
                className="panel-surface relative w-full max-w-xl p-6 sm:p-7"
                initial={{ opacity: 0, y: 18, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 18, scale: 0.96 }}
                onSubmit={(event) => void handleAddBookmark(event)}
              >
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="label-meta">{t.addBookmark}</p>
                    <h2 className="mt-2 font-headline text-2xl font-extrabold tracking-tight">{t.addBookmark}</h2>
                  </div>
                  <button className="icon-button" onClick={() => setIsAddModalOpen(false)} type="button">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 sm:col-span-2">
                    <span className="label-meta">{t.title}</span>
                    <input autoComplete="off" className="neo-input" placeholder={t.bookmarkTitlePlaceholder} value={newBookmark.title} onChange={(event) => setNewBookmark((prev) => ({ ...prev, title: event.target.value }))} />
                  </label>
                  <label className="space-y-2 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <span className="label-meta">{t.url}</span>
                      {isAiFilling && (
                        <span className="flex items-center gap-1.5 text-[10px] text-primary">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          {t.aiAutoFill}
                        </span>
                      )}
                    </div>
                    <input
                      autoComplete="url"
                      className="neo-input"
                      placeholder={t.bookmarkUrlPlaceholder}
                      value={newBookmark.url}
                      onChange={(event) => setNewBookmark((prev) => ({ ...prev, url: event.target.value }))}
                      onBlur={() => void handleUrlBlur()}
                    />
                  </label>
                  <label className="space-y-2 sm:col-span-2">
                    <span className="label-meta">{t.description}</span>
                    <textarea autoComplete="off" className="neo-input min-h-[108px] resize-none" placeholder={t.bookmarkDescriptionPlaceholder} value={newBookmark.description} onChange={(event) => setNewBookmark((prev) => ({ ...prev, description: event.target.value }))} />
                  </label>
                  <label className="space-y-2">
                    <span className="label-meta">{t.tag}</span>
                    <input autoComplete="off" className="neo-input" placeholder={t.bookmarkTagPlaceholder} value={newBookmark.tag} onChange={(event) => setNewBookmark((prev) => ({ ...prev, tag: event.target.value }))} />
                  </label>
                  <label className="space-y-2">
                    <span className="label-meta">{t.category}</span>
                    <select className="neo-input appearance-none" value={newBookmark.categoryId} onChange={(event) => setNewBookmark((prev) => ({ ...prev, categoryId: event.target.value }))}>
                      {categories.filter((category) => category.id !== 'archive').map((category) => (
                        <option key={category.id} value={category.id}>{resolveCategoryTitle(category, lang)}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="mt-5 rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4">
                  <input
                    accept=".html,.htm,.json,.csv"
                    className="hidden"
                    onChange={handleImportBookmarks}
                    ref={importInputRef}
                    type="file"
                  />
                  <p className="label-meta">{createMessage('批量导入', 'Bulk Import')}</p>
                  <p className="mt-2 text-sm leading-6 text-on-surface/58">
                    {createMessage(
                      '支持浏览器导出的 HTML 书签文件，也支持 JSON / CSV。系统会自动补全 https:// 并跳过重复项。',
                      'Supports browser-exported HTML bookmark files plus JSON / CSV. URLs are normalized and duplicates are skipped automatically.',
                    )}
                  </p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <button className="ghost-button justify-center sm:flex-1" disabled={isImporting} onClick={() => importInputRef.current?.click()} type="button">
                      {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      {isImporting ? createMessage('导入中...', 'Importing...') : createMessage('导入文件', 'Import File')}
                    </button>
                    <button className="ghost-button justify-center sm:flex-1" onClick={handleExportBookmarks} type="button">
                      <ExternalLink className="h-4 w-4" />
                      {createMessage('导出备份', 'Export Backup')}
                    </button>
                  </div>
                </div>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button className="ghost-button justify-center" onClick={() => setIsAddModalOpen(false)} type="button">{t.cancel}</button>
                  <button className="primary-button justify-center" disabled={isSavingBookmark || !newBookmark.title.trim() || !newBookmark.url.trim()} type="submit">
                    {isSavingBookmark ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    {isSavingBookmark ? createMessage('保存中...', 'Saving...') : t.submit}
                  </button>
                </div>
              </motion.form>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {editingBookmark && (
            <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto px-4 py-4 sm:items-center sm:py-8">
              <motion.button
                aria-label="Close edit modal"
                className="absolute inset-0 bg-background/60 backdrop-blur-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setEditingBookmark(null)}
                type="button"
              />
              <motion.form
                className="panel-surface relative w-full max-w-xl p-6 sm:p-7"
                initial={{ opacity: 0, y: 18, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 18, scale: 0.96 }}
                onSubmit={(event) => void handleSaveEdit(event)}
              >
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="label-meta">{createMessage('编辑书签', 'Edit Bookmark')}</p>
                    <h2 className="mt-2 font-headline text-2xl font-extrabold tracking-tight">{createMessage('编辑书签', 'Edit Bookmark')}</h2>
                  </div>
                  <button className="icon-button" onClick={() => setEditingBookmark(null)} type="button">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 sm:col-span-2">
                    <span className="label-meta">{t.title}</span>
                    <input autoComplete="off" className="neo-input" placeholder={t.bookmarkTitlePlaceholder} value={editForm.title} onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))} />
                  </label>
                  <label className="space-y-2 sm:col-span-2">
                    <span className="label-meta">{t.url}</span>
                    <input autoComplete="url" className="neo-input" placeholder={t.bookmarkUrlPlaceholder} value={editForm.url} onChange={(e) => setEditForm((prev) => ({ ...prev, url: e.target.value }))} />
                  </label>
                  <label className="space-y-2 sm:col-span-2">
                    <span className="label-meta">{t.description}</span>
                    <textarea autoComplete="off" className="neo-input min-h-[80px] resize-none" placeholder={t.bookmarkDescriptionPlaceholder} value={editForm.description} onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))} />
                  </label>
                  <label className="space-y-2">
                    <span className="label-meta">{t.tag}</span>
                    <input autoComplete="off" className="neo-input" placeholder={t.bookmarkTagPlaceholder} value={editForm.tag} onChange={(e) => setEditForm((prev) => ({ ...prev, tag: e.target.value }))} />
                  </label>
                  <label className="space-y-2">
                    <span className="label-meta">{t.category}</span>
                    <select className="neo-input appearance-none" value={editForm.categoryId} onChange={(e) => setEditForm((prev) => ({ ...prev, categoryId: e.target.value }))}>
                      {categories.filter((c) => c.id !== 'archive').map((c) => (
                        <option key={c.id} value={c.id}>{resolveCategoryTitle(c, lang)}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button className="ghost-button justify-center" onClick={() => setEditingBookmark(null)} type="button">{t.cancel}</button>
                  <button className="primary-button justify-center" disabled={isSavingBookmark || !editForm.title.trim() || !editForm.url.trim()} type="submit">
                    {isSavingBookmark ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
                    {isSavingBookmark ? createMessage('保存中...', 'Saving...') : t.submit}
                  </button>
                </div>
              </motion.form>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {notice && (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className={`fixed right-4 z-[130] w-[min(calc(100vw-2rem),28rem)] rounded-[1.5rem] border px-4 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.25)] xl:bottom-6 ${
                notice.tone === 'error'
                  ? 'border-red-400/25 bg-red-500/12 text-red-50'
                  : 'border-emerald-400/25 bg-emerald-500/12 text-on-surface'
              }`}
              style={{ bottom: 'calc(6rem + env(safe-area-inset-bottom))' }}
              exit={{ opacity: 0, y: 12 }}
              initial={{ opacity: 0, y: 12 }}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-1 h-2.5 w-2.5 rounded-full ${notice.tone === 'error' ? 'bg-red-300' : 'bg-emerald-300'}`} />
                <p className="text-sm leading-6">{notice.message}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <aside className="desktop-sidebar hidden xl:flex xl:flex-col xl:justify-between">
          <div>
            <div className="mb-12 px-3">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-container text-[#06101f] shadow-[0_0_40px_rgba(75,142,255,0.35)]">
                  <LayoutGrid className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="font-headline text-3xl font-black tracking-tight">Lumina</h1>
                  <p className="label-meta">{t.dashboardHeroTag}</p>
                </div>
              </div>
            </div>
            <nav className="space-y-2">
              {navItems.map((item) => (
                <DesktopNavItem active={activeTab === item.id} icon={item.icon} key={item.id} label={item.label} onClick={() => goToTab(item.id)} />
              ))}
            </nav>
          </div>
          <div className="space-y-4">
            <button className="primary-button w-full justify-center" onClick={openAddModal} type="button">
              <Plus className="h-4 w-4" />
              {t.addBookmark}
            </button>
            <div className="rounded-[1.6rem] bg-white/[0.03] p-4">
              <button className="mb-4 flex w-full items-center gap-3 text-left" onClick={() => user ? goToTab('personal') : void signIn()} type="button">
                <div className="h-11 w-11 overflow-hidden rounded-2xl border border-white/10 bg-white/6">
                  {user?.photoURL ? <img alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" src={user.photoURL} /> : <div className="flex h-full w-full items-center justify-center"><UserIcon className="h-5 w-5 text-on-surface/58" /></div>}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{user?.displayName || t.guest}</p>
                  <p className="truncate text-xs text-on-surface/52">{user?.email || (lang === 'zh' ? '点击登录账号' : 'Click to sign in')}</p>
                </div>
              </button>
              <div className="flex gap-2">
                <button className="ghost-button flex-1 justify-center" onClick={() => goToTab('personal')} type="button"><UserIcon className="h-4 w-4" />{t.personal}</button>
                {user ? <button aria-label={t.signOut} className="icon-button" disabled={isSigningOut} onClick={() => void handleSignOut()} type="button">{isSigningOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}</button> : <button className="icon-button" onClick={() => void signIn()} type="button"><LogIn className="h-4 w-4" /></button>}
              </div>
            </div>
          </div>
        </aside>

        <div className="xl:pl-[16rem]">
          <div className="content-wrap">
          <header className="sticky top-0 z-40 px-4 pt-4 sm:px-6 lg:px-8">
            <div className="curator-glass flex items-center gap-3 rounded-[1.8rem] px-4 py-3 sm:px-5">
              <button className="icon-button xl:hidden" onClick={() => setIsMobileMenuOpen(true)} type="button"><Menu className="h-4 w-4" /></button>
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface/42" />
                <input className="neo-input w-full pl-11 pr-20" placeholder={t.searchPlaceholder} value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl border border-white/8 bg-white/6 px-2.5 py-1 text-[10px] font-bold text-on-surface/55" onClick={() => { setPaletteQuery(searchQuery); setIsCommandPaletteOpen(true); }} type="button">{isMac ? 'Cmd+K' : 'Ctrl K'}</button>
              </div>
              <div className="hidden items-center gap-2 md:flex">
                <button aria-label={lang === 'zh' ? `切换语言（当前：${currentLanguageLabel}）` : `Toggle language (current: ${currentLanguageLabel})`} className="ghost-button h-10 px-3" onClick={toggleLang} type="button">
                  <Languages className="h-4 w-4" />
                  <span className="text-sm font-semibold text-on-surface">{currentLanguageCode}</span>
                </button>
                <button aria-label={lang === 'zh' ? `切换主题（当前：${currentThemeLabel}）` : `Toggle theme (current: ${currentThemeLabel})`} className="icon-button" onClick={toggleTheme} type="button">
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
                <button className="icon-button" onClick={() => goToTab('settings')} type="button"><Settings className="h-4 w-4" /></button>
              </div>
              <button className="profile-pill" onClick={() => user ? goToTab('personal') : void signIn()} type="button">
                <div className="h-8 w-8 overflow-hidden rounded-xl border border-white/10 bg-white/6">
                  {user?.photoURL ? <img alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" src={user.photoURL} /> : <div className="flex h-full w-full items-center justify-center"><UserIcon className="h-4 w-4 text-on-surface/58" /></div>}
                </div>
                <div className="hidden min-w-0 text-left sm:block">
                  <p className="truncate text-sm font-semibold">{user?.displayName || t.guest}</p>
                  <p className="truncate text-[10px] uppercase tracking-[0.18em] text-on-surface/45">{user ? syncStateLabel : (lang === 'zh' ? '点击登录' : 'Click to sign in')}</p>
                </div>
                <ChevronDown className="hidden h-4 w-4 text-on-surface/45 sm:block" />
              </button>
            </div>
          </header>

          <main className="px-4 pb-40 pt-6 sm:px-6 sm:pb-36 lg:px-8 lg:pb-10">
            {syncError && (
              <div className="mb-4 rounded-[1.5rem] border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-50">
                {syncError}
              </div>
            )}
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                <section className="grid gap-6 xl:grid-cols-[minmax(0,1.38fr)_308px] 2xl:grid-cols-[minmax(0,1.45fr)_320px]">
                  <div className="hero-panel overflow-hidden px-6 py-7 sm:px-8 sm:py-9">
                    <div className="relative z-10 max-w-3xl">
                      <span className="label-meta text-primary">{t.dashboardHeroTag}</span>
                      <h1 className="mt-4 font-headline text-4xl font-black tracking-[-0.04em] text-on-surface sm:text-6xl">{t.welcome}{user?.displayName ? `, ${user.displayName}` : '.'}</h1>
                      <p className="mt-4 max-w-2xl text-base leading-7 text-on-surface/66 sm:text-lg">{t.subtitle}</p>
                      <div className="mt-8 flex flex-wrap gap-3">
                        <button className="primary-button" onClick={openAddModal} type="button"><Plus className="h-4 w-4" />{t.addBookmark}</button>
                        <button className="ghost-button" onClick={() => setIsCommandPaletteOpen(true)} type="button"><Command className="h-4 w-4" />{t.commandPalette}</button>
                      </div>
                    </div>
                    <div className="hero-orb hero-orb-primary" />
                    <div className="hero-orb hero-orb-secondary" />
                  </div>
                  <div className="curator-glass rounded-[2rem] p-6">
                    <div className="mb-5 flex items-center justify-between"><div><p className="label-meta text-primary">{t.systemStatus}</p><p className="mt-2 text-sm text-on-surface/55">{t.syncState}</p></div><WandSparkles className="h-5 w-5 text-primary" /></div>
                    <div className="space-y-5">
                      <div className="rounded-3xl bg-white/[0.03] p-4">
                        <p className="label-meta">{t.syncState}</p>
                        <p className="mt-2 text-2xl font-headline font-black">{syncStateLabel}</p>
                        <p className="mt-1 text-xs text-on-surface/50">{t.lastSync}：{lastSyncLabel}</p>
                      </div>
                      <div className="rounded-3xl bg-white/[0.03] p-4">
                        <div className="mb-2 flex items-center justify-between text-xs text-on-surface/52">
                          <span>{lang === 'zh' ? '书签总量' : 'Total Bookmarks'}</span>
                          <span>{nonArchivedBookmarks.length}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/6">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary to-primary-container transition-all duration-700"
                            style={{ width: `${Math.min(100, (nonArchivedBookmarks.length / Math.max(1, nonArchivedBookmarks.length + archivedBookmarks.length)) * 100)}%` }}
                          />
                        </div>
                      </div>
                      <button className="ghost-button w-full justify-center" onClick={() => goToTab('settings')} type="button">{t.diagnostics}</button>
                    </div>
                  </div>
                </section>
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{stats.map((stat) => <MetricCard key={stat.label} {...stat} />)}</section>
                <section className="space-y-4">
                  <div className="section-header"><div><span className="label-meta">{t.featured}</span><h2 className="section-title">{t.pinned}</h2></div><button className="text-link" onClick={() => goToTab('favorites')} type="button">{t.viewAll}</button></div>
                  <BookmarkSection addLabel={t.addBookmark} bookmarks={featuredBookmarks} emptyBody={t.noBookmarksDesc} emptyTitle={t.noBookmarks} lang={lang} onAdd={openAddModal} onArchive={toggleArchive} onDelete={deleteBookmark} onEdit={openEditModal} onFavorite={toggleFavorite} viewMode="grid" />
                </section>
                <section className="space-y-4">
                  <div className="section-header"><div><span className="label-meta">{t.sectionCategory}</span><h2 className="section-title">{t.collections}</h2></div></div>
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{filteredCategories.filter((category) => category.id !== 'archive').slice(0, 6).map((category) => <CategoryCard category={category} key={category.id} lang={lang} onOpen={() => goToTab(category.id)} />)}</div>
                </section>
                <section className="space-y-4">
                  <div className="section-header"><div><span className="label-meta">{t.preview}</span><h2 className="section-title">{t.recentBookmarks}</h2></div><ViewSwitch gridLabel={t.grid} listLabel={t.list} onChange={setViewMode} viewMode={viewMode} /></div>
                  <BookmarkSection addLabel={t.addBookmark} bookmarks={displayedBookmarks.slice(0, 9)} emptyBody={queryText ? t.commandEmpty : t.noBookmarksDesc} emptyTitle={queryText ? t.noResults : t.noBookmarks} lang={lang} onAdd={openAddModal} onArchive={toggleArchive} onDelete={deleteBookmark} onEdit={openEditModal} onFavorite={toggleFavorite} viewMode={viewMode} />
                </section>
              </div>
            )}

            {activeTab === 'favorites' && <div className="space-y-5"><div className="section-header"><div><span className="label-meta">{t.favorites}</span><h1 className="section-title">{t.favorites}</h1></div><ViewSwitch gridLabel={t.grid} listLabel={t.list} onChange={setViewMode} viewMode={viewMode} /></div><BookmarkSection addLabel={t.addBookmark} bookmarks={displayedBookmarks} emptyBody={queryText ? t.commandEmpty : t.noBookmarksDesc} emptyTitle={queryText ? t.noResults : t.noBookmarks} lang={lang} onAdd={openAddModal} onArchive={toggleArchive} onDelete={deleteBookmark} onEdit={openEditModal} onFavorite={toggleFavorite} viewMode={viewMode} /></div>}
            {activeTab === 'archive' && <div className="space-y-5"><div className="section-header"><div><span className="label-meta">{t.archive}</span><h1 className="section-title">{t.archive}</h1><p className="mt-3 text-sm text-on-surface/58">{t.archiveDesc}</p></div>{archivedBookmarks.length > 0 && <button className="danger-button" onClick={() => void handleDeleteArchivedAll()} type="button"><Trash2 className="h-4 w-4" />{t.deleteAll}</button>}</div>{archivedBookmarks.length === 0 ? <div className="panel-surface flex min-h-[260px] flex-col items-center justify-center text-center"><Archive className="mb-4 h-12 w-12 text-on-surface/24" /><h3 className="text-xl font-bold">{t.emptyArchive}</h3><p className="mt-2 max-w-md text-sm text-on-surface/58">{t.archiveDesc}</p></div> : <ArchiveGrid bookmarks={archivedBookmarks} lang={lang} onDelete={deleteBookmark} onRestore={toggleArchive} />}</div>}
            {activeTab === 'personal' && <div className="space-y-8"><section className="hero-panel relative overflow-hidden px-6 py-8 sm:px-8"><img alt="" className="absolute inset-0 h-full w-full object-cover opacity-28" referrerPolicy="no-referrer" src={wallpaper || 'https://picsum.photos/seed/lumina-profile/1600/900'} /><div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" /><div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-end"><button className="h-24 w-24 overflow-hidden rounded-[1.75rem] border border-white/14 bg-white/6 shadow-[0_18px_40px_rgba(0,0,0,0.25)]" onClick={() => !user && void signIn()} style={{ cursor: user ? 'default' : 'pointer' }} type="button">{user?.photoURL ? <img alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" src={user.photoURL} /> : <div className="flex h-full w-full items-center justify-center"><UserIcon className="h-10 w-10 text-on-surface/58" /></div>}</button><div className="min-w-0 flex-1"><span className="label-meta text-primary">{t.personalSpace}</span><h1 className="mt-3 font-headline text-4xl font-black tracking-tight">{user?.displayName || t.guest}</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-on-surface/64">{user ? t.personalDesc : t.guestDesc}</p>{!user && <button className="primary-button mt-5" onClick={() => void signIn()} type="button"><LogIn className="h-4 w-4" />{t.signIn}</button>}</div></div></section><section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{stats.map((stat) => <MetricCard key={stat.label} {...stat} />)}</section><section className="space-y-4"><div className="section-header"><div><span className="label-meta">{t.preview}</span><h2 className="section-title">{t.yourCollections}</h2></div><button className="primary-button" onClick={openAddModal} type="button"><Plus className="h-4 w-4" />{t.addBookmark}</button></div><div className="grid gap-5 md:grid-cols-2">{categories.filter((category) => category.id === 'work' || category.id === 'personal').map((category) => <CategoryCard category={category} key={category.id} lang={lang} onOpen={() => goToTab(category.id)} />)}</div></section></div>}
            {activeTab === 'settings' && (
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <span className="label-meta">{t.settings}</span>
                  <h1 className="section-title">{t.settings}</h1>
                </div>
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1.04fr)_332px] 2xl:grid-cols-[minmax(0,1.1fr)_356px]">
                  <div className="space-y-5">
                    <div className="space-y-3">
                      <span className="label-meta">{t.interfaceQuickActions}</span>
                      <div className="grid grid-cols-2 gap-3">
                        <button className="ghost-button h-12 w-full justify-center rounded-[1.35rem] px-3" onClick={toggleTheme} type="button">
                          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                          <span className="text-[11px] font-bold uppercase tracking-[0.18em]">THEME</span>
                        </button>
                        <button className="ghost-button h-12 w-full justify-center rounded-[1.35rem] px-3" onClick={toggleLang} type="button">
                          <Languages className="h-4 w-4" />
                          <span className="text-sm font-semibold text-on-surface">{currentLanguageCode}</span>
                        </button>
                      </div>
                    </div>

                    <div className="panel-surface p-4 sm:p-6">
                      <div className="section-header mb-5">
                        <div>
                          <span className="label-meta">{t.appearance}</span>
                          <h2 className="text-xl font-headline font-extrabold tracking-tight sm:text-2xl">{t.darkTheme}</h2>
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <button className={`theme-preview ${theme === 'dark' ? 'theme-preview-active' : ''}`} onClick={() => setThemePreference('dark')} type="button">
                          <div className="theme-preview-canvas theme-preview-dark">
                            <div className="theme-preview-sidebar" />
                            <div className="theme-preview-surface" />
                            <div className="theme-preview-orb" />
                          </div>
                          <div>
                            <p className="font-semibold">{t.darkTheme}</p>
                            <p className="mt-1 text-sm text-on-surface/58">{t.themeDarkDesc}</p>
                          </div>
                        </button>
                        <button className={`theme-preview ${theme === 'light' ? 'theme-preview-active' : ''}`} onClick={() => setThemePreference('light')} type="button">
                          <div className="theme-preview-canvas theme-preview-light">
                            <div className="theme-preview-sidebar" />
                            <div className="theme-preview-surface" />
                          </div>
                          <div>
                            <p className="font-semibold">{t.lightTheme}</p>
                            <p className="mt-1 text-sm text-on-surface/58">{t.themeLightDesc}</p>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className="panel-surface p-4 sm:p-6">
                      <div className="section-header mb-5">
                        <div>
                          <span className="label-meta">{t.wallpaper}</span>
                          <h2 className="text-xl font-headline font-extrabold tracking-tight sm:text-2xl">{t.wallpaper}</h2>
                        </div>
                      </div>
                      <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
                        <img alt="" className="h-36 w-full object-cover sm:h-52" referrerPolicy="no-referrer" src={wallpaper || 'https://picsum.photos/seed/lumina-wallpaper-preview/1600/900'} />
                      </div>
                      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                        <input className="neo-input flex-1" placeholder={t.wallpaperPlaceholder} value={wallpaperInput} onChange={(event) => setWallpaperInput(event.target.value)} />
                        <button className="primary-button justify-center sm:min-w-[120px]" onClick={() => applyWallpaper(wallpaperInput)} type="button">{t.submit}</button>
                      </div>
                      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                        <label className="ghost-button cursor-pointer justify-center sm:flex-1">
                          <span>{t.uploadImage}</span>
                          <input accept="image/*" className="hidden" onChange={handleWallpaperUpload} type="file" />
                        </label>
                        <button className="danger-button justify-center sm:flex-1" onClick={resetWallpaper} type="button">{t.resetWallpaper}</button>
                      </div>
                      <div className="mt-5">
                        <p className="label-meta mb-3">{t.recommendedWallpapers}</p>
                        <div className="grid grid-cols-3 gap-3">
                          {WALLPAPER_PRESETS.map((preset) => (
                            <button className="overflow-hidden rounded-2xl border border-white/10 transition duration-200 hover:border-primary" key={preset} onClick={() => applyWallpaper(preset)} type="button">
                              <img alt="" className="aspect-video w-full object-cover" referrerPolicy="no-referrer" src={preset} />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="panel-surface p-4 sm:p-6">
                      <p className="label-meta">{t.account}</p>
                      <h2 className="mt-2 text-xl font-headline font-extrabold tracking-tight sm:text-2xl">{t.account}</h2>
                      <div className="mt-5 rounded-[1.5rem] bg-white/[0.03] p-3 sm:p-4">
                        <div className="flex items-center gap-4">
                          <div className="h-14 w-14 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                            {user?.photoURL ? <img alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" src={user.photoURL} /> : <div className="flex h-full w-full items-center justify-center"><UserIcon className="h-6 w-6 text-on-surface/52" /></div>}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{user?.displayName || t.guest}</p>
                            <p className="truncate text-sm text-on-surface/58">{user?.email || t.guestDesc}</p>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                          {user ? <button className="danger-button flex-1 justify-center" disabled={isSigningOut} onClick={() => void handleSignOut()} type="button">{isSigningOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}{isSigningOut ? createMessage('退出中...', 'Signing out...') : t.signOut}</button> : <button className="primary-button flex-1 justify-center" onClick={() => void signIn()} type="button"><LogIn className="h-4 w-4" />{t.signIn}</button>}
                        </div>
                      </div>
                    </div>

                    <div className="curator-glass rounded-[2rem] p-4 sm:p-6">
                      <div className="mb-5 flex items-center justify-between">
                        <div>
                          <p className="label-meta text-primary">{t.systemStatus}</p>
                          <h2 className="mt-2 text-xl font-headline font-extrabold tracking-tight sm:text-2xl">{t.syncState}</h2>
                        </div>
                        <WandSparkles className="h-5 w-5 text-primary" />
                      </div>
                      <div className="space-y-4 text-sm text-on-surface/62">
                        <div className="flex items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3">
                          <span>{t.syncState}</span>
                          <span className="font-semibold text-primary">{syncStateLabel}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3">
                          <span>{t.lastSync}</span>
                          <span className="font-semibold">{lastSyncLabel}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3">
                          <span>{t.language}</span>
                          <span className="font-semibold">{currentLanguageLabel}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3">
                          <span>{t.appearance}</span>
                          <span className="font-semibold">{currentThemeLabel}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeCategory && !['dashboard', 'favorites', 'archive', 'personal', 'settings'].includes(activeTab) && <div className="space-y-5"><div className="section-header"><div><span className="label-meta">{t.sectionCategory}</span><h1 className="section-title">{resolveCategoryTitle(activeCategory, lang)}</h1><p className="mt-3 text-sm text-on-surface/58">{resolveCategorySubtitle(activeCategory, lang)}</p></div><ViewSwitch gridLabel={t.grid} listLabel={t.list} onChange={setViewMode} viewMode={viewMode} /></div><BookmarkSection addLabel={t.addBookmark} bookmarks={displayedBookmarks} emptyBody={queryText ? t.commandEmpty : t.noBookmarksDesc} emptyTitle={queryText ? t.noResults : t.noBookmarks} lang={lang} onAdd={openAddModal} onArchive={toggleArchive} onDelete={deleteBookmark} onEdit={openEditModal} onFavorite={toggleFavorite} viewMode={viewMode} /></div>}
          </main>
          </div>
        </div>

        <nav className="mobile-nav xl:hidden">
          <button className={`mobile-nav-item ${activeTab === 'dashboard' ? 'mobile-nav-item-active' : ''}`} onClick={() => goToTab('dashboard')} type="button"><LayoutGrid className="h-5 w-5" /><span>{t.dashboard}</span></button>
          <button className={`mobile-nav-item ${activeTab === 'favorites' ? 'mobile-nav-item-active' : ''}`} onClick={() => goToTab('favorites')} type="button"><Star className="h-5 w-5" /><span>{t.favorites}</span></button>
          <button className="mobile-nav-plus" onClick={openAddModal} type="button"><Plus className="h-6 w-6" /></button>
          <button className={`mobile-nav-item ${activeTab === 'personal' ? 'mobile-nav-item-active' : ''}`} onClick={() => goToTab('personal')} type="button"><UserIcon className="h-5 w-5" /><span>{t.personal}</span></button>
          <button className={`mobile-nav-item ${activeTab === 'settings' ? 'mobile-nav-item-active' : ''}`} onClick={() => goToTab('settings')} type="button"><Settings className="h-5 w-5" /><span>{t.settings}</span></button>
        </nav>
      </div>
    </ErrorBoundary>
  );
}
