"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Leaf, Menu, UserRound, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";

const links = [
  ["/", "Басты бет"],
  ["/methods", "Әдістер"],
  ["/lab", "Зертхана"],
  ["/project", "Жоба жоспары"],
  ["/quiz", "Викторина"],
  ["/feedback", "Кері байланыс"],
];

export function SiteHeader() {
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="EcoMath басты беті">
        <span className="brand-mark"><Leaf size={19} strokeWidth={2.4} /></span>
        <span>EcoMath</span>
      </Link>
      <nav className={open ? "nav-links open" : "nav-links"} aria-label="Негізгі навигация">
        {links.map(([href, label]) => (
          <Link key={href} href={href} className={pathname === href ? "active" : ""} onClick={() => setOpen(false)}>{label}</Link>
        ))}
      </nav>
      <div className="header-actions">
        {user ? <Link className="header-user-card" href="/profile" aria-label="Профильді ашу"><span className="header-avatar">{user.photoURL ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" /> : <UserRound />}</span><span className="header-user-copy"><strong>{user.displayName ?? user.email?.split("@")[0] ?? "Қолданушы"}</strong><small><i /> {profile?.role === "teacher" ? "Мұғалім" : "Оқушы"}</small></span></Link> : <Link className="header-cta gradient-button" href="/login">Кіру / Тіркелу <ArrowUpRight size={16} /></Link>}
        <button className="menu-button" onClick={() => setOpen((value) => !value)} aria-label={open ? "Мәзірді жабу" : "Мәзірді ашу"} aria-expanded={open}>{open ? <X /> : <Menu />}</button>
      </div>
    </header>
  );
}
