import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { auth, db, logOut as firebaseLogOut, signIn } from '../firebase';
import { buildDefaultCategories, type CategoryRecord, type Lang } from '../appData';
import {
  buildCategoryDocument,
  buildBookmarkDocument,
  buildPreferencesDocument,
  buildUserProfileDocument,
  normalizeCategoryDocument,
  normalizeBookmarkDocument,
  type UserPreferences,
} from '../cloudModel';
import type { MutableRefObject } from 'react';

interface UseAuthParams {
  preferencesRef: MutableRefObject<UserPreferences>;
  setCategories: React.Dispatch<React.SetStateAction<CategoryRecord[]>>;
  setNotice: (notice: { tone: 'success' | 'error'; message: string } | null) => void;
  setSyncError: (error: string | null) => void;
  setLastSyncAt: (ts: number | null) => void;
  lang: Lang;
}

export function useAuth({
  preferencesRef,
  setCategories,
  setNotice,
  setSyncError,
  setLastSyncAt,
  lang,
}: UseAuthParams) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isBootstrapDone, setIsBootstrapDone] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [syncError, setSyncErrorLocal] = useState<string | null>(null);
  const [lastSyncAt, setLastSyncAtLocal] = useState<number | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const createMessage = (zh: string, en: string) => (lang === 'zh' ? zh : en);

  const authErrorLabel =
    authError || (lang === 'zh' ? '登录失败，请稍后重试。' : 'Sign-in failed. Please try again.');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthReady(true);
      if (!firebaseUser) {
        setCategories(buildDefaultCategories());
        setSyncError(null);
        setSyncErrorLocal(null);
        setLastSyncAt(null);
        setLastSyncAtLocal(null);
        setIsBootstrapDone(false);
        return;
      }

      setAuthError(null);
      setSyncError(null);
      setSyncErrorLocal(null);

      try {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
          await setDoc(userRef, {
            ...buildUserProfileDocument(firebaseUser),
            createdAt: serverTimestamp(),
          });
        } else if (!userDoc.data().role) {
          await setDoc(
            userRef,
            {
              role: 'user',
              displayName: firebaseUser.displayName ?? userDoc.data().displayName ?? null,
              photoURL: firebaseUser.photoURL ?? userDoc.data().photoURL ?? null,
            },
            { merge: true },
          );
        }

        const categoriesCollection = collection(db, `users/${firebaseUser.uid}/categories`);
        const existingCategories = await getDocs(categoriesCollection);
        const existingCategoryMap = new Map(existingCategories.docs.map((entry) => [entry.id, entry.data()]));
        for (const category of buildDefaultCategories()) {
          const existingCategory = existingCategoryMap.get(category.id) ?? {};
          const normalizedCategory = normalizeCategoryDocument(category.id, existingCategory, {
            order: category.order,
            iconKey: category.iconKey,
            color: category.color,
          });

          await setDoc(
            doc(categoriesCollection, category.id),
            buildCategoryDocument(
              {
                ...category,
                ...normalizedCategory,
                bookmarks: [],
              },
              firebaseUser.uid,
            ),
          );
        }

        const bookmarksCollection = collection(db, `users/${firebaseUser.uid}/bookmarks`);
        const existingBookmarks = await getDocs(bookmarksCollection);
        for (const bookmarkEntry of existingBookmarks.docs) {
          const bookmarkData = bookmarkEntry.data();
          const normalizedBookmark = normalizeBookmarkDocument(bookmarkEntry.id, bookmarkData);
          await setDoc(doc(bookmarksCollection, bookmarkEntry.id), {
            ...buildBookmarkDocument(normalizedBookmark, firebaseUser.uid),
            createdAt: bookmarkData.createdAt ?? serverTimestamp(),
          });
        }

        const preferencesDocRef = doc(db, `users/${firebaseUser.uid}/settings/preferences`);
        const preferencesDoc = await getDoc(preferencesDocRef);
        if (!preferencesDoc.exists()) {
          await setDoc(preferencesDocRef, {
            ...buildPreferencesDocument(preferencesRef.current),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (error) {
        console.error('Failed to bootstrap profile', error);
        const errMsg = preferencesRef.current.lang === 'zh' ? '云端初始化失败' : 'Cloud bootstrap failed';
        setSyncError(errMsg);
        setSyncErrorLocal(errMsg);
      } finally {
        setIsBootstrapDone(true);
      }
    });
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignIn = async () => {
    setAuthError(null);
    try {
      await signIn();
    } catch (error) {
      console.error('Failed to sign in', error);
      setAuthError(authErrorLabel);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await firebaseLogOut();
    } catch (error) {
      console.error('Failed to sign out', error);
      setNotice({ tone: 'error', message: createMessage('退出登录失败，请稍后重试。', 'Sign-out failed. Please try again.') });
    } finally {
      setIsSigningOut(false);
    }
  };

  return {
    user,
    isAuthReady,
    isBootstrapDone,
    authError,
    syncError,
    setSyncError: (err: string | null) => {
      setSyncErrorLocal(err);
      setSyncError(err);
    },
    lastSyncAt,
    setLastSyncAt: (ts: number | null) => {
      setLastSyncAtLocal(ts);
      setLastSyncAt(ts);
    },
    isSigningOut,
    handleSignIn,
    handleSignOut,
  };
}
