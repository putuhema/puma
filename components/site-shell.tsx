"use client";

import { useEffect, type ComponentType, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpenIcon,
  FlaskConicalIcon,
  HouseIcon,
  StickyNoteIcon,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
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
  "/books": BookOpenIcon,
  "/playground": FlaskConicalIcon,
};

const shortcutDestinations: ReadonlyMap<string, string> = new Map(
  siteConfig.navigation.map((item) => [item.shortcut, item.href]),
);

function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    function navigateWithShortcut(event: KeyboardEvent) {
      const target = event.target;
      const isTyping =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.matches("input, textarea, select, [role='textbox']"));

      if (
        event.defaultPrevented ||
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        isTyping
      ) {
        return;
      }

      const destination = shortcutDestinations.get(event.key);
      if (!destination) return;

      event.preventDefault();
      router.push(destination);
    }

    window.addEventListener("keydown", navigateWithShortcut);
    return () => window.removeEventListener("keydown", navigateWithShortcut);
  }, [router]);

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
                      prefetch
                      aria-current={isActive ? "page" : undefined}
                      aria-keyshortcuts={item.shortcut}
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
                  {item.label} <Kbd>{item.shortcut}</Kbd>
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
