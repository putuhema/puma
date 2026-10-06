"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { siteConfig } from "@/lib/site";

const groups: { title: string; keys: [string, string][] }[] = [
  {
    title: "Talking to Mr. P",
    keys: [
      ["Type", "Anything, from anywhere: it lands on the line"],
      ["⏎", "Send it"],
      ["↑ / ↓", "Recall earlier messages"],
      ["Esc", "Fast-forward a reply, close his bubble, or close this map"],
      ["clear", "Type it to rewind the tape"],
    ],
  },
  {
    title: "Channels",
    keys: [
      ...siteConfig.navigation.map((item): [string, string] => [`Alt ${item.shortcut}`, item.label]),
      ["1 2 3", "Same, off the chat"],
      ["go …", "Or just ask Mr. P: \u201ctake me to the notes\u201d"],
      ["Esc", "Leave a text box, then step back out"],
      ["j k g G", "Scroll, top, bottom"],
    ],
  },
  {
    title: "Instruments",
    keys: [
      ["Alt ↑", "Jump into the latest instrument"],
      ["← → / A D", "Steer the saucer in Star Catcher"],
      ["⌘/Ctrl ⏎", "Send from the transmitter"],
      ["Esc", "Back to the line"],
    ],
  },
  {
    title: "The set",
    keys: [
      ["Alt M", "Sound on or off"],
      ["Alt B", "Full lens: bend the picture too"],
      ["Click", "Mr. P: hear what he has to say"],
    ],
  },
];

/**
 * The VCR's on-screen keyboard map, opened with ?. Portalled to the body: the
 * lens filter on the screen would otherwise trap a fixed overlay.
 */
export function KeyboardMap({ onClose }: { onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const returnTo = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    return () => returnTo?.focus();
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-background/70 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard map"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="tube animate-tube-on type-osd max-h-[85dvh] w-full max-w-3xl overflow-y-auto bg-osd px-6 py-6 text-osd-foreground outline-none sm:px-9 sm:py-8"
      >
        <div className="flex items-center justify-between gap-4 bg-osd-foreground px-3 py-1 text-osd [text-shadow:none]">
          <h2 className="text-lg leading-7 sm:text-xl">Keyboard map</h2>
          <button type="button" onClick={onClose} className="text-sm outline-none focus-visible:underline">
            Esc ✕
          </button>
        </div>

        <div className="mt-6 grid gap-x-10 gap-y-6 sm:grid-cols-2">
          {groups.map((group) => (
            <section key={group.title}>
              <h3 className="text-sm leading-6 opacity-80">{group.title}</h3>
              <dl className="mt-2 flex flex-col gap-1.5">
                {group.keys.map(([keys, action]) => (
                  <div key={keys + action} className="flex gap-3 font-tube text-lg leading-5 normal-case">
                    <dt className="w-24 shrink-0">
                      <span className="bg-osd-foreground px-1.5 text-osd [text-shadow:none]">{keys}</span>
                    </dt>
                    <dd>{action}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
