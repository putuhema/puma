"use client";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { ListIcon, PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PanelLabel } from "@/components/catalogue";
import { librarySidebarCookie, type ContentSection } from "@/lib/site";

type LibraryNavigationEntry = {
  href: string;
  slug: string;
  title: string;
};

const drawerTransition = {
  duration: 0.25,
  ease: [0.32, 0.72, 0, 1],
} as const;

function writeSidebarCookie(open: boolean) {
  document.cookie = `${librarySidebarCookie}=${open ? "open" : "closed"}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function LibraryReader({
  children,
  entries,
  initialSidebarOpen,
  section,
}: {
  children: ReactNode;
  entries: LibraryNavigationEntry[];
  initialSidebarOpen: boolean;
  section: Extract<ContentSection, "books" | "notes">;
}) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const [sidebarOpen, setSidebarOpen] = useState(initialSidebarOpen);
  const [sidebarHasInteracted, setSidebarHasInteracted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const sectionTitle = section === "books" ? "Tapes" : "Notes";
  const transition = prefersReducedMotion || !sidebarHasInteracted
    ? { duration: 0 }
    : drawerTransition;

  function toggleSidebar() {
    setSidebarHasInteracted(true);
    const nextState = !sidebarOpen;
    setSidebarOpen(nextState);
    writeSidebarCookie(nextState);
  }

  useEffect(() => {
    function toggleLibrarySidebar(event: KeyboardEvent) {
      const target = event.target;
      const isEditing =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.matches("input, textarea, select, [role='textbox']"));

      if (
        event.defaultPrevented ||
        event.repeat ||
        event.key.toLowerCase() !== "b" ||
        !event.metaKey ||
        event.altKey ||
        event.ctrlKey ||
        event.shiftKey ||
        isEditing
      ) {
        return;
      }

      event.preventDefault();

      if (window.matchMedia("(min-width: 80rem)").matches) {
        setSidebarHasInteracted(true);
        const nextState = !sidebarOpen;
        setSidebarOpen(nextState);
        writeSidebarCookie(nextState);
      } else {
        setMobileOpen((open) => !open);
      }
    }

    window.addEventListener("keydown", toggleLibrarySidebar);
    return () => window.removeEventListener("keydown", toggleLibrarySidebar);
  }, [sidebarOpen]);

  const titleList = (
    <nav aria-label={`${sectionTitle} titles`}>
      {entries.length === 0 ? (
        <p className="px-6 py-6 text-sm text-muted-foreground">
          No titles yet.
        </p>
      ) : (
        <ol>
          {entries.map((entry, index) => {
            const isActive = pathname === entry.href;

            return (
              <li key={entry.slug}>
                <Link
                  href={entry.href}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setMobileOpen(false)}
                  className="group flex min-h-11 items-baseline gap-3 px-6 py-3 text-sm/5 font-medium uppercase outline-none hover:bg-sunken focus-visible:bg-sunken aria-[current=page]:bg-foreground aria-[current=page]:text-background"
                >
                  <span
                    aria-hidden="true"
                    className="w-10 shrink-0 text-muted-foreground group-aria-[current=page]:text-background"
                  >
                    #{String(entries.length - index).padStart(3, "0")}
                  </span>
                  <span>{entry.title}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </nav>
  );

  return (
    <TooltipProvider delay={350}>
      <div className="min-h-svh overflow-x-clip" data-sidebar={sidebarOpen ? "open" : "closed"}>
        <motion.aside
          id="library-sidebar"
          aria-hidden={!sidebarOpen}
          inert={!sidebarOpen}
          animate={{
            opacity: sidebarOpen ? 1 : 0,
            transform: sidebarOpen ? "translateX(0%)" : "translateX(-100%)",
          }}
          initial={false}
          transition={transition}
          className={`fixed top-13 bottom-(--softkeys-height) left-0 z-20 hidden w-84 flex-col border-r bg-background xl:flex ${sidebarOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        >
          <PanelLabel>
            <span>{sectionTitle} · index</span>
            <span aria-hidden="true">⌘B</span>
          </PanelLabel>
          <ScrollArea className="min-h-0 flex-1">{titleList}</ScrollArea>
        </motion.aside>

        <motion.div
          animate={{
            transform: sidebarOpen ? "translateX(21rem)" : "translateX(0rem)",
          }}
          initial={false}
          transition={transition}
          className="fixed top-17 left-4 z-30 hidden xl:block"
        >
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  aria-controls="library-sidebar"
                  aria-expanded={sidebarOpen}
                  aria-keyshortcuts="Meta+B"
                  aria-label={sidebarOpen ? "Hide title sidebar" : "Show title sidebar"}
                  onClick={toggleSidebar}
                  size="icon"
                  variant="outline"
                  className="bg-background"
                />
              }
            >
              {sidebarOpen ? <PanelLeftCloseIcon /> : <PanelLeftOpenIcon />}
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {sidebarOpen ? "Hide titles" : "Show titles"} <Kbd>⌘B</Kbd>
            </TooltipContent>
          </Tooltip>
        </motion.div>

        <div className="fixed top-17 left-4 z-30 xl:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button
                  aria-keyshortcuts="Meta+B"
                  aria-label={`Open ${sectionTitle.toLowerCase()} titles`}
                  size="icon"
                  variant="outline"
                  className="bg-background"
                />
              }
            >
              <ListIcon />
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[min(22rem,calc(100vw-2rem))] gap-0 pb-24"
            >
              <SheetHeader className="border-b px-6 py-5">
                <SheetTitle className="font-display text-4xl font-bold uppercase">
                  {sectionTitle}
                </SheetTitle>
                <SheetDescription>Select a title to read.</SheetDescription>
              </SheetHeader>
              <ScrollArea className="min-h-0 flex-1">{titleList}</ScrollArea>
            </SheetContent>
          </Sheet>
        </div>

        <div
          className="transition-transform duration-[250ms] ease-[cubic-bezier(0.77,0,0.175,1)] data-[sidebar=open]:xl:translate-x-42 data-[sidebar=closed]:xl:translate-x-0 motion-reduce:transition-none"
          data-sidebar={sidebarOpen ? "open" : "closed"}
        >
          {children}
        </div>
      </div>
    </TooltipProvider>
  );
}
