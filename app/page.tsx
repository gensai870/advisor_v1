import Link from "next/link";
import { BookOpen, FileText, Lightbulb, Users, MessageCircle, ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";

const NAV_ITEMS = ["ホーム", "サービス", "活用事例", "コラム", "お知らせ"];

const ICON_ROW = [
  { icon: BookOpen, label: "防災の基礎知識" },
  { icon: FileText, label: "指導案・教材" },
  { icon: Lightbulb, label: "現場のヒント" },
  { icon: Users, label: "事例から学ぶ" },
  { icon: MessageCircle, label: "なんでも相談チャット", href: "/consult" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center justify-between border-b border-black/5 px-8 py-3">
        <Logo />
        <nav className="hidden gap-6 text-sm text-ink-soft md:flex">
          {NAV_ITEMS.map((item) => (
            <span key={item} className="cursor-pointer hover:text-ink">
              {item}
            </span>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-full border border-black/10 px-5 py-2 text-sm font-medium text-ink hover:bg-black/5"
          >
            ログイン
          </Link>
          <Link
            href="/login?mode=signup"
            className="rounded-full bg-coral px-5 py-2 text-sm font-bold text-white hover:bg-coral-dark"
          >
            新規登録
          </Link>
        </div>
      </header>

      <section className="bg-cream px-8 py-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 md:grid-cols-2">
          <div>
            <p className="text-lg text-ink-soft">先生のそばに、いつでも。</p>
            <h1 className="mt-2 text-4xl font-extrabold leading-snug text-ink md:text-5xl">
              乳幼児防災
              <br />
              AIアドバイザー
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-ink-soft">
              乳幼児の特性に合わせた防災教育をAIがやさしくサポート。現場の「知りたい」「困った」に、すぐに応えます。
            </p>
            <div className="mt-8 flex items-center gap-6">
              <Link
                href="/login?mode=signup"
                className="flex items-center gap-2 rounded-full bg-coral px-6 py-3 text-sm font-bold text-white hover:bg-coral-dark"
              >
                まずは無料で始める <ArrowRight size={16} />
              </Link>
              <Link href="#" className="text-sm font-medium text-ink underline underline-offset-4">
                サービス紹介をみる →
              </Link>
            </div>
          </div>

          <div className="relative flex justify-center">
            <div className="flex h-72 w-72 items-center justify-center rounded-full bg-white shadow-sm md:h-80 md:w-80">
              <span className="text-7xl">📖</span>
            </div>
            <div className="absolute -top-2 right-4 rounded-2xl bg-white px-4 py-2 text-xs text-ink-soft shadow-sm">
              小さないのちと
              <br />
              大きな未来を
              <br />
              いっしょに。
            </div>
          </div>
        </div>

        <div className="mx-auto mt-16 grid max-w-6xl grid-cols-2 gap-6 md:grid-cols-5">
          {ICON_ROW.map(({ icon: Icon, label, href }) => {
            const inner = (
              <>
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-coral shadow-sm">
                  <Icon size={22} />
                </span>
                <span className="text-xs font-medium text-ink-soft">{label}</span>
              </>
            );
            const cls = "flex flex-col items-center gap-3 text-center";
            return href ? (
              <Link key={label} href={href} className={cls}>
                {inner}
              </Link>
            ) : (
              <div key={label} className={cls}>
                {inner}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
