import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "乳幼児防災AIアドバイザー",
  description: "子どものいのちと、育ちを守る。会員施設向け防災AIアドバイザー",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="font-sans">{children}</body>
    </html>
  );
}
