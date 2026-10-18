import { Heart } from "lucide-react";

export default function Logo({ subtitle = true }: { subtitle?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-coral text-white shrink-0">
        <Heart size={18} fill="white" strokeWidth={0} />
      </span>
      <div className="leading-tight">
        <div className="font-bold text-ink text-[15px]">乳幼児防災AIアドバイザー</div>
        {subtitle && <div className="text-[11px] text-ink-soft">子どものいのちと、育ちを守る。</div>}
      </div>
    </div>
  );
}
