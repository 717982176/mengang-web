import React, { useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { db } from '../firebase';
import {
  normalizeBookmark,
  type BookmarkRecord,
  type CategoryRecord,
  type Lang,
} from '../appData';
import { buildBookmarkDocument } from '../cloudModel';
import {
  buildBookmarkExportJson,
  canImportBookmarkUrl,
  createBookmarkFingerprint,
  normalizeBookmarkUrl,
  parseBookmarkImportText,
} from '../bookmarkTransfer';
import { fetchPageMeta, suggestCategory } from '../gemini';
import { TRANSLATIONS } from '../appData';

interface UseBookmarkActionsParams {
  user: FirebaseUser | null;
  categories: CategoryRecord[];
  setCategories: React.Dispatch<React.SetStateAction<CategoryRecord[]>>;
  allBookmarks: BookmarkRecord[];
  archivedBookmarks: BookmarkRecord[];
  activeTab: string;
  lang: Lang;
  setNotice: (notice: { tone: 'success' | 'error'; message: string } | null) => void;
  setSyncError: (error: string | null) => void;
  setLastSyncAt: (ts: number | null) => void;
  setIsAddModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsCommandPaletteOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useBookmarkActions({
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
}: UseBookmarkActionsParams) {
  const [isSavingBookmark, setIsSavingBookmark] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isAiFilling, setIsAiFilling] = useState(false);
  const [newBookmark, setNewBookmark] = useState({
    title: '',
    url: '',
    description: '',
    tag: '',
    categoryId: 'work',
  });
  const [editingBookmark, setEditingBookmark] = useState<BookmarkRecord | null>(null);
  const [editForm, setEditForm] = useState({ title: '', url: '', description: '', tag: '', categoryId: 'work' });

  const t = TRANSLATIONS[lang];
  const createMessage = (zh: string, en: string) => (lang === 'zh' ? zh : en);

  const updateBookmarkInState = (bookmarkId: string, updater: (bookmark: BookmarkRecord) => BookmarkRecord) => {
    setCategories((prev) =>
      prev.map((category) => ({
        ...category,
        bookmarks: category.bookmarks.map((bookmark) =>
          bookmark.id === bookmarkId ? updater(bookmark) : bookmark,
        ),
      })),
    );
  };

  const removeBookmarkFromState = (bookmarkId: string) => {
    setCategories((prev) =>
      prev.map((category) => ({
        ...category,
        bookmarks: category.bookmarks.filter((bookmark) => bookmark.id !== bookmarkId),
      })),
    );
  };

  const setBookmarkValue = async (bookmark: BookmarkRecord, patch: Partial<BookmarkRecord>) => {
    if (!user) {
      setNotice({ tone: 'error', message: createMessage('请先登录后再操作书签。', 'Sign in before editing bookmarks.') });
      return;
    }

    const nextBookmark = normalizeBookmark({
      ...bookmark,
      ...patch,
      url: normalizeBookmarkUrl(String(patch.url ?? bookmark.url)) || bookmark.url,
      createdAt: bookmark.createdAt,
    });

    updateBookmarkInState(bookmark.id, () => nextBookmark);
    try {
      await setDoc(doc(db, `users/${user.uid}/bookmarks/${bookmark.id}`), buildBookmarkDocument(nextBookmark, user.uid), {
        merge: true,
      });
      setSyncError(null);
      setLastSyncAt(Date.now());
    } catch (error) {
      console.error('Failed to update bookmark', error);
      updateBookmarkInState(bookmark.id, () => bookmark);
      setNotice({ tone: 'error', message: createMessage('书签更新失败，请稍后重试。', 'Bookmark update failed. Please try again.') });
      setSyncError(lang === 'zh' ? '书签更新失败' : 'Failed to update bookmark');
    }
  };

  const toggleFavorite = (bookmark: BookmarkRecord) =>
    void setBookmarkValue(bookmark, { isFavorite: !bookmark.isFavorite });

  const toggleArchive = (bookmark: BookmarkRecord) =>
    void setBookmarkValue(bookmark, { isArchived: !bookmark.isArchived });

  const deleteBookmark = async (bookmark: BookmarkRecord) => {
    if (!user) {
      setNotice({ tone: 'error', message: createMessage('请先登录后再操作书签。', 'Sign in before editing bookmarks.') });
      return;
    }

    const previousCategories = categories;
    removeBookmarkFromState(bookmark.id);
    try {
      await deleteDoc(doc(db, `users/${user.uid}/bookmarks/${bookmark.id}`));
      setSyncError(null);
      setLastSyncAt(Date.now());
    } catch (error) {
      console.error('Failed to delete bookmark', error);
      setCategories(previousCategories);
      setNotice({ tone: 'error', message: createMessage('删除失败，请稍后重试。', 'Delete failed. Please try again.') });
      setSyncError(lang === 'zh' ? '书签删除失败' : 'Failed to delete bookmark');
    }
  };

  const handleDeleteArchivedAll = async () => {
    if (!user || archivedBookmarks.length === 0) return;

    const previousCategories = categories;
    setCategories((prev) =>
      prev.map((category) => ({
        ...category,
        bookmarks: category.bookmarks.filter((bookmark) => !bookmark.isArchived),
      })),
    );

    try {
      const batch = writeBatch(db);
      for (const bookmark of archivedBookmarks) {
        batch.delete(doc(db, `users/${user.uid}/bookmarks/${bookmark.id}`));
      }
      await batch.commit();
      setSyncError(null);
      setLastSyncAt(Date.now());
      setNotice({
        tone: 'success',
        message: createMessage(`已删除 ${archivedBookmarks.length} 个归档书签。`, `Deleted ${archivedBookmarks.length} archived bookmarks.`),
      });
    } catch (error) {
      console.error('Failed to clear archive', error);
      setCategories(previousCategories);
      setNotice({ tone: 'error', message: createMessage('清空归档失败，请稍后重试。', 'Failed to clear archive. Please try again.') });
      setSyncError(createMessage('批量删除失败', 'Failed to clear archive'));
    }
  };

  const openAddModal = () => {
    const activeCategoryId =
      activeTab !== 'dashboard' &&
      activeTab !== 'favorites' &&
      activeTab !== 'archive' &&
      activeTab !== 'settings' &&
      categories.some((category) => category.id === activeTab)
        ? activeTab
        : null;

    setNotice(null);
    setNewBookmark((prev) => ({
      ...prev,
      categoryId: activeCategoryId || prev.categoryId,
    }));
    setIsCommandPaletteOpen(false);
    setIsAddModalOpen(true);
  };

  const openEditModal = (bookmark: BookmarkRecord) => {
    setEditingBookmark(bookmark);
    setEditForm({
      title: bookmark.title,
      url: bookmark.url,
      description: bookmark.description,
      tag: bookmark.tag,
      categoryId: bookmark.categoryId,
    });
  };

  const handleSaveEdit = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (!editingBookmark) return;
    if (!editForm.title.trim() || !editForm.url.trim()) {
      setNotice({ tone: 'error', message: createMessage('标题和链接不能为空。', 'Title and URL are required.') });
      return;
    }
    if (!canImportBookmarkUrl(editForm.url.trim())) {
      setNotice({ tone: 'error', message: createMessage('链接格式不正确，请使用 https:// 开头的有效地址。', 'Invalid URL. Please use a valid address starting with https://') });
      return;
    }
    setIsSavingBookmark(true);
    try {
      await setBookmarkValue(editingBookmark, {
        title: editForm.title.trim(),
        url: editForm.url.trim(),
        description: editForm.description.trim(),
        tag: editForm.tag.trim() || editingBookmark.tag,
        categoryId: editForm.categoryId,
      });
      setNotice({ tone: 'success', message: createMessage('书签已更新。', 'Bookmark updated.') });
      setEditingBookmark(null);
    } finally {
      setIsSavingBookmark(false);
    }
  };

  const handleAddBookmark = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (!newBookmark.title.trim() || !newBookmark.url.trim() || !newBookmark.categoryId) {
      setNotice({ tone: 'error', message: createMessage('请先填写标题、链接和分类。', 'Fill in the title, URL, and category first.') });
      return;
    }
    if (!user) {
      setNotice({ tone: 'error', message: createMessage('请先登录后再添加书签。', 'Sign in before adding bookmarks.') });
      return;
    }
    if (!canImportBookmarkUrl(newBookmark.url)) {
      setNotice({
        tone: 'error',
        message: createMessage('链接格式不正确，已支持自动补全 https://。', 'The URL is invalid. Missing https:// is handled automatically.'),
      });
      return;
    }

    const normalizedUrl = normalizeBookmarkUrl(newBookmark.url);
    const fingerprint = createBookmarkFingerprint({
      title: newBookmark.title,
      url: normalizedUrl,
      description: '',
      tag: '',
      categoryId: newBookmark.categoryId,
      isFavorite: false,
      isArchived: false,
    });

    if (allBookmarks.some((bookmark) => createBookmarkFingerprint(bookmark) === fingerprint)) {
      setNotice({ tone: 'error', message: createMessage('这个书签已经存在了。', 'That bookmark already exists.') });
      return;
    }

    setIsSavingBookmark(true);
    try {
      const bookmarkRef = doc(collection(db, `users/${user.uid}/bookmarks`));
      const bookmark = normalizeBookmark({
        id: bookmarkRef.id,
        title: newBookmark.title,
        url: normalizedUrl,
        description: newBookmark.description,
        tag: newBookmark.tag || 'General',
        categoryId: newBookmark.categoryId,
      });

      await setDoc(bookmarkRef, {
        ...buildBookmarkDocument(bookmark, user.uid),
        createdAt: serverTimestamp(),
      });
      setNewBookmark({ title: '', url: '', description: '', tag: '', categoryId: newBookmark.categoryId });
      setIsAddModalOpen(false);
      setSyncError(null);
      setLastSyncAt(Date.now());
      setNotice({ tone: 'success', message: createMessage('书签已添加。', 'Bookmark added.') });
    } catch (error) {
      console.error('Failed to add bookmark', error);
      setNotice({ tone: 'error', message: createMessage('添加失败，请稍后重试。', 'Add failed. Please try again.') });
      setSyncError(lang === 'zh' ? '书签创建失败' : 'Failed to create bookmark');
    } finally {
      setIsSavingBookmark(false);
    }
  };

  const handleUrlBlur = async () => {
    const url = newBookmark.url.trim();
    if (!url || !canImportBookmarkUrl(url)) return;
    // Only auto-fill when title is still empty (user hasn't typed one)
    if (newBookmark.title.trim()) return;

    setIsAiFilling(true);
    try {
      const normalizedUrl = normalizeBookmarkUrl(url) || url;
      const nonArchiveCategories = categories
        .filter((c) => c.id !== 'archive')
        .map(({ id, title, order, iconKey, color }) => ({ id, title, order, iconKey, color }));

      const [meta, categoryId] = await Promise.all([
        fetchPageMeta(normalizedUrl),
        suggestCategory(normalizedUrl, newBookmark.title, nonArchiveCategories, lang),
      ]);

      if (meta) {
        setNewBookmark((prev) => ({
          ...prev,
          title: prev.title || meta.title,
          description: prev.description || meta.description,
          ...(categoryId ? { categoryId } : {}),
        }));
        setNotice({ tone: 'success', message: t.aiAutoFillDone });
      } else {
        setNotice({ tone: 'error', message: t.aiAutoFillFail });
      }
    } catch {
      setNotice({ tone: 'error', message: t.aiAutoFillFail });
    } finally {
      setIsAiFilling(false);
    }
  };

  const handleImportBookmarks = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!user) {
      setNotice({ tone: 'error', message: createMessage('请先登录后再导入。', 'Sign in before importing bookmarks.') });
      return;
    }

    setIsImporting(true);

    try {
      const content = await file.text();
      const categoryIds = categories.filter((category) => category.id !== 'archive').map((category) => category.id);
      const parsed = parseBookmarkImportText(file.name, content, categoryIds, newBookmark.categoryId);
      const existingFingerprints = new Set(allBookmarks.map((bookmark) => createBookmarkFingerprint(bookmark)));
      const importedFingerprints = new Set<string>();
      let duplicateCount = 0;

      const candidates = parsed.bookmarks.filter((bookmark) => {
        if (!canImportBookmarkUrl(bookmark.url)) {
          return false;
        }

        const fingerprint = createBookmarkFingerprint(bookmark);
        if (!fingerprint || existingFingerprints.has(fingerprint) || importedFingerprints.has(fingerprint)) {
          duplicateCount += 1;
          return false;
        }

        importedFingerprints.add(fingerprint);
        return true;
      });

      if (candidates.length === 0) {
        setNotice({
          tone: parsed.invalidCount > 0 || duplicateCount > 0 ? 'error' : 'success',
          message: createMessage(
            `没有可导入的新书签。重复 ${duplicateCount} 个，无效 ${parsed.invalidCount} 个。`,
            `No new bookmarks to import. ${duplicateCount} duplicates, ${parsed.invalidCount} invalid.`,
          ),
        });
        return;
      }

      for (let start = 0; start < candidates.length; start += 400) {
        const batch = writeBatch(db);
        for (const candidate of candidates.slice(start, start + 400)) {
          const bookmarkRef = doc(collection(db, `users/${user.uid}/bookmarks`));
          const bookmark = normalizeBookmark({
            id: bookmarkRef.id,
            title: candidate.title,
            url: candidate.url,
            description: candidate.description,
            tag: candidate.tag,
            categoryId: candidate.categoryId,
            isFavorite: candidate.isFavorite,
            isArchived: candidate.isArchived,
          });

          batch.set(bookmarkRef, {
            ...buildBookmarkDocument(bookmark, user.uid),
            createdAt: serverTimestamp(),
          });
        }

        await batch.commit();
      }

      setSyncError(null);
      setLastSyncAt(Date.now());
      setNotice({
        tone: 'success',
        message: createMessage(
          `已导入 ${candidates.length} 个书签，跳过重复 ${duplicateCount} 个，无效 ${parsed.invalidCount} 个。`,
          `Imported ${candidates.length} bookmarks, skipped ${duplicateCount} duplicates and ${parsed.invalidCount} invalid entries.`,
        ),
      });
    } catch (error) {
      console.error('Failed to import bookmarks', error);
      const isInvalidJson = error instanceof Error && error.message === 'INVALID_JSON';
      setNotice({
        tone: 'error',
        message: isInvalidJson
          ? createMessage('JSON 文件格式无效，请检查文件内容是否完整。', 'Invalid JSON file. Please check that the file is not corrupted.')
          : createMessage(
              '导入失败。请使用浏览器导出的 HTML 书签文件，或 JSON / CSV。',
              'Import failed. Use a browser-exported HTML bookmark file, JSON, or CSV.',
            ),
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportBookmarks = () => {
    if (allBookmarks.length === 0) {
      setNotice({ tone: 'error', message: createMessage('当前还没有书签可以导出。', 'There are no bookmarks to export yet.') });
      return;
    }

    const blob = new Blob([buildBookmarkExportJson(allBookmarks)], { type: 'application/json;charset=utf-8' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `lumina-bookmarks-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(downloadUrl);

    setNotice({ tone: 'success', message: createMessage('已导出当前书签备份。', 'Exported the current bookmark backup.') });
  };

  return {
    isSavingBookmark,
    isImporting,
    isAiFilling,
    newBookmark,
    setNewBookmark,
    editingBookmark,
    setEditingBookmark,
    editForm,
    setEditForm,
    updateBookmarkInState,
    removeBookmarkFromState,
    setBookmarkValue,
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
  };
}
