/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Archive,
  Bell,
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
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { auth, db, logOut as firebaseLogOut, signIn } from './firebase';
import {
  buildDefaultCategories,
  CATEGORY_META,
  filterBookmarks,
  normalizeBookmark,
  persistGuestCategories,
  readGuestCategories,
  resolveCategorySubtitle,
  resolveCategoryTitle,
  STORAGE_KEYS,
  TRANSLATIONS,
  WALLPAPER_PRESETS,
  type BookmarkRecord,
  type CategoryRecord,
  type Lang,
  type Theme,
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

export default function App() {
  const [lang, setLang] = useState<Lang>('zh');
  const [theme, setTheme] = useState<Theme>('dark');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [paletteQuery, setPaletteQuery] = useState('');
  const [isMac, setIsMac] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [wallpaper, setWallpaper] = useState<string | null>(null);
  const [wallpaperInput, setWallpaperInput] = useState('');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [categories, setCategories] = useState<CategoryRecord[]>(buildDefaultCategories);
  const [newBookmark, setNewBookmark] = useState({
    title: '',
    url: '',
    description: '',
    tag: '',
    categoryId: 'work',
  });

  const t = TRANSLATIONS[lang];
  const toggleLang = () => setLang((prev) => (prev === 'zh' ? 'en' : 'zh'));
  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  const currentLanguageCode = lang.toUpperCase();
  const currentLanguageLabel = lang === 'zh' ? t.languageLabelZh : t.languageLabelEn;
  const currentThemeLabel = theme === 'dark' ? t.themeLabelDark : t.themeLabelLight;
  const allBookmarks = categories.flatMap((category) => category.bookmarks);
  const activeCategory = categories.find((category) => category.id === activeTab);
  const nonArchivedBookmarks = allBookmarks.filter((bookmark) => !bookmark.isArchived);
  const favoriteBookmarks = nonArchivedBookmarks.filter((bookmark) => bookmark.isFavorite);
  const archivedBookmarks = allBookmarks.filter((bookmark) => bookmark.isArchived);
  const queryText = searchQuery.trim().toLowerCase();
  const filteredCategories = categories
    .map((category) => ({ ...category, bookmarks: filterBookmarks(category.bookmarks, queryText) }))
    .filter((category) => {
      if (category.bookmarks.length > 0 || !queryText) return true;
      const text = `${resolveCategoryTitle(category, lang)} ${resolveCategorySubtitle(category, lang)}`.toLowerCase();
      return text.includes(queryText);
    });

  const displayedBookmarks =
    activeTab === 'favorites'
      ? filterBookmarks(favoriteBookmarks, queryText)
      : activeTab === 'archive'
        ? filterBookmarks(archivedBookmarks, queryText)
        : activeTab === 'dashboard'
          ? filterBookmarks([...nonArchivedBookmarks].sort((left, right) => right.createdAt - left.createdAt), queryText)
          : filterBookmarks((activeCategory?.bookmarks || []).filter((bookmark) => !bookmark.isArchived), queryText);

  const navItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutGrid },
    { id: 'favorites', label: t.favorites, icon: Star },
    { id: 'work', label: resolveCategoryTitle(categories.find((item) => item.id === 'work') || buildDefaultCategories()[0], lang), icon: Briefcase },
    { id: 'personal', label: t.personal, icon: UserIcon },
    { id: 'archive', label: t.archive, icon: Archive },
    { id: 'settings', label: t.settings, icon: Settings },
  ];

  useEffect(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.theme) as Theme | null;
    const savedLang = localStorage.getItem(STORAGE_KEYS.lang) as Lang | null;
    const savedWallpaper = localStorage.getItem(STORAGE_KEYS.wallpaper);
    if (savedTheme === 'dark' || savedTheme === 'light') setTheme(savedTheme);
    if (savedLang === 'zh' || savedLang === 'en') setLang(savedLang);
    if (savedWallpaper) {
      setWallpaper(savedWallpaper);
      setWallpaperInput(savedWallpaper);
    }
    if (!savedTheme && window.matchMedia('(prefers-color-scheme: light)').matches) setTheme('light');
    setIsMac(/mac/i.test(navigator.platform));
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.lang, lang);
  }, [lang]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthReady(true);
      if (!firebaseUser) {
        setCategories(readGuestCategories());
        return;
      }

      try {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
          await setDoc(userRef, {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            createdAt: serverTimestamp(),
          });
        }

        const categoriesCollection = collection(db, `users/${firebaseUser.uid}/categories`);
        const existingCategories = await getDocs(categoriesCollection);
        if (existingCategories.empty) {
          for (const category of buildDefaultCategories()) {
            await setDoc(doc(categoriesCollection, category.id), {
              id: category.id,
              order: category.order,
              iconKey: category.iconKey,
              color: category.color,
              title: resolveCategoryTitle(category, 'en'),
              subtitle: resolveCategorySubtitle(category, 'en'),
            });
          }
        }
      } catch (error) {
        console.error('Failed to bootstrap profile', error);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !isAuthReady) return;
    const categoriesQuery = query(collection(db, `users/${user.uid}/categories`), orderBy('order', 'asc'));
    const bookmarksQuery = query(collection(db, `users/${user.uid}/bookmarks`), orderBy('createdAt', 'desc'));
    let remoteBookmarks: BookmarkRecord[] = [];

    const unsubscribeCategories = onSnapshot(categoriesQuery, (snapshot) => {
      const remoteCategories = snapshot.docs.map((entry) => {
        const data = entry.data() as Partial<CategoryRecord>;
        const meta = CATEGORY_META[entry.id as keyof typeof CATEGORY_META];
        return {
          id: entry.id,
          order: Number(data.order) || meta?.order || 99,
          iconKey: data.iconKey || meta?.iconKey || 'LayoutGrid',
          color: (data.color as CategoryRecord['color']) || meta?.color || 'slate',
          title: data.title,
          subtitle: data.subtitle,
          bookmarks: remoteBookmarks.filter((bookmark) => bookmark.categoryId === entry.id),
        };
      });
      setCategories(remoteCategories.length > 0 ? remoteCategories : buildDefaultCategories());
    });

    const unsubscribeBookmarks = onSnapshot(bookmarksQuery, (snapshot) => {
      remoteBookmarks = snapshot.docs.map((entry) =>
        normalizeBookmark({ id: entry.id, ...(entry.data() as Partial<BookmarkRecord>) }),
      );
      setCategories((previous) =>
        previous.map((category) => ({
          ...category,
          bookmarks: remoteBookmarks.filter((bookmark) => bookmark.categoryId === category.id),
        })),
      );
    });

    return () => {
      unsubscribeCategories();
      unsubscribeBookmarks();
    };
  }, [isAuthReady, user]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteQuery(searchQuery);
        setIsCommandPaletteOpen(true);
      }
      if (event.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setIsAddModalOpen(false);
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [searchQuery]);

  const updateGuestCategories = (updater: (previous: CategoryRecord[]) => CategoryRecord[]) => {
    setCategories((previous) => {
      const next = updater(previous);
      persistGuestCategories(next);
      return next;
    });
  };

  const setBookmarkValue = async (
    bookmarkId: string,
    patch: Partial<BookmarkRecord>,
    guestUpdater: (previous: CategoryRecord[]) => CategoryRecord[],
  ) => {
    if (!user) {
      updateGuestCategories(guestUpdater);
      return;
    }
    await setDoc(doc(db, `users/${user.uid}/bookmarks/${bookmarkId}`), patch, { merge: true });
  };

  const toggleFavorite = (bookmark: BookmarkRecord) =>
    void setBookmarkValue(bookmark.id, { isFavorite: !bookmark.isFavorite }, (previous) =>
      previous.map((category) => ({
        ...category,
        bookmarks: category.bookmarks.map((item) =>
          item.id === bookmark.id ? { ...item, isFavorite: !bookmark.isFavorite } : item,
        ),
      })),
    );

  const toggleArchive = (bookmark: BookmarkRecord) =>
    void setBookmarkValue(bookmark.id, { isArchived: !bookmark.isArchived }, (previous) =>
      previous.map((category) => ({
        ...category,
        bookmarks: category.bookmarks.map((item) =>
          item.id === bookmark.id ? { ...item, isArchived: !bookmark.isArchived } : item,
        ),
      })),
    );

  const deleteBookmark = async (bookmark: BookmarkRecord) => {
    if (!user) {
      updateGuestCategories((previous) =>
        previous.map((category) => ({
          ...category,
          bookmarks: category.bookmarks.filter((item) => item.id !== bookmark.id),
        })),
      );
      return;
    }
    await deleteDoc(doc(db, `users/${user.uid}/bookmarks/${bookmark.id}`));
  };

  const openAddModal = () => {
    setIsCommandPaletteOpen(false);
    setIsAddModalOpen(true);
  };

  const goToTab = (tab: string) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    setIsCommandPaletteOpen(false);
  };

  const handleAddBookmark = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (!newBookmark.title.trim() || !newBookmark.url.trim() || !newBookmark.categoryId) return;
    const bookmark = normalizeBookmark({
      title: newBookmark.title,
      url: newBookmark.url,
      description: newBookmark.description,
      tag: newBookmark.tag || 'General',
      categoryId: newBookmark.categoryId,
    });
    if (!user) {
      updateGuestCategories((previous) =>
        previous.map((category) =>
          category.id === bookmark.categoryId
            ? { ...category, bookmarks: [bookmark, ...category.bookmarks] }
            : category,
        ),
      );
    } else {
      await addDoc(collection(db, `users/${user.uid}/bookmarks`), {
        ...bookmark,
        createdAt: serverTimestamp(),
      });
    }
    setNewBookmark({ title: '', url: '', description: '', tag: '', categoryId: newBookmark.categoryId });
    setIsAddModalOpen(false);
  };

  const applyWallpaper = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setWallpaper(trimmed);
    setWallpaperInput(trimmed);
    localStorage.setItem(STORAGE_KEYS.wallpaper, trimmed);
  };

  const resetWallpaper = () => {
    setWallpaper(null);
    setWallpaperInput('');
    localStorage.removeItem(STORAGE_KEYS.wallpaper);
  };

  const handleWallpaperUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') applyWallpaper(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const stats = [
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
      value: user ? 18 : 4,
      hint: t.statsDaysHint,
      icon: Zap,
    },
  ];

  const paletteFilter = paletteQuery.trim().toLowerCase();
  const paletteActions = [
    { id: 'add', title: t.addBookmark, subtitle: t.addBookmarkDesc, onSelect: openAddModal },
    {
      id: 'theme',
      title: t.switchTheme,
      subtitle: t.switchThemeDesc,
      onSelect: toggleTheme,
    },
    {
      id: 'language',
      title: t.toggleLanguage,
      subtitle: t.paletteLanguageDesc,
      onSelect: toggleLang,
    },
    {
      id: 'settings',
      title: t.openSettings,
      subtitle: t.paletteSettingsDesc,
      onSelect: () => goToTab('settings'),
    },
  ].filter((item) => `${item.title} ${item.subtitle}`.toLowerCase().includes(paletteFilter));

  const paletteNav = navItems.filter((item) => item.label.toLowerCase().includes(paletteFilter));
  const paletteBookmarks = nonArchivedBookmarks
    .filter((bookmark) => filterBookmarks([bookmark], paletteFilter).length > 0)
    .slice(0, 6);

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
                className="panel-surface absolute bottom-4 left-4 top-4 flex w-[min(84vw,320px)] flex-col p-5"
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
                  <p className="mt-2 text-sm text-on-surface/62">{user ? t.synced : t.localOnly}</p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button className="ghost-button w-full justify-between px-3 py-2.5" onClick={toggleLang} type="button">
                      <span className="inline-flex items-center gap-2">
                        <Languages className="h-4 w-4" />
                        <span className="text-[11px] font-bold uppercase tracking-[0.18em]">LANG</span>
                      </span>
                      <span className="text-xs font-semibold text-primary">{currentLanguageCode}</span>
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
            <div className="fixed inset-0 z-[110] flex items-start justify-center px-4 pt-[10vh]">
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
                        <img alt="" className="h-9 w-9 rounded-xl border border-white/10 object-cover" referrerPolicy="no-referrer" src={bookmark.icon} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{bookmark.title}</p>
                          <p className="truncate text-xs text-on-surface/55">{bookmark.description}</p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-on-surface/45" />
                      </button>
                    ))}
                    {paletteActions.length === 0 && paletteNav.length === 0 && paletteBookmarks.length === 0 && (
                      <div className="px-2 py-8 text-center text-sm text-on-surface/55">{t.commandEmpty}</div>
                    )}
                  </div>
                </div>
                <div className="border-t border-white/8 bg-white/[0.02] px-5 py-3 text-xs text-on-surface/48">
                  {isMac ? 'Cmd+K' : 'Ctrl+K'} | {t.addHint}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isAddModalOpen && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
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
                    <input className="neo-input" placeholder={t.bookmarkTitlePlaceholder} value={newBookmark.title} onChange={(event) => setNewBookmark((prev) => ({ ...prev, title: event.target.value }))} />
                  </label>
                  <label className="space-y-2 sm:col-span-2">
                    <span className="label-meta">{t.url}</span>
                    <input className="neo-input" placeholder={t.bookmarkUrlPlaceholder} value={newBookmark.url} onChange={(event) => setNewBookmark((prev) => ({ ...prev, url: event.target.value }))} />
                  </label>
                  <label className="space-y-2 sm:col-span-2">
                    <span className="label-meta">{t.description}</span>
                    <textarea className="neo-input min-h-[108px] resize-none" placeholder={t.bookmarkDescriptionPlaceholder} value={newBookmark.description} onChange={(event) => setNewBookmark((prev) => ({ ...prev, description: event.target.value }))} />
                  </label>
                  <label className="space-y-2">
                    <span className="label-meta">{t.tag}</span>
                    <input className="neo-input" placeholder={t.bookmarkTagPlaceholder} value={newBookmark.tag} onChange={(event) => setNewBookmark((prev) => ({ ...prev, tag: event.target.value }))} />
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
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button className="ghost-button justify-center" onClick={() => setIsAddModalOpen(false)} type="button">{t.cancel}</button>
                  <button className="primary-button justify-center" disabled={!newBookmark.title.trim() || !newBookmark.url.trim()} type="submit">
                    <Plus className="h-4 w-4" />
                    {t.submit}
                  </button>
                </div>
              </motion.form>
            </div>
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
              <div className="mb-4 flex items-center gap-3">
                <div className="h-11 w-11 overflow-hidden rounded-2xl border border-white/10 bg-white/6">
                  {user?.photoURL ? <img alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" src={user.photoURL} /> : <div className="flex h-full w-full items-center justify-center"><UserIcon className="h-5 w-5 text-on-surface/58" /></div>}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{user?.displayName || t.guest}</p>
                  <p className="truncate text-xs text-on-surface/52">{user?.email || t.localOnly}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="ghost-button flex-1 justify-center" onClick={() => goToTab('personal')} type="button"><UserIcon className="h-4 w-4" />{t.personal}</button>
                {user ? <button className="icon-button" onClick={() => void firebaseLogOut()} type="button"><LogOut className="h-4 w-4" /></button> : <button className="icon-button" onClick={() => void signIn()} type="button"><LogIn className="h-4 w-4" /></button>}
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
                <button className="ghost-button h-10 px-3" onClick={toggleLang} type="button">
                  <Languages className="h-4 w-4" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em]">LANG</span>
                  <span className="hidden lg:inline text-xs font-semibold text-primary">{currentLanguageCode}</span>
                </button>
                <button className="icon-button" onClick={toggleTheme} type="button">
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
                <button className="icon-button" onClick={() => goToTab('settings')} type="button"><Bell className="h-4 w-4" /></button>
              </div>
              <button className="profile-pill" onClick={() => goToTab('personal')} type="button">
                <div className="h-8 w-8 overflow-hidden rounded-xl border border-white/10 bg-white/6">
                  {user?.photoURL ? <img alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" src={user.photoURL} /> : <div className="flex h-full w-full items-center justify-center"><UserIcon className="h-4 w-4 text-on-surface/58" /></div>}
                </div>
                <div className="hidden min-w-0 text-left sm:block">
                  <p className="truncate text-sm font-semibold">{user?.displayName || t.guest}</p>
                  <p className="truncate text-[10px] uppercase tracking-[0.18em] text-on-surface/45">{user ? t.synced : t.localOnly}</p>
                </div>
                <ChevronDown className="hidden h-4 w-4 text-on-surface/45 sm:block" />
              </button>
            </div>
          </header>

          <main className="px-4 pb-40 pt-6 sm:px-6 sm:pb-36 lg:px-8 lg:pb-10">
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
                      <div className="rounded-3xl bg-white/[0.03] p-4"><p className="label-meta">{t.networkLoad}</p><p className="mt-2 text-3xl font-headline font-black">{user ? '14.2 Gbps' : '1.2 Gbps'}</p></div>
                      <div className="rounded-3xl bg-white/[0.03] p-4"><div className="mb-2 flex items-center justify-between text-xs text-on-surface/52"><span>{t.processing}</span><span>{user ? 22 : 43}%</span></div><div className="h-2 overflow-hidden rounded-full bg-white/6"><div className="h-full rounded-full bg-gradient-to-r from-primary to-primary-container" style={{ width: `${user ? 22 : 43}%` }} /></div></div>
                      <button className="ghost-button w-full justify-center" onClick={() => goToTab('settings')} type="button">{t.diagnostics}</button>
                    </div>
                  </div>
                </section>
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{stats.map((stat) => <MetricCard key={stat.label} {...stat} />)}</section>
                <section className="space-y-4">
                  <div className="section-header"><div><span className="label-meta">{t.featured}</span><h2 className="section-title">{t.pinned}</h2></div><button className="text-link" onClick={() => goToTab('favorites')} type="button">{t.viewAll}</button></div>
                  <BookmarkSection addLabel={t.addBookmark} bookmarks={[...favoriteBookmarks, ...nonArchivedBookmarks].slice(0, 4)} emptyBody={t.noBookmarksDesc} emptyTitle={t.noBookmarks} lang={lang} onAdd={openAddModal} onArchive={toggleArchive} onFavorite={toggleFavorite} viewMode="grid" />
                </section>
                <section className="space-y-4">
                  <div className="section-header"><div><span className="label-meta">{t.sectionCategory}</span><h2 className="section-title">{t.collections}</h2></div></div>
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{filteredCategories.filter((category) => category.id !== 'archive').slice(0, 6).map((category) => <CategoryCard category={category} key={category.id} lang={lang} onOpen={() => goToTab(category.id)} />)}</div>
                </section>
                <section className="space-y-4">
                  <div className="section-header"><div><span className="label-meta">{t.preview}</span><h2 className="section-title">{t.recentBookmarks}</h2></div><ViewSwitch gridLabel={t.grid} listLabel={t.list} onChange={setViewMode} viewMode={viewMode} /></div>
                  <BookmarkSection addLabel={t.addBookmark} bookmarks={displayedBookmarks.slice(0, 9)} emptyBody={queryText ? t.commandEmpty : t.noBookmarksDesc} emptyTitle={queryText ? t.noResults : t.noBookmarks} lang={lang} onAdd={openAddModal} onArchive={toggleArchive} onFavorite={toggleFavorite} viewMode={viewMode} />
                </section>
              </div>
            )}

            {activeTab === 'favorites' && <div className="space-y-5"><div className="section-header"><div><span className="label-meta">{t.favorites}</span><h1 className="section-title">{t.favorites}</h1></div><ViewSwitch gridLabel={t.grid} listLabel={t.list} onChange={setViewMode} viewMode={viewMode} /></div><BookmarkSection addLabel={t.addBookmark} bookmarks={displayedBookmarks} emptyBody={queryText ? t.commandEmpty : t.noBookmarksDesc} emptyTitle={queryText ? t.noResults : t.noBookmarks} lang={lang} onAdd={openAddModal} onArchive={toggleArchive} onFavorite={toggleFavorite} viewMode={viewMode} /></div>}
            {activeTab === 'archive' && <div className="space-y-5"><div className="section-header"><div><span className="label-meta">{t.archive}</span><h1 className="section-title">{t.archive}</h1><p className="mt-3 text-sm text-on-surface/58">{t.archiveDesc}</p></div>{archivedBookmarks.length > 0 && <button className="danger-button" onClick={() => void Promise.all(archivedBookmarks.map((bookmark) => deleteBookmark(bookmark)))} type="button"><Trash2 className="h-4 w-4" />{t.deleteAll}</button>}</div>{archivedBookmarks.length === 0 ? <div className="panel-surface flex min-h-[260px] flex-col items-center justify-center text-center"><Archive className="mb-4 h-12 w-12 text-on-surface/24" /><h3 className="text-xl font-bold">{t.emptyArchive}</h3><p className="mt-2 max-w-md text-sm text-on-surface/58">{t.archiveDesc}</p></div> : <ArchiveGrid bookmarks={archivedBookmarks} lang={lang} onDelete={deleteBookmark} onRestore={toggleArchive} />}</div>}
            {activeTab === 'personal' && <div className="space-y-8"><section className="hero-panel relative overflow-hidden px-6 py-8 sm:px-8"><img alt="" className="absolute inset-0 h-full w-full object-cover opacity-28" referrerPolicy="no-referrer" src={wallpaper || 'https://picsum.photos/seed/lumina-profile/1600/900'} /><div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" /><div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-end"><div className="h-24 w-24 overflow-hidden rounded-[1.75rem] border border-white/14 bg-white/6 shadow-[0_18px_40px_rgba(0,0,0,0.25)]">{user?.photoURL ? <img alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" src={user.photoURL} /> : <div className="flex h-full w-full items-center justify-center"><UserIcon className="h-10 w-10 text-on-surface/58" /></div>}</div><div className="min-w-0 flex-1"><span className="label-meta text-primary">{t.personalSpace}</span><h1 className="mt-3 font-headline text-4xl font-black tracking-tight">{user?.displayName || t.guest}</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-on-surface/64">{user ? t.personalDesc : t.guestDesc}</p></div></div></section><section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{stats.map((stat) => <MetricCard key={stat.label} {...stat} />)}</section><section className="space-y-4"><div className="section-header"><div><span className="label-meta">{t.preview}</span><h2 className="section-title">{t.yourCollections}</h2></div><button className="primary-button" onClick={openAddModal} type="button"><Plus className="h-4 w-4" />{t.addBookmark}</button></div><div className="grid gap-5 md:grid-cols-2">{categories.filter((category) => category.id === 'work' || category.id === 'personal').map((category) => <CategoryCard category={category} key={category.id} lang={lang} onOpen={() => goToTab(category.id)} />)}</div></section></div>}
            {activeTab === 'settings' && (
              <div className="space-y-5">
                <div>
                  <span className="label-meta">{t.settings}</span>
                  <h1 className="section-title">{t.settings}</h1>
                </div>
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1.04fr)_332px] 2xl:grid-cols-[minmax(0,1.1fr)_356px]">
                  <div className="space-y-5">
                    <div className="panel-surface p-4 sm:p-5">
                      <div className="mb-5">
                        <span className="label-meta">{t.interfaceQuickActions}</span>
                        <h2 className="mt-2 text-2xl font-headline font-extrabold tracking-tight">{t.interfaceQuickActions}</h2>
                        <p className="mt-2 text-sm text-on-surface/58">{t.interfaceQuickActionsDesc}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <button className="ghost-button h-14 w-full justify-center rounded-[1.35rem] px-3" onClick={toggleTheme} type="button">
                          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                          <span className="text-[11px] font-bold uppercase tracking-[0.18em]">THEME</span>
                        </button>
                        <button className="ghost-button h-14 w-full justify-between rounded-[1.35rem] px-4" onClick={toggleLang} type="button">
                          <span className="inline-flex items-center gap-2">
                            <Languages className="h-4 w-4" />
                            <span className="text-[11px] font-bold uppercase tracking-[0.18em]">LANG</span>
                          </span>
                          <span className="text-sm font-semibold text-primary">{currentLanguageCode}</span>
                        </button>
                      </div>
                    </div>

                    <div className="panel-surface p-5 sm:p-6">
                      <div className="section-header mb-5">
                        <div>
                          <span className="label-meta">{t.appearance}</span>
                          <h2 className="text-2xl font-headline font-extrabold tracking-tight">{t.darkTheme}</h2>
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <button className={`theme-preview ${theme === 'dark' ? 'theme-preview-active' : ''}`} onClick={() => setTheme('dark')} type="button">
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
                        <button className={`theme-preview ${theme === 'light' ? 'theme-preview-active' : ''}`} onClick={() => setTheme('light')} type="button">
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

                    <div className="panel-surface p-5 sm:p-6">
                      <div className="section-header mb-5">
                        <div>
                          <span className="label-meta">{t.wallpaper}</span>
                          <h2 className="text-2xl font-headline font-extrabold tracking-tight">{t.wallpaper}</h2>
                        </div>
                      </div>
                      <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
                        <img alt="" className="h-44 w-full object-cover sm:h-52" referrerPolicy="no-referrer" src={wallpaper || 'https://picsum.photos/seed/lumina-wallpaper-preview/1600/900'} />
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
                    <div className="panel-surface p-5 sm:p-6">
                      <p className="label-meta">{t.account}</p>
                      <h2 className="mt-2 text-2xl font-headline font-extrabold tracking-tight">{t.account}</h2>
                      <div className="mt-5 rounded-[1.5rem] bg-white/[0.03] p-4">
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
                          {user ? <button className="danger-button flex-1 justify-center" onClick={() => void firebaseLogOut()} type="button"><LogOut className="h-4 w-4" />{t.signOut}</button> : <button className="primary-button flex-1 justify-center" onClick={() => void signIn()} type="button"><LogIn className="h-4 w-4" />{t.signIn}</button>}
                        </div>
                      </div>
                    </div>

                    <div className="curator-glass rounded-[2rem] p-5 sm:p-6">
                      <div className="mb-5 flex items-center justify-between">
                        <div>
                          <p className="label-meta text-primary">{t.systemStatus}</p>
                          <h2 className="mt-2 text-2xl font-headline font-extrabold tracking-tight">{t.syncState}</h2>
                        </div>
                        <WandSparkles className="h-5 w-5 text-primary" />
                      </div>
                      <div className="space-y-4 text-sm text-on-surface/62">
                        <div className="flex items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3">
                          <span>{t.syncState}</span>
                          <span className="font-semibold text-primary">{user ? t.synced : t.localOnly}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3">
                          <span>{t.lastSync}</span>
                          <span className="font-semibold">{user ? t.lastSyncValueSynced : t.lastSyncValueOffline}</span>
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
            {activeCategory && !['dashboard', 'favorites', 'archive', 'personal', 'settings'].includes(activeTab) && <div className="space-y-5"><div className="section-header"><div><span className="label-meta">{t.sectionCategory}</span><h1 className="section-title">{resolveCategoryTitle(activeCategory, lang)}</h1><p className="mt-3 text-sm text-on-surface/58">{resolveCategorySubtitle(activeCategory, lang)}</p></div><ViewSwitch gridLabel={t.grid} listLabel={t.list} onChange={setViewMode} viewMode={viewMode} /></div><BookmarkSection addLabel={t.addBookmark} bookmarks={displayedBookmarks} emptyBody={queryText ? t.commandEmpty : t.noBookmarksDesc} emptyTitle={queryText ? t.noResults : t.noBookmarks} lang={lang} onAdd={openAddModal} onArchive={toggleArchive} onFavorite={toggleFavorite} viewMode={viewMode} /></div>}
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

        {!isAuthReady && <div className="pointer-events-none fixed right-5 top-5 z-[130] flex items-center gap-2 rounded-full border border-primary/15 bg-background/80 px-4 py-2 text-sm text-on-surface backdrop-blur-md"><Loader2 className="h-4 w-4 animate-spin text-primary" /><span>{t.loadingAuth}</span></div>}
      </div>
    </ErrorBoundary>
  );
}
