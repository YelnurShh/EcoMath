import Link from "next/link";
import { ArrowUpRight, Leaf, MessageCircleMore } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <Link className="brand footer-brand" href="/"><span className="brand-mark"><Leaf size={19} /></span><span>EcoMath</span></Link>
        <p>Экологиялық ойлау мен математикалық дәлдікті біріктіретін оқушыларға арналған ғылыми жоба.</p>
        <Link href="/feedback" className="footer-link"><MessageCircleMore size={16} /> Мұғалімге сұрақ қою <ArrowUpRight size={16} /></Link>
      </div>
      <div className="footer-bottom"><span>© 2026 EcoMath ғылыми жобасы</span><span>Табиғатты түсін · Деректі есепте · Шешім ұсын</span></div>
    </footer>
  );
}
