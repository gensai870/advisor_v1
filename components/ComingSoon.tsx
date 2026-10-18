import AppShell from "./AppShell";

export default function ComingSoon({ title }: { title: string }) {
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
          <p className="text-lg font-bold text-ink">{title}</p>
          <p className="mt-2 text-sm text-ink-soft">このページは準備中です。近日公開予定です。</p>
        </div>
      </div>
    </AppShell>
  );
}
