"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePreferences } from "@/components/set-preferences";
import { useSfx, useSound } from "@/components/sound-control";
import { siteConfig } from "@/lib/site";
import { touredKey } from "@/lib/station-replies";
import type { Archive } from "@/lib/transmission";
import { cn } from "@/lib/utils";

type Route = { value: string; label: string; detail: string; href: string };

type Suggestion = {
  key: string;
  /** What's shown, and typed into the line on Tab. */
  value: string;
  detail: string;
  complete: string;
  route?: Route;
  /** A command that runs on its own, with nothing after it. */
  command?: string;
};

/** The skills the line knows, typed after a slash. */
const commands = [
  { name: "go", detail: "Tune to a channel, a project or a note", takes: true },
  { name: "back", detail: "Back to where you just were", takes: false },
  { name: "home", detail: "Home to the chat with Mr. P", takes: false },
  { name: "teach", detail: "Mr. P's tour: how to get around", takes: false },
  { name: "help", detail: "Same as /teach: the tour again", takes: false },
  { name: "whoami", detail: "Who runs this place", takes: false },
  { name: "now", detail: "What the operator is up to", takes: false },
  { name: "play", detail: "Star Catcher, right here", takes: false },
  { name: "resume", detail: "The plain facts, on teletext", takes: false },
  { name: "guestbook", detail: "Sign the station's book", takes: false },
  { name: "theme", detail: "Change the phosphor: white, green, amber", takes: false },
  { name: "effects", detail: "Scanlines, glow and static on or off", takes: false },
  { name: "mute", detail: "Sound on or off", takes: false },
];

/** Skills that are really a question for Mr. P. */
const questions: Record<string, string> = {
  whoami: "Who runs this place?",
  now: "What's the operator up to these days?",
  play: "I'm bored. Got a game?",
};

/** Skills that are really a trip somewhere. */
const shortcuts: Record<string, string> = {
  home: "/",
  resume: "/teletext",
  guestbook: "/guestbook",
};

/** Everywhere /go can take you: the channels, the extras, then every project and note. */
function routesFor(archive: Archive): Route[] {
  return [
    ...siteConfig.navigation.map((item) => ({
      value: item.label.toLowerCase(),
      label: item.label,
      detail: `Channel 0${item.shortcut}`,
      href: item.href,
    })),
    ...siteConfig.extras.map((item) => ({
      value: item.label.toLowerCase().replace(/\s+/g, "-"),
      label: item.label,
      detail: item.detail,
      href: item.href,
    })),
    ...archive.projects.map((project) => ({
      value: `projects/${project.slug}`,
      label: project.title,
      detail: "Project",
      href: project.href,
    })),
    ...archive.notes.map((note) => ({
      value: `notes/${note.slug}`,
      label: note.title,
      detail: "Note",
      href: note.href,
    })),
  ];
}

/** Splits "/go no" into the command ("go") and what follows ("no"), if anything. */
function parse(draft: string) {
  const body = draft.slice(1);
  const space = body.indexOf(" ");
  return {
    command: (space === -1 ? body : body.slice(0, space)).toLowerCase(),
    argument:
      space === -1
        ? null
        : body
            .slice(space + 1)
            .trim()
            .toLowerCase(),
  };
}

/**
 * Slash commands on a chat line: a leading "/" opens a list of skills, and
 * /go suggests where it can take you. ↑ ↓ pick, Tab completes, Enter goes,
 * Esc clears the line. Skills that are questions go to Mr. P via `onAsk`;
 * /teach and /help replay his tour via `onTeach`, or, away from the desk,
 * take the visitor home to hear it.
 */
