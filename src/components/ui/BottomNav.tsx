"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    id: "home",
    label: "Home",
    href: "/",
  },
  {
    id: "optimizer",
    label: "AI Yield",
    href: "/optimizer",
  },
  {
    id: "pool",
    label: "Pool",
    href: "/pool",
  },
  {
    id: "leaderboard",
    label: "Rank",
    href: "/peringkat",
  },
  {
    id: "profile",
    label: "Profile",
    href: "/profil",
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#1e2a4a]">
      <div className="max-w-lg mx-auto px-2 pb-safe">
        <div className="flex items-center justify-around h-14">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center justify-center px-2 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "text-white font-semibold bg-white/10"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                <span className="text-lg">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
