import { useEffect } from 'react';
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { db } from '../firebase';
import { CATEGORY_META, type BookmarkRecord, type CategoryRecord } from '../appData';
import {
  normalizeCategoryDocument,
  normalizeBookmarkDocument,
  normalizePreferences,
  type PreferencesDocument,
  type UserPreferences,
} from '../cloudModel';
import type { MutableRefObject } from 'react';

interface UseCloudSyncParams {
  user: FirebaseUser | null;
  isAuthReady: boolean;
  isBootstrapDone: boolean;
  preferencesRef: MutableRefObject<UserPreferences>;
  setLang: React.Dispatch<React.SetStateAction<import('../appData').Lang>>;
  setTheme: React.Dispatch<React.SetStateAction<import('../appData').Theme>>;
  setWallpaper: React.Dispatch<React.SetStateAction<string | null>>;
  setCategories: React.Dispatch<React.SetStateAction<CategoryRecord[]>>;
  setSyncError: (error: string | null) => void;
  setLastSyncAt: (ts: number | null) => void;
}

export function useCloudSync({
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
}: UseCloudSyncParams) {
  // Preferences sync
  useEffect(() => {
    if (!user || !isAuthReady || !isBootstrapDone) return;

    const preferencesDocRef = doc(db, `users/${user.uid}/settings/preferences`);
    return onSnapshot(
      preferencesDocRef,
      (snapshot) => {
        if (!snapshot.exists()) return;

        const nextPreferences = normalizePreferences(
          snapshot.data() as Partial<PreferencesDocument>,
          preferencesRef.current,
        );

        setLang(nextPreferences.lang);
        setTheme(nextPreferences.theme);
        setWallpaper(nextPreferences.wallpaper);
        setSyncError(null);
        setLastSyncAt(Date.now());
      },
      (error) => {
        console.error('Failed to sync preferences', error);
        setSyncError(preferencesRef.current.lang === 'zh' ? '设置同步失败' : 'Failed to sync settings');
      },
    );
  }, [isAuthReady, isBootstrapDone, user]);

  // Categories + bookmarks sync
  useEffect(() => {
    if (!user || !isAuthReady || !isBootstrapDone) return;

    const categoriesQuery = query(collection(db, `users/${user.uid}/categories`), orderBy('order', 'asc'));
    const bookmarksQuery = query(collection(db, `users/${user.uid}/bookmarks`), orderBy('createdAt', 'desc'));
    let remoteBookmarks: BookmarkRecord[] = [];
    let remoteCategories: Omit<CategoryRecord, 'bookmarks'>[] = [];

    const syncCategories = () => {
      if (remoteCategories.length === 0) return;

      setCategories(
        remoteCategories.map((category) => ({
          ...category,
          bookmarks: remoteBookmarks.filter((bookmark) => bookmark.categoryId === category.id),
        })),
      );
      setSyncError(null);
      setLastSyncAt(Date.now());
    };

    const unsubscribeCategories = onSnapshot(
      categoriesQuery,
      (snapshot) => {
        remoteCategories = snapshot.docs.map((entry) => {
          const data = entry.data();
          const meta = CATEGORY_META[entry.id as keyof typeof CATEGORY_META];

          return normalizeCategoryDocument(entry.id, data, {
            order: meta?.order ?? 99,
            iconKey: meta?.iconKey ?? 'LayoutGrid',
            color: meta?.color ?? 'slate',
          });
        });

        syncCategories();
      },
      (error) => {
        console.error('Failed to sync categories', error);
        setSyncError(preferencesRef.current.lang === 'zh' ? '分类同步失败' : 'Failed to sync categories');
      },
    );

    const unsubscribeBookmarks = onSnapshot(
      bookmarksQuery,
      (snapshot) => {
        remoteBookmarks = snapshot.docs.map((entry) =>
          normalizeBookmarkDocument(entry.id, entry.data()),
        );
        syncCategories();
      },
      (error) => {
        console.error('Failed to sync bookmarks', error);
        setSyncError(preferencesRef.current.lang === 'zh' ? '书签同步失败' : 'Failed to sync bookmarks');
      },
    );

    return () => {
      unsubscribeCategories();
      unsubscribeBookmarks();
    };
  }, [isAuthReady, isBootstrapDone, user]);
}
