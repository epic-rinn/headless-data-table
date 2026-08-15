"use client";

import clsx from "clsx";
import { PanelLeft, PanelLeftClose } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { NAV_ITEMS, SIDEBAR_WIDTH } from "@/constants";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const labelClass = collapsed ? "lg:hidden" : "hidden lg:inline";

  return (
    <aside
      className={clsx(
        "sticky top-0 flex h-dvh shrink-0 flex-col border-r border-border-subtle bg-surface",
        "w-14 transition-[width] duration-200",
        collapsed ? SIDEBAR_WIDTH.collapsed : SIDEBAR_WIDTH.expanded,
      )}
    >
      <div className="flex h-14 items-center gap-2 px-4">
        <span
          aria-hidden
          className="size-4.5 shrink-0 rounded-[5px] bg-accent"
        />
        <span
          className={clsx(
            "truncate font-display text-base font-semibold tracking-tight",
            labelClass,
          )}
        >
          Studio Ops
        </span>
      </div>

      <nav aria-label="Main" className="flex-1 px-2 py-2">
        <ul className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  title={item.label}
                  className={clsx(
                    "flex h-9 items-center gap-2.5 rounded-md px-2.5 transition-colors",
                    active
                      ? "bg-accent-tint text-accent"
                      : "text-text-secondary hover:bg-row-hover hover:text-text-primary",
                  )}
                >
                  <Icon size={16} strokeWidth={2} aria-hidden />
                  <span className={clsx("truncate text-sm", labelClass)}>
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-border-subtle p-2">
        <Button
          variant="ghost"
          size="sm"
          icon={collapsed ? PanelLeft : PanelLeftClose}
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          className="hidden w-full justify-start lg:inline-flex"
        >
          <span className={collapsed ? "hidden" : undefined}>Collapse</span>
        </Button>
      </div>
    </aside>
  );
}
