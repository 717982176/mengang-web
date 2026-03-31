/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Component, ReactNode } from 'react';
import { 
  LayoutGrid, 
  Star, 
  Heart,
  Briefcase, 
  User as UserIcon, 
  Archive, 
  Plus, 
  Settings, 
  Search, 
  Moon, 
  Bell, 
  ChevronDown, 
  ExternalLink,
  Play,
  Palette,
  Image as ImageIcon,
  MessageSquare,
  Wrench,
  ArrowRight,
  HelpCircle,
  LogOut,
  Zap,
  History,
  Command,
  Languages,
  Sun,
  LogIn,
  Loader2,
  AlertCircle,
  X,
  Trash2,
  RotateCcw,
  Sparkles,
  List
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  auth, 
  db, 
  signIn, 
  logOut as firebaseLogOut 
} from './firebase';
import { 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  deleteDoc
} from 'firebase/firestore';

// --- Error Handling ---

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-6">
          <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-2xl border border-primary/10 max-w-md w-full text-center">
            <AlertCircle className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="text-2xl font-headline font-extrabold mb-4">Something went wrong</h2>
            <p className="text-outline text-sm mb-8 leading-relaxed">
              {this.state.error?.message?.includes('{') 
                ? "A database permission error occurred. Please contact the administrator." 
                : "An unexpected error occurred. Please try refreshing the page."}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-primary text-white rounded-full font-bold hover:bg-primary/90 transition-all"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- i18n ---

const TRANSLATIONS = {
  en: {
    dashboard: "Dashboard",
    favorites: "Favorites",
    work: "Work",
    personal: "Personal",
    archive: "Recycle Bin",
    settings: "Settings",
    addBookmark: "Add Bookmark",
    welcome: "Welcome back",
    hello: "Hello",
    categories: "Categories",
    bookmarks: "Bookmarks",
    featured: "Featured Collection",
    mastering: "Mastering Modern Illustration Workflows",
    explore: "Explore Now",
    smartHistory: "Smart History",
    historyDesc: "Quickly jump back into your last 5 research sessions.",
    dailyTip: "Daily Tip",
    productivity: "Productivity",
    tipDesc: "Use ⌘ + K to trigger the global command palette from anywhere.",
    searchPlaceholder: "Search commands or bookmarks...",
    quickActions: "Quick Actions",
    changeTheme: "Change Theme",
    themeDesc: "Switch between light and dark mode",
    navigate: "Navigate",
    select: "Select",
    adminLogin: "Admin Login",
    systemStatus: "System Status",
    privacy: "Privacy",
    home: "Home",
    saved: "Saved",
    profile: "Profile",
    tools: "Tools",
    curatorPro: "Administrator",
    digitalCurator: "Lumina Space",
    typeCommand: "Type a command or search...",
    illustration: "Illustration",
    anime: "Anime",
    searchRecognition: "Search & Recognition",
    acgCommunity: "ACG Community",
    practicalTools: "Practical Tools",
    archiveDesc: "Recently deleted or archived items",
    emptyArchive: "Recycle bin is empty",
    restore: "Restore",
    deletePermanently: "Delete Permanently",
    luminaSpace: "Lumina Space",
    premiumMember: "Administrator",
    wallpaper: "Wallpaper",
    wallpaperUrl: "Wallpaper URL",
    uploadImage: "Upload Image",
    customWallpaper: "Custom Wallpaper",
    defaultWallpaper: "Default Wallpaper",
    recommendWallpaper: "Recommend Wallpaper",
    recentBookmarks: "Recent Bookmarks",
    noBookmarks: "No bookmarks yet",
    addFirst: "Start by adding your first bookmark to this collection.",
    appearance: "Appearance",
    account: "Account",
    language: "Language",
    signOut: "Sign Out",
    signInRequired: "Sign In Required",
    signInGoogle: "Sign In with Google",
    guestMsg: "You are currently using Lumina as a guest.",
    personalSpace: "Personal Space",
    personalDesc: "Sign in to access your personal bookmarks, private collections, and personalized insights.",
    activeDays: "Active Days",
    yourCollections: "Your Collections",
    addNew: "Add New",
    deletedRecently: "Deleted Recently",
    itemsDeleteMsg: "Items you delete will appear here for 30 days before being permanently removed.",
    searchResources: "Search resources...",
    totalAssets: "Total Assets",
    inspirationLibrary: "Your Digital Library of Inspiration",
    inspirationDesc: "A curated repository of aesthetics, technology, and foundational principles.",
    enterGallery: "Enter Gallery",
    designFoundations: "Design Foundations",
    creativeTech: "Creative Tech",
    viewAll: "View All",
    updating: "Updating",
    submitResource: "Submit Resource",
    networkLoad: "Network Load",
    processingPower: "Processing Power",
    expandDiagnostics: "Expand Diagnostics",
    reset: "Reset",
    enterUrl: "Enter image URL...",
    appearanceSettings: "Appearance Settings",
    accountSettings: "Account Settings",
    generalSettings: "General Settings",
    about: "About Lumina",
    version: "Version",
    role: "Role",
    email: "Email",
    name: "Name",
    lastLogin: "Last Login",
    security: "Security",
    help: "Help & Support"
  },
  zh: {
    dashboard: "仪表盘",
    favorites: "收藏夹",
    work: "工作",
    personal: "个人中心",
    archive: "回收站",
    settings: "系统设置",
    addBookmark: "添加书签",
    welcome: "欢迎回来",
    hello: "你好",
    categories: "分类管理",
    bookmarks: "书签列表",
    featured: "精选推荐",
    mastering: "掌握现代插画工作流",
    explore: "立即探索",
    smartHistory: "历史记录",
    historyDesc: "快速回到您最近的 5 次研究会话。",
    dailyTip: "每日技巧",
    productivity: "生产力工具",
    tipDesc: "在任何地方使用 ⌘ + K 触发全局命令面板。",
    searchPlaceholder: "搜索命令、书签或分类...",
    quickActions: "快速操作",
    changeTheme: "切换主题",
    themeDesc: "在明亮和黑暗模式之间切换界面",
    navigate: "导航",
    select: "选择",
    adminLogin: "管理员登录",
    systemStatus: "系统状态",
    privacy: "隐私政策",
    home: "首页",
    saved: "已收藏",
    profile: "个人中心",
    tools: "工具箱",
    curatorPro: "管理员",
    digitalCurator: "Lumina 空间",
    typeCommand: "输入命令或搜索...",
    illustration: "插画与图站",
    anime: "在线动漫",
    searchRecognition: "搜图与识别",
    acgCommunity: "ACG 社区",
    practicalTools: "实用工具",
    archiveDesc: "这里存放最近删除的项目",
    emptyArchive: "回收站是空的",
    restore: "还原",
    deletePermanently: "永久删除",
    luminaSpace: "Lumina 空间",
    premiumMember: "管理员",
    wallpaper: "个性化壁纸",
    wallpaperUrl: "壁纸链接 (URL)",
    uploadImage: "上传本地图片",
    customWallpaper: "自定义壁纸",
    defaultWallpaper: "默认壁纸",
    recommendWallpaper: "推荐壁纸源",
    recentBookmarks: "最近添加",
    noBookmarks: "暂无书签",
    addFirst: "开始添加您的第一个书签到此收藏。",
    appearance: "外观与界面",
    account: "账户管理",
    language: "语言设置",
    signOut: "退出当前账号",
    signInRequired: "需要登录",
    signInGoogle: "使用 Google 账号登录",
    guestMsg: "您当前正以访客身份使用 Lumina。",
    personalSpace: "个人空间",
    personalDesc: "登录以访问您的个人书签、私人收藏和个性化见解。",
    activeDays: "活跃天数",
    yourCollections: "您的收藏夹",
    addNew: "新增项目",
    deletedRecently: "最近删除",
    itemsDeleteMsg: "您删除的项目将在此保留 30 天，然后被永久移除。",
    searchResources: "搜索资源...",
    totalAssets: "资产总数",
    inspirationLibrary: "您的数字灵感库",
    inspirationDesc: "审美、技术和基础原则的精选库。",
    enterGallery: "进入画廊",
    designFoundations: "设计基础",
    creativeTech: "创意技术",
    viewAll: "查看全部",
    updating: "更新中",
    submitResource: "提交资源",
    systemStatus: "系统状态",
    networkLoad: "网络负载",
    processingPower: "处理能力",
    expandDiagnostics: "展开诊断信息",
    reset: "重置",
    enterUrl: "输入图片链接...",
    appearanceSettings: "外观设置",
    accountSettings: "账户设置",
    generalSettings: "通用设置",
    about: "关于 Lumina",
    version: "版本",
    role: "角色",
    email: "邮箱",
    name: "昵称",
    lastLogin: "最后登录",
    security: "安全",
    help: "帮助与支持"
  }
};��"
  }
};: "帮助与支持"
  }
};e: "昵称",
    lastLogin: "最后登录",
    security: "安全",
    help: "帮助与支持"
  }
};ics: "展开诊断信息",
    reset: "重置",
    enterUrl: "输入图片链接...",
    appearanceSettings: "外观设置",
    accountSettings: "账户设置",
    generalSettings: "通用设置",
    about: "关于 Lumina",
    version: "版本",
    role: "角色",
    email: "邮箱",
    name: "昵称",
    lastLogin: "最后登录",
    security: "安全",
    help: "帮助与支持"
  }�以访问您的个人书签、私人收藏和个性化见解。",
    activeDays: "活跃天数",
    yourCollections: "您的收藏",
    addNew: "新增",
    deletedRecently: "最近删除",
    itemsDeleteMsg: "您删除的项目将在此保留 30 天，然后被永久移除。",
    searchResources: "搜索资源...",
    totalAssets: "资产总数",
    inspirationLibrary: "您的数字灵感库",
    inspirationDesc: "审美、技术和基础原则的精选库。",
    enterGallery: "进入画廊",
    designFoundations: "设计基础",
    creativeTech: "创意技术",
    viewAll: "查看全部",
    updating: "更新中",
    submitResource: "提交资源",
    systemStatus: "系统状态",
    networkLoad: "网络负载",
    processingPower: "处理能力",
    expandDiagnostics: "展开诊断"
  }
};

