"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/textbooks", label: "Textbooks" },
  { href: "/dorm", label: "Dorm" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-6 font-mono text-xs uppercase tracking-[0.14em]">
      {links.map((link) => {
        const active = pathname?.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`relative rounded-sm pb-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald ${
              active ? "text-ink" : "text-ink-soft hover:text-ink"
            }`}
          >
            {link.label}
            <span
              className={`absolute inset-x-0 -bottom-[1px] h-[2px] bg-emerald transition-transform duration-200 ${
                active ? "scale-x-100" : "scale-x-0"
              }`}
            />
          </Link>
        );
      })}
    </nav>
  );
}
