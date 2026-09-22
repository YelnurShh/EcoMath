import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AuthProvider } from "@/components/auth-provider";

export const metadata: Metadata = {
  title: "EcoMath — Экологияны сандармен зертте",
  description: "Экологиялық мәселелерді математикалық модельдер, статистика және интерактивті есептер арқылы зерттейтін оқушыларға арналған ғылыми жоба.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="kk">
      <body className="antialiased">
        <AuthProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
