"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Home,
  UtensilsCrossed,
  Activity,
  ShoppingCart,
  MessageCircle,
  MoreHorizontal,
  BookOpen,
  Trophy,
  Settings,
  X,
} from "lucide-react";

const primaryItems = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/plan", label: "Plan", icon: UtensilsCrossed },
  { href: "/track", label: "Track", icon: Activity },
  { href: "/chat", label: "Chat", icon: MessageCircle },
];

const moreItems = [
  { href: "/recipes", label: "Recetas", icon: BookOpen },
  { href: "/hyrox", label: "Hyrox", icon: Trophy },
  { href: "/shopping", label: "Compra", icon: ShoppingCart },
  { href: "/settings", label: "Ajustes", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = moreItems.some(({ href }) => pathname.startsWith(href));

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface md:hidden">
        <div className="flex items-center justify-around py-2">
          {primaryItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ${
                  isActive ? "text-accent" : "text-muted"
                }`}
              >
                <Icon size={20} />
                <span>{label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-label="Más opciones"
            aria-expanded={moreOpen}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ${
              isMoreActive ? "text-accent" : "text-muted"
            }`}
          >
            <MoreHorizontal size={20} />
            <span>Más</span>
          </button>
        </div>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setMoreOpen(false)}
            className="absolute inset-0 bg-black/60"
          />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <span className="text-sm font-medium text-muted">Más</span>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                aria-label="Cerrar"
                className="text-muted hover:text-text"
              >
                <X size={20} />
              </button>
            </div>
            <ul className="px-2 pb-4">
              {moreItems.map(({ href, label, icon: Icon }) => {
                const isActive = pathname.startsWith(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={() => setMoreOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors ${
                        isActive
                          ? "bg-accent/10 text-accent"
                          : "text-text hover:bg-card"
                      }`}
                    >
                      <Icon size={20} />
                      <span>{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
