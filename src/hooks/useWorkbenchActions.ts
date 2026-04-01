import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { db } from '../firebase';
import type { FavoriteGroup, NoteRecord, ProjectGroup, TaskRecord, TaskStatus } from '../appData';
import {
  buildFavoriteGroupDocument,
  buildNoteDocument,
  buildProjectGroupDocument,
  buildTaskDocument,
  normalizeFavoriteGroupDocument,
  normalizeNoteDocument,
  normalizeProjectGroupDocument,
  normalizeTaskDocument,
} from '../cloudModel';

interface UseWorkbenchActionsParams {
  user: FirebaseUser | null;
  isBootstrapDone: boolean;
  setNotice: (notice: { tone: 'success' | 'error'; message: string } | null) => void;
}

export function useWorkbenchActions({ user, isBootstrapDone, setNotice }: UseWorkbenchActionsParams) {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [projectGroups, setProjectGroups] = useState<ProjectGroup[]>([]);
  const [favoriteGroups, setFavoriteGroups] = useState<FavoriteGroup[]>([]);
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);

  const msg = useCallback(
    (zh: string, en: string) => (navigator.language.startsWith('zh') ? zh : en),
    [],
  );

  // ── Firestore real-time listeners ──────────────────────────────────────────

  useEffect(() => {
    if (!user || !isBootstrapDone) return;

    const q = query(collection(db, `users/${user.uid}/tasks`), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      setTasks(snap.docs.map((d) => normalizeTaskDocument(d.id, d.data())));
    });
  }, [user, isBootstrapDone]);

  useEffect(() => {
    if (!user || !isBootstrapDone) return;

    const q = query(collection(db, `users/${user.uid}/notes`), orderBy('updatedAt', 'desc'));
    return onSnapshot(q, (snap) => {
      setNotes(snap.docs.map((d) => normalizeNoteDocument(d.id, d.data())));
    });
  }, [user, isBootstrapDone]);

  useEffect(() => {
    if (!user || !isBootstrapDone) return;

    const q = query(collection(db, `users/${user.uid}/projectGroups`), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snap) => {
      setProjectGroups(snap.docs.map((d) => normalizeProjectGroupDocument(d.id, d.data())));
    });
  }, [user, isBootstrapDone]);

  useEffect(() => {
    if (!user || !isBootstrapDone) return;

    const q = query(collection(db, `users/${user.uid}/favoriteGroups`), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snap) => {
      setFavoriteGroups(snap.docs.map((d) => normalizeFavoriteGroupDocument(d.id, d.data())));
    });
  }, [user, isBootstrapDone]);

  // ── Task actions ───────────────────────────────────────────────────────────

  const addTask = useCallback(
    async (title: string) => {
      if (!user || !title.trim()) return;
      setIsSavingTask(true);
      try {
        const ref = doc(collection(db, `users/${user.uid}/tasks`));
        const task: TaskRecord = {
          id: ref.id,
          title: title.trim(),
          status: 'todo',
          createdAt: Date.now(),
        };
        await setDoc(ref, { ...buildTaskDocument(task, user.uid), createdAt: serverTimestamp() });
      } catch {
        setNotice({ tone: 'error', message: msg('任务添加失败', 'Failed to add task') });
      } finally {
        setIsSavingTask(false);
      }
    },
    [user, msg, setNotice],
  );

  const updateTaskStatus = useCallback(
    async (taskId: string, status: TaskStatus) => {
      if (!user) return;
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
      try {
        await updateDoc(doc(db, `users/${user.uid}/tasks/${taskId}`), { status });
      } catch {
        setNotice({ tone: 'error', message: msg('任务更新失败', 'Failed to update task') });
      }
    },
    [user, msg, setNotice],
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      if (!user) return;
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      try {
        await deleteDoc(doc(db, `users/${user.uid}/tasks/${taskId}`));
      } catch {
        setNotice({ tone: 'error', message: msg('任务删除失败', 'Failed to delete task') });
      }
    },
    [user, msg, setNotice],
  );

  // ── Note actions ───────────────────────────────────────────────────────────

  const saveNote = useCallback(
    async (noteId: string | null, content: string) => {
      if (!user) return;
      setIsSavingNote(true);
      try {
        const now = Date.now();
        if (noteId) {
          setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, content, updatedAt: now } : n)));
          await updateDoc(doc(db, `users/${user.uid}/notes/${noteId}`), {
            content,
            updatedAt: serverTimestamp(),
          });
        } else {
          const ref = doc(collection(db, `users/${user.uid}/notes`));
          const note: NoteRecord = {
            id: ref.id,
            content,
            isPinned: false,
            updatedAt: now,
            createdAt: now,
          };
          await setDoc(ref, {
            ...buildNoteDocument(note, user.uid),
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
          });
        }
      } catch {
        setNotice({ tone: 'error', message: msg('便签保存失败', 'Failed to save note') });
      } finally {
        setIsSavingNote(false);
      }
    },
    [user, msg, setNotice],
  );

  const toggleNotePin = useCallback(
    async (note: NoteRecord) => {
      if (!user) return;
      const next = !note.isPinned;
      setNotes((prev) => prev.map((n) => (n.id === note.id ? { ...n, isPinned: next } : n)));
      try {
        await updateDoc(doc(db, `users/${user.uid}/notes/${note.id}`), { isPinned: next });
      } catch {
        setNotice({ tone: 'error', message: msg('便签更新失败', 'Failed to update note') });
      }
    },
    [user, msg, setNotice],
  );

  const deleteNote = useCallback(
    async (noteId: string) => {
      if (!user) return;
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      try {
        await deleteDoc(doc(db, `users/${user.uid}/notes/${noteId}`));
      } catch {
        setNotice({ tone: 'error', message: msg('便签删除失败', 'Failed to delete note') });
      }
    },
    [user, msg, setNotice],
  );

  // ── ProjectGroup actions ───────────────────────────────────────────────────

  const addProjectGroup = useCallback(
    async (name: string, color: ProjectGroup['color'] = 'blue') => {
      if (!user || !name.trim()) return;
      try {
        const ref = doc(collection(db, `users/${user.uid}/projectGroups`));
        const group: ProjectGroup = {
          id: ref.id,
          name: name.trim(),
          bookmarkIds: [],
          color,
          createdAt: Date.now(),
        };
        await setDoc(ref, { ...buildProjectGroupDocument(group, user.uid), createdAt: serverTimestamp() });
      } catch {
        setNotice({ tone: 'error', message: msg('项目组创建失败', 'Failed to create project group') });
      }
    },
    [user, msg, setNotice],
  );

  const deleteProjectGroup = useCallback(
    async (groupId: string) => {
      if (!user) return;
      setProjectGroups((prev) => prev.filter((g) => g.id !== groupId));
      try {
        await deleteDoc(doc(db, `users/${user.uid}/projectGroups/${groupId}`));
      } catch {
        setNotice({ tone: 'error', message: msg('项目组删除失败', 'Failed to delete project group') });
      }
    },
    [user, msg, setNotice],
  );

  const toggleBookmarkInProjectGroup = useCallback(
    async (groupId: string, bookmarkId: string) => {
      if (!user) return;
      const group = projectGroups.find((g) => g.id === groupId);
      if (!group) return;
      const has = group.bookmarkIds.includes(bookmarkId);
      const nextIds = has
        ? group.bookmarkIds.filter((id) => id !== bookmarkId)
        : [...group.bookmarkIds, bookmarkId];
      setProjectGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, bookmarkIds: nextIds } : g)));
      try {
        await updateDoc(doc(db, `users/${user.uid}/projectGroups/${groupId}`), { bookmarkIds: nextIds });
      } catch {
        setNotice({ tone: 'error', message: msg('项目组更新失败', 'Failed to update project group') });
      }
    },
    [user, projectGroups, msg, setNotice],
  );

  // ── FavoriteGroup actions ──────────────────────────────────────────────────

  const addFavoriteGroup = useCallback(
    async (name: string) => {
      if (!user || !name.trim()) return;
      try {
        const ref = doc(collection(db, `users/${user.uid}/favoriteGroups`));
        const group: FavoriteGroup = { id: ref.id, name: name.trim(), createdAt: Date.now() };
        await setDoc(ref, { ...buildFavoriteGroupDocument(group, user.uid), createdAt: serverTimestamp() });
      } catch {
        setNotice({ tone: 'error', message: msg('收藏夹分组创建失败', 'Failed to create favorite group') });
      }
    },
    [user, msg, setNotice],
  );

  const deleteFavoriteGroup = useCallback(
    async (groupId: string) => {
      if (!user) return;
      setFavoriteGroups((prev) => prev.filter((g) => g.id !== groupId));
      try {
        await deleteDoc(doc(db, `users/${user.uid}/favoriteGroups/${groupId}`));
      } catch {
        setNotice({ tone: 'error', message: msg('收藏夹分组删除失败', 'Failed to delete favorite group') });
      }
    },
    [user, msg, setNotice],
  );

  return {
    tasks,
    notes,
    projectGroups,
    favoriteGroups,
    isSavingTask,
    isSavingNote,
    addTask,
    updateTaskStatus,
    deleteTask,
    saveNote,
    toggleNotePin,
    deleteNote,
    addProjectGroup,
    deleteProjectGroup,
    toggleBookmarkInProjectGroup,
    addFavoriteGroup,
    deleteFavoriteGroup,
  };
}
