import { useEffect, useRef, useState } from 'react';
import { searchBookmarks as aiSearchBookmarks } from '../gemini';
import type { BookmarkRecord, Lang } from '../appData';

interface UseCommandPaletteParams {
  searchQuery: string;
  lang: Lang;
  nonArchivedBookmarksRef: React.MutableRefObject<BookmarkRecord[]>;
  setIsMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsAddModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useCommandPalette({
  searchQuery,
  lang,
  nonArchivedBookmarksRef,
  setIsMobileMenuOpen,
  setIsAddModalOpen,
}: UseCommandPaletteParams) {
  const [paletteQuery, setPaletteQuery] = useState('');
  const [aiSearchResults, setAiSearchResults] = useState<BookmarkRecord[]>([]);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Keyboard shortcut: Cmd/Ctrl+K to open, Escape to close
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
        setAiSearchResults([]);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [searchQuery]);

  // AI search debounce effect
  useEffect(() => {
    const query = paletteQuery.trim();
    if (!query.startsWith('?') || query.length < 3) {
      setAiSearchResults([]);
      return;
    }
    const naturalQuery = query.slice(1).trim();
    if (!naturalQuery) return;

    const controller = { cancelled: false };
    const debounceTimer = window.setTimeout(() => {
      setIsAiSearching(true);
      setAiSearchResults([]);
      // Read from ref so we always use the latest bookmarks without adding
      // nonArchivedBookmarks to the dependency array (which would re-trigger on every edit)
      aiSearchBookmarks(naturalQuery, nonArchivedBookmarksRef.current, lang).then((results) => {
        if (!controller.cancelled) setAiSearchResults(results);
      }).catch(() => {
        if (!controller.cancelled) setAiSearchResults([]);
      }).finally(() => {
        if (!controller.cancelled) setIsAiSearching(false);
      });
    }, 500);
    return () => { window.clearTimeout(debounceTimer); controller.cancelled = true; setIsAiSearching(false); };
  }, [paletteQuery, lang]);

  return {
    paletteQuery,
    setPaletteQuery,
    aiSearchResults,
    setAiSearchResults,
    isAiSearching,
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
  };
}