export function useSlashCommands({
  draft,
  setDraft,
  archive,
  onAsk,
  onTeach,
}: {
  draft: string;
  setDraft: (draft: string) => void;
  archive: Archive;
  onAsk: (question: string) => void;
  onTeach?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sound = useSfx();
  const { toggleMuted } = useSound();
  const { toggleEffects, cyclePhosphor } = usePreferences();
  const listId = useId();
  // Both reset whenever the draft changes, without an effect.
  const [selection, setSelection] = useState({ draft, index: 0 });
  const [notice, setNotice] = useState<{ draft: string; text: string } | null>(
    null,
  );

  const active = draft.startsWith("/");
  const { command, argument } = parse(draft);
  const routes = routesFor(archive);

  let suggestions: Suggestion[] = [];
  if (active && argument === null) {
    suggestions = commands
      .filter((item) => item.name.startsWith(command))
      .map((item) => ({
        key: item.name,
        value: `/${item.name}`,
        detail: item.detail,
        complete: item.takes ? `/${item.name} ` : `/${item.name}`,
        command: item.takes ? undefined : item.name,
      }));
  } else if (active && command === "go") {
    const query = argument ?? "";
    suggestions = routes
      // No point suggesting the page you're already on.
      .filter((route) => route.href !== pathname)
      .filter(
        (route) =>
          route.value.includes(query) ||
          route.label.toLowerCase().includes(query),
      )
      .sort(
        (a, b) =>
          Number(b.value.startsWith(query)) - Number(a.value.startsWith(query)),
      )
      .map((route) => ({
        key: route.href,
        value: route.value,
        detail:
          route.value === route.label.toLowerCase()
            ? route.detail
            : `${route.detail} · ${route.label}`,
        complete: `/go ${route.value}`,
        route,
      }));
  }

  const index =
    selection.draft === draft
      ? Math.min(selection.index, Math.max(0, suggestions.length - 1))
      : 0;
  const chosen = suggestions[index];
  const warning = notice?.draft === draft ? notice.text : null;

  function go(route: Route) {
    setDraft("");
    if (route.href === pathname) return;
    sound.key();
    router.push(route.href);
  }

  function run(name: string) {
    if (name === "teach" || name === "help") {
      if (onTeach) {
        setDraft("");
        sound.key();
        onTeach();
        return;
      }
      // The tour lives on the desk: forget it was seen, and head home for it.
      window.localStorage.removeItem(touredKey);
      go({ value: name, label: "Home", detail: "", href: "/" });
      return;
    }
    if (shortcuts[name]) {
      go({ value: name, label: name, detail: "", href: shortcuts[name] });
      return;
    }
    setDraft("");
    if (questions[name]) {
      onAsk(questions[name]);
      return;
    }
    sound.key();
    if (name === "theme") cyclePhosphor();
    else if (name === "effects") toggleEffects();
    else if (name === "mute") toggleMuted();
    // Landed here first? There's nowhere on the station to go back to.
    else if (window.history.length > 1) router.back();
    else router.push("/");
  }

  /** Arrows, Tab and Esc while a slash command is being typed. True if handled. */
  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!active || event.altKey || event.metaKey || event.ctrlKey) return false;
    if (event.key === "Tab" && chosen) {
      event.preventDefault();
      setDraft(chosen.complete);
      return true;
    }
    if (
      (event.key === "ArrowDown" || event.key === "ArrowUp") &&
      suggestions.length > 0
    ) {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setSelection({
        draft,
        index: (index + step + suggestions.length) % suggestions.length,
      });
      return true;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setDraft("");
      return true;
    }
    return false;
  }

  /** Enter on a slash command: run it instead of talking. True if it was one. */
  function submit() {
    if (!active) return false;
    if (command === "go" && argument !== null) {
      const exact = routes.find(
        (route) =>
          route.value === argument || route.label.toLowerCase() === argument,
      );
      const target = exact ?? (argument ? chosen?.route : undefined);
      if (target) go(target);
      else {
        sound.error();
        setNotice({
          draft,
          text: argument
            ? `Nowhere called “${argument}”. Pick one below.`
            : "Go where? Pick one below.",
        });
      }
    } else if (commands.some((item) => !item.takes && item.name === command)) {
      run(command);
    } else if (argument === null && chosen?.command) {
      run(chosen.command);
    } else if (argument === null && chosen) {
      setDraft(chosen.complete);
    } else {
      sound.error();
      setNotice({
        draft,
        text: `No skill called “/${command}”. Clear the line and type / to see them all.`,
      });
    }
    return true;
  }

  const open = active && (suggestions.length > 0 || warning !== null);

  return {
    active,
    onKeyDown,
    submit,
    inputProps: {
      role: "combobox" as const,
      "aria-autocomplete": "list" as const,
      "aria-expanded": open,
      "aria-controls": listId,
      "aria-activedescendant":
        open && chosen ? `${listId}-${index}` : undefined,
    },
    menu: open ? (
      <SlashMenu
        id={listId}
        suggestions={suggestions}
        index={index}
        warning={warning}
        onPick={(item) => {
          if (item.route) go(item.route);
          else if (item.command) run(item.command);
          else setDraft(item.complete);
        }}
      />
    ) : null,
  };
}

function SlashMenu({
  id,
  suggestions,
  index,
  warning,
  onPick,
}: {
  id: string;
  suggestions: Suggestion[];
  index: number;
  warning: string | null;
  onPick: (suggestion: Suggestion) => void;
}) {
  return (
    <div className="type-osd absolute inset-x-0 bottom-full z-40 mb-2 border-2 border-foreground bg-surface shadow-[4px_4px_0_var(--osd)]">
      {warning && (
        <p className="border-b border-rule px-3 py-1.5 text-xs text-signal">
          {warning}
        </p>
      )}
      <ul
        id={id}
        role="listbox"
        className="max-h-60 overflow-y-auto py-1 [scrollbar-width:thin]"
      >
        {suggestions.map((suggestion, position) => (
          <li
            key={suggestion.key}
            id={`${id}-${position}`}
            role="option"
            aria-selected={position === index}
            // Keep focus on the line while picking with the mouse.
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onPick(suggestion)}
            className={cn(
              "flex cursor-pointer items-baseline gap-3 px-3 py-1 text-sm",
              position === index
                ? "bg-osd text-osd-foreground [text-shadow:none]"
                : "hover:bg-osd/20",
            )}
          >
            <span className="shrink-0">{suggestion.value}</span>
            <span className="truncate text-xs normal-case opacity-70">
              {suggestion.detail}
            </span>
          </li>
        ))}
      </ul>
      <p className="border-t border-rule px-3 py-1 text-[0.6875rem] text-muted-foreground">
        ↑↓ pick · Tab complete · ⏎ go · Esc clear
      </p>
    </div>
  );
}
