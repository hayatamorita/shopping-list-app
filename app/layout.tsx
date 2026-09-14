import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "買いもの帳",
  description: "共有できる買い物リスト",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
