"use client";

import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenIcon,
  FileTextIcon,
  FolderIcon,
  HouseIcon,
  StickyNoteIcon,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { siteConfig } from "@/lib/site";

const navigationIcons: Record<string, ComponentType<{ "aria-hidden"?: boolean }>> = {
  "/": HouseIcon,
  "/notes": StickyNoteIcon,
  "/essays": FileTextIcon,
  "/books": BookOpenIcon,
  "/projects": FolderIcon,
};

function BottomNavigation() {
  const pathname = usePathname();

  return (
    <TooltipProvider delay={450}>
      <nav
        aria-label="Primary navigation"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border bg-popover/95 p-1.5 shadow-lg shadow-foreground/8 backdrop-blur-md">
          {siteConfig.navigation.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = navigationIcons[item.href];

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger
                  render={
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      aria-label={item.label}
                      className={buttonVariants({
                        size: "icon-lg",
                        variant: isActive ? "secondary" : "ghost",
                        className: "rounded-full touch-manipulation",
                      })}
                    />
                  }
                >
                  <Icon aria-hidden />
                  <span className="sr-only">{item.label}</span>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={10}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </nav>
    </TooltipProvider>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col pb-28">
      {children}
      <BottomNavigation />
    </div>
  );
}
