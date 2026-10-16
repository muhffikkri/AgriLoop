"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/role-nav.ts";

export function WorkspaceNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <ul className="ws-nav">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <li key={item.href}>
            <Link className="ws-link" href={item.href} aria-current={active ? "page" : undefined}>
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
