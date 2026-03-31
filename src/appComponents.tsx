import React, { Component } from 'react';
import { motion } from 'motion/react';
import {
  AlertCircle,
  Archive,
  Briefcase,
  ExternalLink,
  Grid2x2,
  Image as ImageIcon,
  LayoutGrid,
  List,
  MessageSquare,
  Palette,
  Play,
  Plus,
  RotateCcw,
  Star,
  Trash2,
  User as UserIcon,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { BookmarkRecord, CategoryRecord, Lang } from './appData';
import { resolveCategorySubtitle, resolveCategoryTitle } from './appData';

export const ICON_MAP = {
  Archive,
  Briefcase,
  ImageIcon,
  LayoutGrid,
  MessageSquare,
  Palette,
  Play,
  UserIcon,
  Wrench,
} satisfies Record<string, LucideIcon>;

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-shell min-h-screen px-4 py-10 sm:px-6">
          <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
            <div className="panel-surface w-full rounded-3xl p-8 text-center">
              <AlertCircle className="mx-auto mb-5 h-14 w-14 text-primary" />
              <h2 className="mb-3 font-headline text-3xl font-extrabold">Lumina crashed</h2>
              <p className="mb-6 text-sm text-on-surface/68">The interface hit an unexpected error. Refresh to try again.</p>
              <button className="primary-button w-full justify-center" onClick={() => window.location.reload()} type="button">
                Refresh
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function DesktopNavItem({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button className={`nav-item ${active ? 'nav-item-active' : ''}`} onClick={onClick} type="button">
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: LucideIcon;
}) {
  return (
    <div className="panel-surface panel-hover p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="label-meta">{label}</span>
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="text-3xl font-headline font-extrabold tracking-tight">{value}</div>
      <p className="mt-2 text-sm text-on-surface/62">{hint}</p>
    </div>
  );
}

export function CategoryCard({
  category,
  lang,
  onOpen,
}: {
  category: CategoryRecord;
  lang: Lang;
  onOpen: () => void;
}) {
  const Icon = ICON_MAP[category.iconKey] || Grid2x2;
  const title = resolveCategoryTitle(category, lang);
  const subtitle = resolveCategorySubtitle(category, lang);
  const colors = {
    blue: 'bg-primary/14 text-primary',
    violet: 'bg-violet-400/14 text-violet-200',
    emerald: 'bg-emerald-400/14 text-emerald-200',
    slate: 'bg-white/6 text-on-surface/78',
  };

  return (
    <button className="panel-surface panel-hover flex w-full flex-col gap-5 p-6 text-left" onClick={onOpen} type="button">
      <div className="flex items-start justify-between gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${colors[category.color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="label-meta">{category.bookmarks.filter((bookmark) => !bookmark.isArchived).length} items</span>
      </div>
      <div>
        <h3 className="font-headline text-2xl font-extrabold tracking-tight">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-on-surface/62">{subtitle}</p>
      </div>
      <div className="mt-auto space-y-2">
        {category.bookmarks.filter((bookmark) => !bookmark.isArchived).slice(0, 2).map((bookmark) => (
          <div className="flex items-center gap-3 rounded-2xl bg-white/[0.03] px-3 py-3 text-sm" key={bookmark.id}>
            <img alt="" className="h-10 w-10 rounded-xl object-cover" referrerPolicy="no-referrer" src={bookmark.icon} />
            <div className="min-w-0">
              <div className="truncate font-semibold">{bookmark.title}</div>
              <div className="truncate text-xs text-on-surface/55">{bookmark.description}</div>
            </div>
          </div>
        ))}
      </div>
    </button>
  );
}

export function BookmarkSection({
  bookmarks,
  lang,
  viewMode,
  emptyTitle,
  emptyBody,
  addLabel,
  onAdd,
  onFavorite,
  onArchive,
}: {
  bookmarks: BookmarkRecord[];
  lang: Lang;
  viewMode: 'grid' | 'list';
  emptyTitle: string;
  emptyBody: string;
  addLabel: string;
  onAdd: () => void;
  onFavorite: (bookmark: BookmarkRecord) => void;
  onArchive: (bookmark: BookmarkRecord) => void;
}) {
  if (bookmarks.length === 0) {
    return (
      <div className="panel-surface flex min-h-[260px] flex-col items-center justify-center rounded-[2rem] border border-dashed border-white/8 px-6 py-10 text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/4">
          <Plus className="h-8 w-8 text-on-surface/24" />
        </div>
        <h3 className="text-xl font-bold">{emptyTitle}</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-on-surface/58">{emptyBody}</p>
        <button className="primary-button mt-6" onClick={onAdd} type="button">
          <Plus className="h-4 w-4" />
          {addLabel}
        </button>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-3">
        {bookmarks.map((bookmark) => (
          <div className="panel-surface panel-hover flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5" key={bookmark.id}>
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <img alt="" className="h-12 w-12 rounded-2xl border border-white/10 bg-white/5 object-cover" referrerPolicy="no-referrer" src={bookmark.icon} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="truncate text-base font-bold">{bookmark.title}</h4>
                  <span className="rounded-full bg-white/6 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface/52">{bookmark.tag}</span>
                </div>
                <p className="mt-1 truncate text-sm text-on-surface/58">{bookmark.description}</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <span className="text-xs text-on-surface/45">{formatRelativeMinutes(bookmark.createdAt, lang)}</span>
              <div className="flex items-center gap-2">
                <button className={`icon-button ${bookmark.isFavorite ? 'icon-button-active' : ''}`} onClick={() => onFavorite(bookmark)} type="button">
                  <Star className={`h-4 w-4 ${bookmark.isFavorite ? 'fill-current' : ''}`} />
                </button>
                <button className="icon-button" onClick={() => onArchive(bookmark)} type="button">
                  <Archive className="h-4 w-4" />
                </button>
                <a className="icon-button" href={bookmark.url} rel="noreferrer" target="_blank">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {bookmarks.map((bookmark) => (
        <motion.article animate={{ opacity: 1, y: 0 }} className="panel-surface panel-hover group flex h-full flex-col overflow-hidden p-5" initial={{ opacity: 0, y: 10 }} key={bookmark.id}>
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <img alt="" className="h-12 w-12 rounded-2xl border border-white/10 bg-white/5 object-cover" referrerPolicy="no-referrer" src={bookmark.icon} />
              <div className="min-w-0">
                <h4 className="truncate text-base font-bold">{bookmark.title}</h4>
                <p className="truncate text-xs uppercase tracking-[0.18em] text-on-surface/45">{bookmark.tag}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className={`icon-button ${bookmark.isFavorite ? 'icon-button-active' : ''}`} onClick={() => onFavorite(bookmark)} type="button">
                <Star className={`h-4 w-4 ${bookmark.isFavorite ? 'fill-current' : ''}`} />
              </button>
              <button className="icon-button" onClick={() => onArchive(bookmark)} type="button">
                <Archive className="h-4 w-4" />
              </button>
            </div>
          </div>
          <p className="mb-5 flex-1 text-sm leading-6 text-on-surface/62">{bookmark.description}</p>
          <a className="ghost-button mt-auto justify-between" href={bookmark.url} rel="noreferrer" target="_blank">
            <span>Open Link</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        </motion.article>
      ))}
    </div>
  );
}

export function ArchiveGrid({
  bookmarks,
  onRestore,
  onDelete,
}: {
  bookmarks: BookmarkRecord[];
  onRestore: (bookmark: BookmarkRecord) => void;
  onDelete: (bookmark: BookmarkRecord) => void;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {bookmarks.map((bookmark) => (
        <div className="panel-surface panel-hover p-5" key={bookmark.id}>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <img alt="" className="h-12 w-12 rounded-2xl border border-white/10 bg-white/5 object-cover" referrerPolicy="no-referrer" src={bookmark.icon} />
              <div className="min-w-0">
                <h4 className="truncate text-base font-bold">{bookmark.title}</h4>
                <p className="text-xs uppercase tracking-[0.16em] text-on-surface/45">{bookmark.tag}</p>
              </div>
            </div>
            <Archive className="mt-1 h-4 w-4 text-on-surface/45" />
          </div>
          <p className="mb-5 text-sm leading-6 text-on-surface/62">{bookmark.description}</p>
          <div className="flex gap-2">
            <button className="ghost-button flex-1 justify-center" onClick={() => onRestore(bookmark)} type="button">
              <RotateCcw className="h-4 w-4" />
              Restore
            </button>
            <button className="danger-button flex-1 justify-center" onClick={() => onDelete(bookmark)} type="button">
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ViewSwitch({
  viewMode,
  gridLabel,
  listLabel,
  onChange,
}: {
  viewMode: 'grid' | 'list';
  gridLabel: string;
  listLabel: string;
  onChange: (mode: 'grid' | 'list') => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button className={`view-toggle ${viewMode === 'grid' ? 'view-toggle-active' : ''}`} onClick={() => onChange('grid')} type="button">
        <LayoutGrid className="h-4 w-4" />
        {gridLabel}
      </button>
      <button className={`view-toggle ${viewMode === 'list' ? 'view-toggle-active' : ''}`} onClick={() => onChange('list')} type="button">
        <List className="h-4 w-4" />
        {listLabel}
      </button>
    </div>
  );
}

function formatRelativeMinutes(createdAt: number, _lang: Lang) {
  const deltaMinutes = Math.max(1, Math.round((Date.now() - createdAt) / 60000));
  if (deltaMinutes < 60) return `${deltaMinutes}m ago`;
  const hours = Math.floor(deltaMinutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
