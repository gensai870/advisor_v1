"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Bell,
  ChevronDown,
  Home,
  MessageCircle,
  BookOpen,
  FileText,
  Users,
  Newspaper,
  Star,
  Settings,
  LogOut,
  Package,
  Library,
  Menu,
  X,
  ImagePlus,
  ClipboardList,
  MessagesSquare,
} from "lucide-react";
import Logo from "./Logo";
import UsageIndicator from "./UsageIndicator";

const NAV_ITEMS = [
  { href: "/home", label: "ホーム", icon: Home },
  { href: "/chat", label: "避難訓練2.0相談チャット", icon: MessageCircle },
  { href: "/chat-general", label: "なんでも相談チャット（一般AI）", icon: MessagesSquare },
  { href: "/illustration", label: "防災イラスト作成", icon: ImagePlus },
  { href: "/training-plan", label: "避難訓練計画書AI", icon: ClipboardList },
  { href: "/basics", label: "防災の基礎知識", icon: BookOpen },
  { href: "/materials", label: "指導案・教材", icon: FileText },
  { href: "/age-guide", label: "年齢別のポイント", icon: Users },
  { href: "/cases", label: "事例から学ぶ", icon: Users },
  { href: "/stockpile", label: "防災備蓄品の管理", icon: Package },
  { href: "/resources", label: "防災資料集", icon: Library },
  { href: "/column", label: "コラム", icon: Newspaper },
  { href: "/favorites", label: "お気に入り", icon: Star },
];

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      <nav className="space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
                active ? "bg-mint font-semibold text-ink" : "text-ink-soft hover:bg-black/5"
              }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>
      <nav className="space-y-1 border-t border-black/5 pt-3">
        <Link
          href="#"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-soft hover:bg-black/5"
        >
          <Bell size={17} />
          お知らせ
          <span className="ml-auto h-2 w-2 rounded-full bg-coral" />
        </Link>
        <Link
          href="#"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-soft hover:bg-black/5"
        >
          <Settings size={17} />
          設定
        </Link>
        <form action="/api/auth/signout" method="post">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-soft hover:bg-black/5"
          >
            <LogOut size={17} />
            ログアウト
          </button>
        </form>
      </nav>
    </>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F8F9]">
      <header className="flex items-center justify-between border-b border-black/5 bg-white px-4 py-3 md:px-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="メニューを開く"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-black/5 md:hidden"
          >
            <Menu size={20} />
          </button>
          <Logo subtitle={false} />
        </div>
        <div className="hidden max-w-md flex-1 items-center gap-2 rounded-full border border-black/10 px-4 py-2 mx-8 md:flex">
          <Search size={16} className="text-ink-soft" />
          <input
            placeholder="キーワードで検索（例：地震 避難 0〜2歳）"
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink-soft/70"
          />
        </div>
        <div className="flex items-center gap-4">
          <UsageIndicator />
          <Bell size={18} className="text-ink-soft" />
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-mint text-sm">🧑‍🏫</span>
            <div className="hidden text-xs leading-tight sm:block">
              <div className="font-medium text-ink">先生</div>
              <div className="text-ink-soft">幼稚園・保育園</div>
            </div>
            <ChevronDown size={14} className="text-ink-soft" />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-56 shrink-0 flex-col justify-between border-r border-black/5 bg-white p-4 md:flex">
          <NavLinks pathname={pathname} />
        </aside>

        {menuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/30"
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] overflow-y-auto overscroll-contain bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-xl">
              <div className="space-y-3">
                <div className="mb-4 flex items-center justify-between">
                  <Logo subtitle={false} />
                  <button
                    type="button"
                    onClick={() => setMenuOpen(false)}
                    aria-label="メニューを閉じる"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-black/5"
                  >
                    <X size={20} />
                  </button>
                </div>
                <NavLinks pathname={pathname} onNavigate={() => setMenuOpen(false)} />
              </div>
            </div>
          </div>
        )}

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
