"use client";

import { useEffect, useState } from "react";

type Usage =
  | { available: false }
  | { available: true; usedUSD: number; budgetUSD: number; percentage: number };

export default function UsageIndicator() {
  const [usage, setUsage] = useState<Usage | null>(null);

  useEffect(() => {
    fetch("/api/usage")
      .then((r) => r.json())
      .then(setUsage)
      .catch(() => setUsage({ available: false }));
  }, []);

  if (!usage) return null;

  if (!usage.available) {
    return (
      <div
        className="hidden items-center gap-1 md:flex"
        title="使用状況：未設定（管理者APIキー未設定）"
      >
        <div className="h-1.5 w-10 overflow-hidden rounded-full bg-black/10" />
        <span className="whitespace-nowrap text-[11px] text-ink-soft/60">使用状況: 未設定</span>
      </div>
    );
  }

  const pct = Math.min(100, usage.percentage);
  const barColor = pct >= 90 ? "bg-coral" : pct >= 70 ? "bg-amber-400" : "bg-mint-dark";

  return (
    <div
      className="hidden items-center gap-1 md:flex"
      title={`今月の使用額: $${usage.usedUSD.toFixed(2)} / $${usage.budgetUSD.toFixed(2)}`}
    >
      <div className="h-1.5 w-10 overflow-hidden rounded-full bg-black/10">
        <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="whitespace-nowrap text-[11px] text-ink-soft">{pct}%</span>
    </div>
  );
}
