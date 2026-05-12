"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  UtensilsCrossed,
  Activity,
  ShoppingCart,
  MessageCircle,
  Settings,
  BookOpen,
  Trophy,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/plan", label: "Plan", icon: UtensilsCrossed },
  { href: "/recipes", label: "Recetas", icon: BookOpen },
  { href: "/track", label: "Tracking", icon: Activity },
  { href: "/hyrox", label: "Hyrox", icon: Trophy },
  { href: "/shopping", label: "Compra", icon: ShoppingCart },
  { href: "/chat", label: "Chat IA", icon: MessageCircle },
  { href: "/settings", label: "Ajustes", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 border-r border-border bg-surface">
      <div className="p-6">
        <h1 className="font-display text-3xl tracking-wide text-accent uppercase">
          OwnHealthyApp
        </h1>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-muted hover:text-text hover:bg-card"
              }`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
