import Link from "next/link";
import { BookOpen, FileText, Users, MessageCircle, ArrowRight } from "lucide-react";
import AppShell from "@/components/AppShell";

const FEATURE_CARDS = [
  {
    href: "/basics",
    icon: BookOpen,
    bg: "bg-skyish",
    title: "防災の基礎知識",
    desc: "乳幼児の特性に合わせたやさしい解説",
  },
  {
    href: "/materials",
    icon: FileText,
    bg: "bg-peach",
    title: "指導案・教材",
    desc: "すぐに使えるテンプレート・資料",
  },
  {
    href: "/age-guide",
    icon: Users,
    bg: "bg-mint",
    title: "年齢別のポイント",
    desc: "発達段階に応じた指導のヒント",
  },
  {
    href: "/chat",
    icon: MessageCircle,
    bg: "bg-lilac",
    title: "なんでも相談チャット",
    desc: "現場の悩みをAIに相談できます",
  },
];

const NOTICES = [
  { date: "2026.09.10", text: "新しい指導案テンプレートを追加しました" },
  { date: "2026.09.05", text: "オンライン研修会のご案内" },
  { date: "2026.08.28", text: "事例インタビューを公開しました" },
];

const POPULAR = ["避難のしかた（0〜2歳）", "地震のときの対応（園での備え）", "保護者への伝え方（おたより文例）"];

export default function HomePage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr]">
          <div className="rounded-2xl bg-mint p-6">
            <p className="text-lg font-bold text-ink">こんにちは、先生</p>
            <p className="mt-1 text-sm text-ink-soft">今日も、子どもたちの未来のために。</p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold text-ink-soft">今日のひとこと</p>
            <p className="mt-2 text-sm text-ink">「備えることは、子どもたちの可能性を守ること。」</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {FEATURE_CARDS.map(({ href, icon: Icon, bg, title, desc }) => (
            <Link
              key={title}
              href={href}
              className={`flex flex-col justify-between rounded-2xl ${bg} p-5 transition hover:brightness-95`}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-ink">
                <Icon size={18} />
              </span>
              <div className="mt-6">
                <p className="text-sm font-bold text-ink">{title}</p>
                <p className="mt-1 text-xs text-ink-soft">{desc}</p>
              </div>
              <ArrowRight size={16} className="mt-3 text-ink-soft" />
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-ink">お知らせ</p>
              <Link href="#" className="text-xs text-coral">一覧を見る →</Link>
            </div>
            <ul className="mt-3 space-y-2">
              {NOTICES.map((n) => (
                <li key={n.text} className="flex gap-3 text-sm">
                  <span className="shrink-0 text-xs text-ink-soft">{n.date}</span>
                  <span className="text-ink">{n.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-ink">よく使われているコンテンツ</p>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {POPULAR.map((p) => (
                <div key={p} className="rounded-xl bg-cream p-3 text-center text-[11px] text-ink-soft">
                  {p}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
