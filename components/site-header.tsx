"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, LayoutDashboard, Leaf, Menu, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";

const baseLinks = [
  ["/", "Басты бет"],
  ["/methods", "Әдістер"],
  ["/lab", "Зертхана"],
  ["/project", "Жоба жоспары"],
  ["/quiz", "Викторина"],
];

export function SiteHeader() {
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const links = [...baseLinks];
  if (user && profile?.role === "student") links.push(["/assignments", "Тапсырмалар"]);
  if (user && profile?.role === "teacher") links.push(["/teacher-dashboard", "Панель"]);
  links.push(["/feedback", "Кері байланыс"]);

  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="EcoMath басты беті">
        <span className="brand-mark"><Leaf size={19} strokeWidth={2.4} /></span>
        <span>EcoMath</span>
      </Link>
      <nav className={open ? "nav-links open" : "nav-links"} aria-label="Негізгі навигация">
        {links.map(([href, label]) => (
          <Link key={href} href={href} className={pathname === href ? "active" : ""} onClick={() => setOpen(false)}>
            {label}
          </Link>
        ))}
      </nav>
      <div className="header-actions">
        {user ? (
          <Link className="header-user-card" href={profile?.role === "teacher" ? "/teacher-dashboard" : "/profile"} aria-label="Профильді ашу">
            <span className="header-avatar">
              {user.photoURL ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" /> : profile?.role === "teacher" ? <LayoutDashboard /> : <UserRound />}
            </span>
            <span className="header-user-copy">
              <strong>{profile?.displayName ?? user.displayName ?? user.email?.split("@")[0] ?? "Қолданушы"}</strong>
              <small><i /> {profile?.role === "teacher" ? "Мұғалім" : "Оқушы"}</small>
            </span>
          </Link>
        ) : (
          <Link className="header-cta gradient-button" href="/login">Кіру / Тіркелу <ArrowUpRight size={16} /></Link>
        )}
        <button className="menu-button" onClick={() => setOpen((value) => !value)} aria-label={open ? "Мәзірді жабу" : "Мәзірді ашу"} aria-expanded={open}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}
