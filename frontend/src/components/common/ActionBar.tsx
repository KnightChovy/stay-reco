"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronDown, MoreHorizontal, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type ActionMenuItem = {
  label: string;
  /** One line saying what it does or what it costs; required for destructive items. */
  description?: string;
  icon?: LucideIcon;
  href?: string;
  onSelect?: () => void;
  destructive?: boolean;
  disabled?: boolean;
};

/**
 * The secondary actions of an area, behind one button. Destructive items go last, red, after a separator.
 * `variant="icon"` is the compact "⋯" for cards and list rows; the default is a labelled button.
 */
export function ActionMenu({
  items,
  label = "Thao tác khác",
  variant = "button",
  className,
}: {
  items: ActionMenuItem[];
  label?: string;
  variant?: "button" | "icon";
  className?: string;
}) {
  const visible = items.filter(Boolean);
  if (visible.length === 0) return null;
  const safe = visible.filter((item) => !item.destructive);
  const destructive = visible.filter((item) => item.destructive);

  const renderItem = (item: ActionMenuItem) => {
    const Icon = item.icon;
    const body = (
      <>
        {Icon && <Icon className="mt-0.5 size-4" aria-hidden />}
        <span className="min-w-0">
          <span className="block text-sm font-semibold">{item.label}</span>
          {item.description && (
            <span className="block text-xs font-normal text-muted-foreground">{item.description}</span>
          )}
        </span>
      </>
    );
    return (
      <DropdownMenuItem
        key={item.label}
        variant={item.destructive ? "destructive" : "default"}
        disabled={item.disabled}
        onClick={item.onSelect}
        render={item.href ? <Link href={item.href} /> : undefined}
        className="cursor-pointer items-start gap-2.5 rounded-lg px-2.5 py-2"
      >
        {body}
      </DropdownMenuItem>
    );
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        render={
          variant === "icon" ? (
            <Button variant="ghost" size="icon" className={cn("size-10 shrink-0", className)} aria-label={label} />
          ) : (
            <Button variant="outline" className={cn("h-10 shrink-0 gap-1.5 px-4 whitespace-nowrap", className)} />
          )
        }
      >
        {variant === "icon" ? (
          <MoreHorizontal className="size-5" />
        ) : (
          <>
            {label} <ChevronDown className="size-3.5" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-xl p-1.5">
        {safe.map(renderItem)}
        {safe.length > 0 && destructive.length > 0 && <DropdownMenuSeparator />}
        {destructive.map(renderItem)}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * One primary action and the rest in a menu (the /account rule: never a row of equal buttons). Nothing wraps; on
 * small screens the primary stretches and the menu sits beside it.
 */
export function ActionBar({
  primary,
  menu = [],
  menuLabel,
  className,
}: {
  primary?: ReactNode;
  menu?: ActionMenuItem[];
  menuLabel?: string;
  className?: string;
}) {
  if (!primary && menu.length === 0) return null;
  return (
    <div className={cn("flex shrink-0 items-center gap-2 [&>a]:flex-1 md:[&>a]:flex-none", className)}>
      {primary}
      <ActionMenu items={menu} label={menuLabel} />
    </div>
  );
}
