import React, { useEffect, useRef, useState } from 'react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { db } from '../firebase';
import {
  STORAGE_KEYS,
  type Lang,
  type Theme,
} from '../appData';
import {
  type PreferencesDocument,
  type UserPreferences,
} from '../cloudModel';
import type { MutableRefObject } from 'react';

interface UsePreferencesParams {
  /** A ref to the current Firebase user — using a ref avoids the chicken-and-egg
   *  dependency between usePreferences (needs user) and useAuth (needs preferencesRef). */
  userRef: MutableRefObject<FirebaseUser | null>;
  setNotice: (notice: { tone: 'success' | 'error'; message: string } | null) => void;
  setSyncError: (error: string | null) => void;
  setLastSyncAt: (ts: number | null) => void;
}

export function usePreferences({
  userRef,
  setNotice,
  setSyncError,
  setLastSyncAt,
}: UsePreferencesParams) {
  const [lang, setLang] = useState<Lang>('zh');
  const [theme, setTheme] = useState<Theme>('dark');
  const [wallpaper, setWallpaper] = useState<string | null>(null);
  const [wallpaperInput, setWallpaperInput] = useState('');
  const preferencesRef = useRef<UserPreferences>({ lang, theme, wallpaper });

  const createMessage = (zh: string, en: string) => (lang === 'zh' ? zh : en);

  // Load from localStorage on mount
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
  }, []);

  // Sync theme class + persist to localStorage
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  }, [theme]);

  // Persist lang to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.lang, lang);
  }, [lang]);

  // Keep ref in sync
  useEffect(() => {
    preferencesRef.current = { lang, theme, wallpaper };
  }, [lang, theme, wallpaper]);

  // Persist wallpaper to localStorage
  useEffect(() => {
    if (wallpaper) {
      localStorage.setItem(STORAGE_KEYS.wallpaper, wallpaper);
      setWallpaperInput(wallpaper);
      return;
    }
    localStorage.removeItem(STORAGE_KEYS.wallpaper);
    setWallpaperInput('');
  }, [wallpaper]);

  const persistPreferences = async (patch: Partial<UserPreferences>) => {
    const user = userRef.current;
    if (!user) return;

    try {
      await setDoc(
        doc(db, `users/${user.uid}/settings/preferences`),
        {
          ...patch,
          updatedAt: serverTimestamp(),
        } satisfies Partial<PreferencesDocument> & { updatedAt: ReturnType<typeof serverTimestamp> },
        { merge: true },
      );
      setSyncError(null);
      setLastSyncAt(Date.now());
    } catch (error) {
      console.error('Failed to persist preferences', error);
      setNotice({ tone: 'error', message: createMessage('设置同步失败，请稍后重试。', 'Settings sync failed. Please try again.') });
      setSyncError(lang === 'zh' ? '设置同步失败' : 'Failed to sync settings');
    }
  };

  const setLanguagePreference = (nextLang: Lang) => {
    setLang(nextLang);
    void persistPreferences({ lang: nextLang });
  };

  const setThemePreference = (nextTheme: Theme) => {
    setTheme(nextTheme);
    void persistPreferences({ theme: nextTheme });
  };

  const setWallpaperPreference = (nextWallpaper: string | null) => {
    setWallpaper(nextWallpaper);
    void persistPreferences({ wallpaper: nextWallpaper });
  };

  const toggleLang = () => setLanguagePreference(lang === 'zh' ? 'en' : 'zh');
  const toggleTheme = () => setThemePreference(theme === 'dark' ? 'light' : 'dark');

  const applyWallpaper = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setWallpaperPreference(trimmed);
  };

  const resetWallpaper = () => {
    setWallpaperPreference(null);
  };

  const handleWallpaperUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setNotice({
        tone: 'error',
        message: createMessage(
          '仅支持 JPG、PNG、WebP、GIF 格式的图片。',
          'Only JPG, PNG, WebP, or GIF images are supported.',
        ),
      });
      event.target.value = '';
      return;
    }

    const maxSizeKB = 500;
    if (file.size > maxSizeKB * 1024) {
      setNotice({
        tone: 'error',
        message: createMessage(
          `图片文件不能超过 ${maxSizeKB} KB，当前文件为 ${Math.round(file.size / 1024)} KB。`,
          `Image must be under ${maxSizeKB} KB. Current file is ${Math.round(file.size / 1024)} KB.`,
        ),
      });
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') applyWallpaper(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return {
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
    setLanguagePreference,
    setThemePreference,
    setWallpaperPreference,
    persistPreferences,
  };
}