// --- Types ---

interface Bookmark {
  id: string;
  title: string;
  url: string;
  description: string;
  icon: string;
  tag?: string;
  isFavorite?: boolean;
  isArchived?: boolean;
  onFavorite?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}

interface Category {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: 'blue' | 'purple' | 'green' | 'gray';
  bookmarks: Bookmark[];
  isLarge?: boolean;
}

// --- Mock Data ---

const CATEGORIES: Category[] = [
  {
    id: 'work',
    title: '工作',
    subtitle: 'Professional Resources',
    icon: <Briefcase className="w-6 h-6" />,
    color: 'blue',
    bookmarks: []
  },
  {
    id: 'personal',
    title: '个人',
    subtitle: 'Personal Collection',
    icon: <UserIcon className="w-6 h-6" />,
    color: 'purple',
    bookmarks: []
  },
  {
    id: 'archive',
    title: '归档',
    subtitle: 'Archived Items',
    icon: <Archive className="w-6 h-6" />,
    color: 'gray',
    bookmarks: []
  },
  {
    id: 'anime',
    title: '在线动漫',
    subtitle: 'Premium Streaming & Libraries',
    icon: <Play className="w-6 h-6" fill="currentColor" />,
    color: 'blue',
    isLarge: true,
    bookmarks: [
      {
        id: 'bilibili',
        title: 'Bilibili',
        url: 'https://www.bilibili.com',
        description: 'High-quality animation community',
        icon: 'https://picsum.photos/seed/bili/64/64',
        tag: 'HOT'
      },
      {
        id: 'bangumi',
        title: 'Bangumi',
        url: 'https://bgm.tv',
        description: 'Detailed database & reviews',
        icon: 'https://picsum.photos/seed/bgm/64/64'
      }
    ]
  },
  {
    id: 'illustration',
    title: '插画与图站',
    subtitle: 'Visual Inspiration',
    icon: <Palette className="w-6 h-6" fill="currentColor" />,
    color: 'purple',
    bookmarks: [
      {
        id: 'pixiv',
        title: 'Pixiv',
        url: 'https://www.pixiv.net',
        description: 'World largest illustration community',
        icon: 'https://picsum.photos/seed/pixiv/64/64'
      },
      {
        id: 'artstation',
        title: 'ArtStation',
        url: 'https://www.artstation.com',
        description: 'Professional portfolio platform',
        icon: 'https://picsum.photos/seed/art/64/64'
      }
    ]
  },
  {
    id: 'search',
    title: '搜图与识别',
    subtitle: 'Image Search & Discovery',
    icon: <ImageIcon className="w-6 h-6" fill="currentColor" />,
    color: 'green',
    bookmarks: [
      {
        id: 'saucenao',
        title: 'SauceNAO',
        url: 'https://saucenao.com',
        description: 'Reverse image search engine',
        icon: 'https://picsum.photos/seed/sauce/64/64'
      },
      {
        id: 'ascii2d',
        title: 'ASCII2D',
        url: 'https://ascii2d.net',
        description: 'Anime style image search',
        icon: 'https://picsum.photos/seed/ascii/64/64'
      }
    ]
  },
  {
    id: 'community',
    title: 'ACG 社区',
    subtitle: 'Forums & Discussions',
    icon: <MessageSquare className="w-6 h-6" fill="currentColor" />,
    color: 'gray',
    bookmarks: [
      {
        id: 'nga',
        title: 'NGA玩家社区',
        url: 'https://nga.178.com',
        description: 'Gaming & ACG community',
        icon: 'https://picsum.photos/seed/nga/64/64'
      }
    ]
  },
  {
    id: 'tools',
    title: '实用工具',
    subtitle: 'Productivity Toolbelt',
    icon: <Wrench className="w-6 h-6" fill="currentColor" />,
    color: 'blue',
    bookmarks: [
      {
        id: 'toolbelt',
        title: 'Toolbelt Activity',
        url: '#',
        description: '75% usage this week',
        icon: 'https://picsum.photos/seed/tool/64/64'
      }
    ]
  }
];

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
      active 
        ? 'bg-white text-primary shadow-sm font-semibold' 
        : 'text-outline hover:text-on-surface hover:bg-surface-container-low'
    }`}
  >
    <Icon className={`w-5 h-5 ${active ? 'fill-current' : ''}`} />
    <span className="font-headline text-sm tracking-tight">{label}</span>
  </button>
);

const BookmarkCard = ({ bookmark, t }: { bookmark: Bookmark, t: any }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 sm:p-5 rounded-3xl bg-surface-container-low border border-outline-variant/10 group hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 relative overflow-hidden"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-surface shadow-sm flex items-center justify-center text-2xl overflow-hidden">
          <img src={bookmark.icon} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.preventDefault(); bookmark.onFavorite?.(); }}
            className={`p-2 rounded-xl transition-all ${bookmark.isFavorite ? 'bg-primary/10 text-primary' : 'bg-surface hover:bg-primary/10 hover:text-primary'}`}
          >
            <Star className={`w-4 h-4 ${bookmark.isFavorite ? 'fill-current' : ''}`} />
          </button>
          <button 
            onClick={(e) => { e.preventDefault(); bookmark.onArchive?.(); }}
            className="p-2 rounded-xl bg-surface hover:bg-secondary/10 hover:text-secondary transition-all"
          >
            <Archive className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="block space-y-1">
        <h4 className="font-bold text-sm sm:text-base truncate group-hover:text-primary transition-colors">{bookmark.title}</h4>
        <p className="text-[10px] sm:text-xs text-outline line-clamp-2 min-h-[2.5rem] leading-relaxed">{bookmark.description}</p>
      </a>

      <div className="mt-4 pt-4 border-t border-outline-variant/5 flex items-center justify-between">
        <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-[9px] font-bold text-outline uppercase tracking-wider">
          {bookmark.tag || 'General'}
        </span>
        <ExternalLink className="w-3 h-3 text-outline group-hover:text-primary transition-colors" />
      </div>
    </motion.div>
  );
};

const CategoryCard = ({ category }: { category: Category }) => {
  const colorClasses = {
    blue: 'bg-primary-fixed text-primary',
    purple: 'bg-secondary-fixed text-secondary',
    green: 'bg-tertiary-fixed text-tertiary',
    gray: 'bg-surface-container-highest text-outline'
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-surface-container-lowest rounded-radius-xl p-6 sm:p-8 cloud-shadow border border-transparent hover:border-primary/10 transition-all duration-300 ${
        category.isLarge ? 'md:col-span-2' : 'col-span-1'
      }`}
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${colorClasses[category.color]}`}>
            {category.icon}
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-headline font-extrabold tracking-tight">{category.title}</h3>
            <p className="text-[10px] text-outline font-medium">{category.subtitle}</p>
          </div>
        </div>
      </div>

      <div className={`grid gap-3 sm:gap-4 ${category.isLarge ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
        {category.bookmarks.filter(b => !b.isArchived).map((bookmark: any) => (
          <div 
            key={bookmark.id}
            className="p-3 sm:p-4 rounded-xl bg-surface-container-low flex items-center gap-3 sm:gap-4 hover:bg-surface-bright hover:shadow-sm border border-transparent hover:border-outline-variant/20 transition-all group relative"
          >
            <a 
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center gap-3 sm:gap-4 min-w-0"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                <img src={bookmark.icon} alt={bookmark.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-bold truncate group-hover:text-primary transition-colors">{bookmark.title}</p>
                <p className="text-[9px] sm:text-[10px] text-outline truncate">{bookmark.description}</p>
              </div>
            </a>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={(e) => { e.preventDefault(); bookmark.onFavorite?.(); }}
                className={`p-1.5 rounded-lg transition-colors ${bookmark.isFavorite ? 'text-primary bg-primary/10' : 'text-outline hover:text-primary hover:bg-primary/5'}`}
              >
                <Star className={`w-3.5 h-3.5 ${bookmark.isFavorite ? 'fill-current' : ''}`} />
              </button>
              <button 
                onClick={(e) => { e.preventDefault(); bookmark.onArchive?.(); }}
                className="p-1.5 rounded-lg text-outline hover:text-secondary hover:bg-secondary/5 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Archive className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [lang, setLang] = useState<'en' | 'zh'>('zh');
  const [isMac, setIsMac] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [wallpaper, setWallpaper] = useState<string | null>(null);
  const [wallpaperType, setWallpaperType] = useState<'default' | 'custom'>('default');
  
  // Firebase State
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newBookmark, setNewBookmark] = useState({ title: '', url: '', categoryId: '' });

  // Load wallpaper from localStorage
  useEffect(() => {
    const savedWallpaper = localStorage.getItem('lumina-wallpaper');
    const savedType = localStorage.getItem('lumina-wallpaper-type');
    if (savedWallpaper) setWallpaper(savedWallpaper);
    if (savedType) setWallpaperType(savedType as any);
  }, []);

  const handleWallpaperChange = (url: string) => {
    setWallpaper(url);
    setWallpaperType('custom');
    localStorage.setItem('lumina-wallpaper', url);
    localStorage.setItem('lumina-wallpaper-type', 'custom');
  };

  const resetWallpaper = () => {
    setWallpaper(null);
    setWallpaperType('default');
    localStorage.removeItem('lumina-wallpaper');
    localStorage.removeItem('lumina-wallpaper-type');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        handleWallpaperChange(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthReady(true);
      
      if (firebaseUser) {
        // Sync user profile to Firestore
        const userRef = doc(db, 'users', firebaseUser.uid);
        try {
          const userDoc = await getDoc(userRef);
          if (!userDoc.exists()) {
            await setDoc(userRef, {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              role: 'user',
              createdAt: serverTimestamp()
            });

            // Bootstrap default categories
            const defaultCats = [
              { id: 'work', title: '工作', subtitle: 'Professional Resources', icon: 'Briefcase', order: 0, color: 'blue' },
              { id: 'personal', title: '个人', subtitle: 'Personal Collection', icon: 'UserIcon', order: 1, color: 'purple' },
              { id: 'archive', title: '归档', subtitle: 'Archived Items', icon: 'Archive', order: 2, color: 'gray' },
              { id: 'anime', title: '在线动漫', subtitle: 'Premium Streaming', icon: 'Play', order: 3, color: 'blue' },
              { id: 'illustration', title: '插画与图站', subtitle: 'Visual Inspiration', icon: 'Palette', order: 4, color: 'purple' },
              { id: 'search', title: '搜图与识别', subtitle: 'Image Search', icon: 'ImageIcon', order: 5, color: 'green' },
              { id: 'community', title: 'ACG 社区', subtitle: 'Forums', icon: 'MessageSquare', order: 6, color: 'gray' },
              { id: 'tools', title: '实用工具', subtitle: 'Productivity', icon: 'Wrench', order: 7, color: 'blue' }
            ];

            for (const cat of defaultCats) {
              await setDoc(doc(db, `users/${firebaseUser.uid}/categories`, cat.id), {
                ...cat,
                uid: firebaseUser.uid
              });
            }
          }
        } catch (e) {
          console.error("Error syncing user profile or bootstrapping", e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Detect platform & theme
  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  // Fetch Data from Firestore
  useEffect(() => {
    if (!user || !isAuthReady) {
      setCategories(CATEGORIES); // Fallback to mock data if not logged in
      return;
    }

    const categoriesPath = `users/${user.uid}/categories`;
    const bookmarksPath = `users/${user.uid}/bookmarks`;

    const qCategories = query(collection(db, categoriesPath), orderBy('order', 'asc'));
    const qBookmarks = query(collection(db, bookmarksPath), orderBy('createdAt', 'desc'));

    let unsubBookmarks: () => void;

    const unsubCategories = onSnapshot(qCategories, (catSnapshot) => {
      const cats = catSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      unsubBookmarks = onSnapshot(qBookmarks, (bookSnapshot) => {
        const books = bookSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        
        const combined = cats.map(cat => ({
          ...cat,
          icon: <Play className="w-6 h-6" fill="currentColor" />, // Simplified for now
          bookmarks: books.filter(b => b.categoryId === cat.id).map(b => ({
            ...b,
            onFavorite: () => toggleFavorite(b.id, b.isFavorite)
          }))
        }));
        
        setCategories(combined.length > 0 ? combined : CATEGORIES);
      }, (err) => handleFirestoreError(err, OperationType.LIST, bookmarksPath));
    }, (err) => handleFirestoreError(err, OperationType.LIST, categoriesPath));

    return () => {
      unsubCategories();
      if (unsubBookmarks) unsubBookmarks();
    };
  }, [user, isAuthReady]);

  // Filter categories and bookmarks based on search query
  const filteredCategories = categories.map(category => {
    const filteredBookmarks = category.bookmarks.filter(bookmark => 
      bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    if (category.title.toLowerCase().includes(searchQuery.toLowerCase()) || filteredBookmarks.length > 0) {
      return { ...category, bookmarks: filteredBookmarks };
    }
    return null;
  }).filter(Boolean) as Category[];

  const toggleFavorite = async (bookmarkId: string, currentStatus: boolean) => {
    if (!user) return signIn();
    const path = `users/${user.uid}/bookmarks/${bookmarkId}`;
    try {
      await setDoc(doc(db, path), { isFavorite: !currentStatus }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const toggleArchive = async (bookmarkId: string, currentStatus: boolean) => {
    if (!user) return signIn();
    const path = `users/${user.uid}/bookmarks/${bookmarkId}`;
    try {
      await setDoc(doc(db, path), { isArchived: !currentStatus }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const deleteBookmark = async (bookmarkId: string) => {
    if (!user) return signIn();
    const path = `users/${user.uid}/bookmarks/${bookmarkId}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const handleAddBookmark = async () => {
    if (!user) return signIn();
    if (!newBookmark.title || !newBookmark.url || !newBookmark.categoryId) return;

    const path = `users/${user.uid}/bookmarks`;
    try {
      await addDoc(collection(db, path), {
        ...newBookmark,
        uid: user.uid,
        isFavorite: false,
        isArchived: false,
        createdAt: serverTimestamp()
      });
      setIsAddModalOpen(false);
      setNewBookmark({ title: '', url: '', categoryId: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const renderContent = () => {
    const t = TRANSLATIONS[lang];
    
    if (activeTab === 'settings') {
      return (
        <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Settings className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-headline font-extrabold tracking-tight">{t.settings}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/10 space-y-6 cloud-shadow">
              <h3 className="text-lg font-headline font-bold mb-4">{t.appearance}</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">{t.changeTheme}</p>
                  <p className="text-[10px] text-outline">{t.themeDesc}</p>
                </div>
                <button onClick={toggleTheme} className="p-3 bg-surface-container-high rounded-xl hover:bg-primary/10 transition-colors">
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">{t.language}</p>
                  <p className="text-[10px] text-outline">Switch between English and Chinese</p>
                </div>
                <button onClick={toggleLang} className="px-4 py-2 bg-surface-container-high rounded-xl font-bold text-xs hover:bg-primary/10 transition-colors">
                  {lang.toUpperCase()}
                </button>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/10 space-y-6 cloud-shadow">
              <h3 className="text-lg font-headline font-bold mb-4">{t.wallpaper}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-1.5 ml-1">{t.wallpaperUrl}</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      className="flex-1 px-4 py-2 rounded-xl bg-surface-container-low border border-outline-variant/20 focus:border-primary outline-none transition-all text-sm"
                      placeholder="https://..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleWallpaperChange((e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                    <button className="p-2 bg-primary text-white rounded-xl">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <label className="flex-1 py-2 bg-surface-container-high rounded-xl text-center text-xs font-bold cursor-pointer hover:bg-primary/10 transition-colors">
                    <ImageIcon className="w-4 h-4 inline-block mr-2" />
                    {t.uploadImage}
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                  </label>
                  <button onClick={resetWallpaper} className="px-4 py-2 bg-red-500/10 text-red-500 rounded-xl text-xs font-bold hover:bg-red-500/20 transition-colors">
                    Reset
                  </button>
                </div>
                <div className="pt-2">
                  <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-2">{t.recommendWallpaper}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      'https://picsum.photos/seed/lumina1/1200/800',
                      'https://picsum.photos/seed/lumina2/1200/800',
                      'https://picsum.photos/seed/lumina3/1200/800'
                    ].map((url, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleWallpaperChange(url)}
                        className="aspect-video rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all"
                      >
                        <img src={url} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/10 space-y-6 cloud-shadow md:col-span-2">
              <h3 className="text-lg font-headline font-bold mb-4">{t.account}</h3>
              {user ? (
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container-low flex-1 w-full">
                    <img src={user.photoURL || ''} className="w-12 h-12 rounded-full" referrerPolicy="no-referrer" />
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold truncate">{user.displayName}</p>
                      <p className="text-xs text-outline truncate">{user.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
                        {t.curatorPro}
                      </span>
                    </div>
                  </div>
                  <button onClick={firebaseLogOut} className="w-full sm:w-auto py-4 px-8 bg-red-500/10 text-red-500 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors">
                    <LogOut className="w-4 h-4" />
                    {t.signOut}
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-outline mb-6">{t.guestMsg}</p>
                  <button onClick={signIn} className="px-12 py-4 bg-primary text-white rounded-2xl font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20">
                    {t.signInGoogle}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'personal') {
      if (!user) {
        return (
          <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in duration-700">
            <div className="w-24 h-24 rounded-3xl bg-primary/10 text-primary flex items-center justify-center animate-bounce">
              <UserIcon className="w-12 h-12" />
            </div>
            <div className="max-w-md space-y-2">
              <h2 className="text-3xl font-headline font-black tracking-tight">{t.personalSpace}</h2>
              <p className="text-outline font-medium">{t.personalDesc}</p>
            </div>
            <button 
              onClick={signIn}
              className="px-8 py-4 bg-primary text-white rounded-full font-bold shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
            >
              {t.signInGoogle}
            </button>
          </div>
        );
      }
      return (
        <div className="space-y-12 max-w-5xl mx-auto animate-in fade-in duration-700">
          {/* Profile Header */}
          <section className="relative h-48 sm:h-64 rounded-[2.5rem] overflow-hidden cloud-shadow group">
            <img src={wallpaper || "https://picsum.photos/seed/profile/1200/400"} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-on-surface/90 via-on-surface/20 to-transparent"></div>
            <div className="absolute bottom-8 left-8 right-8 flex items-end gap-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-surface overflow-hidden shadow-2xl">
                <img src={user.photoURL || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-1 pb-2">
                <h2 className="text-2xl sm:text-4xl font-headline font-extrabold text-white tracking-tight">{user.displayName}</h2>
                <p className="text-white/60 text-xs sm:text-sm font-medium uppercase tracking-widest">{t.curatorPro}</p>
              </div>
            </div>
          </section>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {[
              { label: t.bookmarks, value: categories.reduce((acc, c) => acc + c.bookmarks.length, 0), icon: Star, color: 'text-primary' },
              { label: t.categories, value: categories.length, icon: LayoutGrid, color: 'text-secondary' },
              { label: t.favorites, value: categories.flatMap(c => c.bookmarks).filter(b => (b as any).isFavorite).length, icon: Heart, color: 'text-red-500' },
              { label: t.activeDays, value: 12, icon: Zap, color: 'text-orange-500' }
            ].map((stat, i) => (
              <div key={i} className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/10 cloud-shadow text-center hover:scale-105 transition-transform">
                <stat.icon className={`w-6 h-6 mx-auto mb-3 ${stat.color}`} />
                <p className="text-2xl font-headline font-extrabold">{stat.value}</p>
                <p className="text-[10px] font-bold text-outline uppercase tracking-widest mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Personal Categories */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-headline font-extrabold tracking-tight">{t.yourCollections}</h3>
              <button onClick={() => setIsAddModalOpen(true)} className="text-sm font-bold text-primary hover:underline">{t.addNew}</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {categories.filter(c => c.id === 'personal' || c.id === 'work').map(category => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </section>
        </div>
      );
    }

    if (activeTab === 'archive') {
      const archivedBookmarks = categories.flatMap(c => c.bookmarks).filter(b => (b as any).isArchived);
      return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-4xl font-headline font-black tracking-tight mb-2">{t.archive}</h2>
              <p className="text-outline font-medium">{t.archiveDesc}</p>
            </div>
            {archivedBookmarks.length > 0 && (
              <button 
                onClick={() => archivedBookmarks.forEach(b => deleteBookmark(b.id))}
                className="px-6 py-3 rounded-2xl bg-red-500/10 text-red-500 text-xs font-bold hover:bg-red-500/20 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {t.deletePermanently}
              </button>
            )}
          </header>

          {archivedBookmarks.length === 0 ? (
            <div className="h-[50vh] flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-24 h-24 rounded-3xl bg-surface-container-low flex items-center justify-center text-outline/20">
                <Archive className="w-12 h-12" />
              </div>
              <div className="max-w-xs space-y-2">
                <h3 className="text-xl font-bold">{t.emptyArchive}</h3>
                <p className="text-sm text-outline">Items you delete will appear here for 30 days before being permanently removed.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {archivedBookmarks.map(bookmark => (
                <div key={bookmark.id} className="p-6 rounded-3xl bg-surface-container-low border border-outline-variant/10 group hover:border-primary/30 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-surface shadow-sm flex items-center justify-center text-2xl overflow-hidden">
                      <img src={bookmark.icon} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => toggleArchive(bookmark.id, true)}
                        className="p-2.5 rounded-xl bg-surface hover:bg-primary/10 hover:text-primary transition-all"
                        title={t.restore}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteBookmark(bookmark.id)}
                        className="p-2.5 rounded-xl bg-surface hover:bg-red-500/10 hover:text-red-500 transition-all"
                        title={t.deletePermanently}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h4 className="font-bold mb-1 truncate">{bookmark.title}</h4>
                  <p className="text-xs text-outline line-clamp-2 mb-4">{bookmark.description}</p>
                  <div className="pt-4 border-t border-outline-variant/5 flex items-center justify-between text-[10px] font-bold text-outline uppercase tracking-wider">
                    <span>{bookmark.tag || 'General'}</span>
                    <span>Deleted Recently</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    const currentCategory = categories.find(c => c.id === activeTab);
    const displayBookmarks = activeTab === 'dashboard' 
      ? categories.flatMap(c => c.bookmarks).filter(b => !(b as any).isArchived).slice(0, 8)
      : activeTab === 'favorites'
        ? categories.flatMap(c => c.bookmarks).filter(b => (b as any).isFavorite && !(b as any).isArchived)
        : currentCategory?.bookmarks.filter(b => !(b as any).isArchived) || [];

    return (
      <div className="space-y-16 animate-in fade-in duration-1000">
        {activeTab === 'dashboard' && (
          <section className="relative overflow-hidden rounded-[3rem] p-8 sm:p-12 lg:p-20 border border-white/20 cloud-shadow group min-h-[500px] flex items-center">
            {/* Wallpaper Background */}
            <div className="absolute inset-0 z-0">
              <img 
                src={wallpaper || "https://picsum.photos/seed/lumina_main/1920/1080"} 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                alt=""
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-surface/80 via-surface/40 to-transparent" />
              <div className="absolute inset-0 bg-black/20" />
            </div>

            <div className="relative z-10 max-w-3xl space-y-8">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/40 backdrop-blur-md border border-white/40 text-primary text-[10px] font-black tracking-[0.15em] uppercase">
                <Sparkles className="w-4 h-4" />
                {t.featured}
              </div>
              <h2 className="text-5xl sm:text-6xl lg:text-8xl font-headline font-black tracking-tighter leading-[0.9] text-balance text-on-surface">
                {user ? `${t.welcome}, ${user.displayName?.split(' ')[0]}` : t.welcome}
              </h2>
              <p className="text-xl sm:text-2xl text-on-surface/80 font-medium max-w-xl leading-relaxed text-balance">
                Your curated universe of inspiration, tools, and knowledge. Organized for your unique lifestyle.
              </p>
              <div className="flex flex-wrap gap-6 pt-4">
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-10 py-5 bg-primary text-white rounded-full font-black text-sm shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                >
                  {t.explore}
                  <ArrowRight className="w-5 h-5" />
                </button>
                <div className="flex -space-x-4 items-center">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-surface-container-high overflow-hidden shadow-lg">
                      <img src={`https://i.pravatar.cc/100?u=${i + 10}`} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  <div className="pl-8 text-xs font-black text-on-surface/60 uppercase tracking-widest">+1.2k members</div>
                </div>
              </div>
            </div>
            
            {/* Abstract Decorative Elements */}
            <div className="absolute top-0 right-0 w-1/2 h-full hidden xl:block pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
            </div>
          </section>
        )}

        {/* Categories Section */}
        {(activeTab === 'dashboard' || currentCategory) && (
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-3xl font-headline font-black tracking-tight">{activeTab === 'dashboard' ? t.categories : currentCategory?.title}</h3>
              <button className="text-xs font-black text-primary uppercase tracking-widest hover:underline">{t.viewAll}</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activeTab === 'dashboard' 
                ? categories.slice(0, 3).map(category => (
                    <CategoryCard 
                      key={category.id} 
                      category={{
                        ...category,
                        bookmarks: category.bookmarks.map(b => ({
                          ...b,
                          onFavorite: () => toggleFavorite(b.id, (b as any).isFavorite),
                          onArchive: () => toggleArchive(b.id, (b as any).isArchived)
                        }))
                      }} 
                    />
                  ))
                : currentCategory && (
                    <CategoryCard 
                      category={{
                        ...currentCategory,
                        bookmarks: currentCategory.bookmarks.map(b => ({
                          ...b,
                          onFavorite: () => toggleFavorite(b.id, (b as any).isFavorite),
                          onArchive: () => toggleArchive(b.id, (b as any).isArchived)
                        }))
                      }} 
                    />
                  )
              }
            </div>
          </section>
        )}

        {/* Bookmarks Section */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-3xl font-headline font-black tracking-tight">
              {activeTab === 'dashboard' ? 'Recent Bookmarks' : activeTab === 'favorites' ? t.favorites : t.bookmarks}
            </h3>
            <div className="flex items-center gap-3">
              <button className="p-3 rounded-2xl bg-surface-container-low text-outline hover:text-primary transition-all">
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button className="p-3 rounded-2xl bg-surface-container-low text-outline hover:text-primary transition-all">
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {displayBookmarks.length === 0 ? (
            <div className="py-32 text-center space-y-6 rounded-[3rem] border-4 border-dashed border-outline-variant/10 bg-surface-container-low/30">
              <div className="w-20 h-20 rounded-3xl bg-surface-container-low mx-auto flex items-center justify-center text-outline/10">
                <Plus className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <p className="text-xl font-bold text-outline">No bookmarks yet</p>
                <p className="text-sm text-outline/60">Start by adding your first bookmark to this collection.</p>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="px-8 py-3 bg-primary text-white rounded-full font-bold text-xs shadow-lg shadow-primary/20 hover:scale-105 transition-all"
              >
                Add Bookmark
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {displayBookmarks.map(bookmark => (
                <BookmarkCard 
                  key={bookmark.id} 
                  bookmark={{
                    ...bookmark,
                    onFavorite: () => toggleFavorite(bookmark.id, (bookmark as any).isFavorite),
                    onArchive: () => toggleArchive(bookmark.id, (bookmark as any).isArchived),
                    onDelete: () => deleteBookmark(bookmark.id)
                  }} 
                  t={t}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    );
  };


  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <ErrorBoundary>
      <div className={`flex min-h-screen bg-surface transition-colors duration-300 pb-24 lg:pb-0 ${isDarkMode ? 'dark' : ''}`}>
        {/* --- Add Bookmark Modal --- */}
        <AnimatePresence>
          {isAddModalOpen && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAddModalOpen(false)}
                className="absolute inset-0 bg-on-surface/40 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md bg-surface-container-lowest rounded-3xl shadow-2xl p-8 border border-outline-variant/20"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-headline font-extrabold">{t.addBookmark}</h3>
                  <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {!user ? (
                  <div className="text-center py-8">
                    <LogIn className="w-12 h-12 text-primary mx-auto mb-4 opacity-20" />
                    <p className="text-sm text-outline mb-6">Please sign in to save bookmarks to your personal collection.</p>
                    <button 
                      onClick={signIn}
                      className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      Sign In with Google
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-1.5 ml-1">Title</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/20 focus:border-primary outline-none transition-all text-on-surface"
                        placeholder="e.g. Bilibili"
                        value={newBookmark.title}
                        onChange={e => setNewBookmark(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-1.5 ml-1">URL</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/20 focus:border-primary outline-none transition-all text-on-surface"
                        placeholder="https://..."
                        value={newBookmark.url}
                        onChange={e => setNewBookmark(prev => ({ ...prev, url: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-1.5 ml-1">Category</label>
                      <select 
                        className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/20 focus:border-primary outline-none transition-all text-on-surface appearance-none"
                        value={newBookmark.categoryId}
                        onChange={e => setNewBookmark(prev => ({ ...prev, categoryId: e.target.value }))}
                      >
                        <option value="">Select Category</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{t[c.id as keyof typeof t] || c.title}</option>)}
                      </select>
                    </div>
                    <button 
                      onClick={handleAddBookmark}
                      disabled={!newBookmark.title || !newBookmark.url || !newBookmark.categoryId}
                      className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-4 disabled:opacity-50 disabled:scale-100"
                    >
                      {t.addBookmark}
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      {/* --- Command Palette Modal --- */}
      <AnimatePresence>
        {isCommandPaletteOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCommandPaletteOpen(false)}
              className="absolute inset-0 bg-on-surface/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="relative w-full max-w-2xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/20 overflow-hidden"
            >
              <div className="p-4 border-b border-outline-variant/10 flex items-center gap-4">
                <Search className="w-5 h-5 text-primary" />
                <input 
                  autoFocus
                  type="text"
                  placeholder={t.typeCommand}
                  className="flex-1 bg-transparent border-none outline-none text-lg font-headline font-semibold placeholder:text-outline/40 text-on-surface"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 rounded bg-surface-container-low text-[10px] font-bold text-outline border border-outline-variant/20">ESC</kbd>
                </div>
              </div>
              <div className="p-2 max-h-[400px] overflow-y-auto">
                <div className="px-3 py-2 text-[10px] font-bold text-outline uppercase tracking-widest">{t.quickActions}</div>
                <button 
                  onClick={() => {
                    setIsCommandPaletteOpen(false);
                    setIsAddModalOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-primary/5 text-left group transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center text-primary">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{t.addBookmark}</p>
                    <p className="text-[10px] text-outline">Create a new entry in your collection</p>
                  </div>
                  <kbd className="px-1.5 py-0.5 rounded bg-surface-container-low text-[10px] font-bold text-outline opacity-0 group-hover:opacity-100 transition-opacity">A</kbd>
                </button>
                <button 
                  onClick={toggleTheme}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-primary/5 text-left group transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-secondary-fixed flex items-center justify-center text-secondary">
                    {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{t.changeTheme}</p>
                    <p className="text-[10px] text-outline">{t.themeDesc}</p>
                  </div>
                  <kbd className="px-1.5 py-0.5 rounded bg-surface-container-low text-[10px] font-bold text-outline opacity-0 group-hover:opacity-100 transition-opacity">T</kbd>
                </button>
              </div>
              <div className="p-3 bg-surface-container-low flex justify-between items-center">
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-outline">
                    <kbd className="px-1.5 py-0.5 rounded bg-surface-container-lowest border border-outline-variant/20">↑↓</kbd> {t.navigate}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-outline">
                    <kbd className="px-1.5 py-0.5 rounded bg-surface-container-lowest border border-outline-variant/20">↵</kbd> {t.select}
                  </div>
                </div>
                <p className="text-[10px] font-bold text-outline/40">Lumina v1.0.4</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Sidebar --- */}
      <aside className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 bg-surface-container-low border-r-0 p-6 z-50">
        <div className="mb-10 px-2">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <LayoutGrid className="w-6 h-6 fill-current" />
            </div>
            <h1 className="text-2xl font-headline font-extrabold tracking-tighter">Lumina</h1>
          </div>
          <p className="text-[10px] font-bold text-outline uppercase tracking-[0.2em] ml-1">{t.luminaSpace}</p>
        </div>

        <nav className="flex-1 space-y-1">
          <SidebarItem icon={LayoutGrid} label={t.dashboard} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarItem icon={Star} label={t.favorites} active={activeTab === 'favorites'} onClick={() => setActiveTab('favorites')} />
          <SidebarItem icon={Briefcase} label={t.work} active={activeTab === 'work'} onClick={() => setActiveTab('work')} />
          <SidebarItem icon={UserIcon} label={t.personal} active={activeTab === 'personal'} onClick={() => setActiveTab('personal')} />
          <SidebarItem icon={Archive} label={t.archive} active={activeTab === 'archive'} onClick={() => setActiveTab('archive')} />
        </nav>

        <div className="mt-auto space-y-4">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="w-full py-3 px-4 bg-gradient-to-r from-primary to-primary-container text-white rounded-full text-sm font-bold flex items-center justify-center gap-2 cloud-shadow hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            {t.addBookmark}
          </button>
          
          <SidebarItem icon={Settings} label={t.settings} active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
          
          <div className="pt-4 border-t border-outline-variant/20 flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm bg-surface-container-high">
              {user ? (
                <img 
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                  alt="User" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-outline">
                  <UserIcon className="w-5 h-5" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{user?.displayName || 'Guest'}</p>
              <p className="text-[10px] text-outline font-medium uppercase tracking-wider">{user ? t.curatorPro : 'Sign In Required'}</p>
            </div>
            {user && (
              <button 
                onClick={firebaseLogOut}
                className="p-2 text-outline hover:text-primary transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 glass h-20 flex items-center justify-between px-4 sm:px-8 lg:px-12">
          <div className="flex-1 max-w-2xl flex items-center gap-4">
            <div className="lg:hidden w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shrink-0">
              <LayoutGrid className="w-6 h-6 fill-current" />
            </div>
            <div 
              className="relative group cursor-pointer flex-1"
              onClick={() => setIsCommandPaletteOpen(true)}
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-primary transition-colors" />
              <div className="w-full h-12 pl-12 pr-4 bg-surface-container-highest/50 border-none rounded-xl flex items-center text-outline/60 text-xs sm:text-sm font-sans truncate">
                {t.searchPlaceholder}
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1.5">
                <kbd className="px-2 py-1 rounded bg-surface text-[10px] font-bold text-outline border border-outline-variant/20 shadow-sm">{isMac ? '⌘' : 'Ctrl'}</kbd>
                <kbd className="px-2 py-1 rounded bg-surface text-[10px] font-bold text-outline border border-outline-variant/20 shadow-sm">K</kbd>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 ml-2 sm:ml-8">
            <button 
              onClick={toggleLang}
              className="p-2 sm:p-2.5 text-outline hover:text-on-surface hover:bg-surface-container-high rounded-full transition-all flex items-center gap-2"
            >
              <Languages className="w-4 h-4 sm:w-5 h-5" />
              <span className="text-[10px] sm:text-xs font-bold hidden sm:block">{lang.toUpperCase()}</span>
            </button>
            <button 
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 text-outline hover:text-on-surface hover:bg-surface-container-high rounded-full transition-all"
            >
              {isDarkMode ? <Sun className="w-4 h-4 sm:w-5 h-5" /> : <Moon className="w-4 h-4 sm:w-5 h-5" />}
            </button>
            <button className="hidden sm:flex p-2.5 text-outline hover:text-on-surface hover:bg-surface-container-high rounded-full transition-all relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-white"></span>
            </button>
            <div className="h-6 w-px bg-outline-variant/30 hidden sm:block"></div>
            {!isAuthReady ? (
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            ) : user ? (
              <button className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full bg-surface-container-low hover:bg-surface-container-high transition-all">
                <img 
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                  alt="User" 
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <ChevronDown className="w-3 h-3 sm:w-4 h-4 text-outline" />
              </button>
            ) : (
              <button 
                onClick={signIn}
                className="px-3 sm:px-4 py-2 bg-primary text-white rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-2 hover:scale-105 transition-all"
              >
                <LogIn className="w-3 h-3 sm:w-4 h-4" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-8 lg:p-12 pb-32 lg:pb-12 overflow-y-auto">
          {renderContent()}
        </div>
      </main>

      {/* --- Mobile Bottom Nav --- */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface/80 backdrop-blur-3xl border-t border-outline-variant/10 flex justify-around items-center py-3 px-6 z-50 pb-safe shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'dashboard' ? 'text-primary scale-110' : 'text-outline hover:text-on-surface'}`}
        >
          <LayoutGrid className={`w-6 h-6 ${activeTab === 'dashboard' ? 'fill-current' : ''}`} />
          <span className="text-[10px] font-bold tracking-tight">{t.home}</span>
        </button>
        <button 
          onClick={() => setActiveTab('favorites')}
          className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'favorites' ? 'text-primary scale-110' : 'text-outline hover:text-on-surface'}`}
        >
          <Star className={`w-6 h-6 ${activeTab === 'favorites' ? 'fill-current' : ''}`} />
          <span className="text-[10px] font-bold tracking-tight">{t.saved}</span>
        </button>
        
        <div className="relative -top-6">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="w-14 h-14 bg-gradient-to-br from-primary to-primary-container text-white rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-center active:scale-90 transition-all border-4 border-surface"
          >
            <Plus className="w-7 h-7" />
          </button>
        </div>

        <button 
          onClick={() => setActiveTab('personal')}
          className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'personal' ? 'text-primary scale-110' : 'text-outline hover:text-on-surface'}`}
        >
          <UserIcon className={`w-6 h-6 ${activeTab === 'personal' ? 'fill-current' : ''}`} />
          <span className="text-[10px] font-bold tracking-tight">{t.profile}</span>
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === 'settings' ? 'text-primary scale-110' : 'text-outline hover:text-on-surface'}`}
        >
          <Settings className={`w-6 h-6 ${activeTab === 'settings' ? 'fill-current' : ''}`} />
          <span className="text-[10px] font-bold tracking-tight">{t.settings}</span>
        </button>
      </nav>

      {/* --- Floating Action Button (Desktop Only) --- */}
      <button 
        onClick={() => setIsAddModalOpen(true)}
        className="hidden lg:flex fixed bottom-12 right-12 w-14 h-14 bg-gradient-to-br from-primary to-primary-container text-white rounded-full shadow-2xl items-center justify-center hover:scale-110 active:scale-95 transition-all z-40"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
    </ErrorBoundary>
  );
}
