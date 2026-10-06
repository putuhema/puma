"use client";

import { MrP3D } from "@/components/mr-p-3d";

/**
 * Off the chat, Mr. P floats docked in the bottom-right corner, bobbing in
 * place: close enough to poke, never drifting over a link.
 */
export function DockedMrP() {
  return (
    <div className="fixed right-2 bottom-2 z-50 pb-[env(safe-area-inset-bottom)]">
      <MrP3D state="idle" emotion="happy" className="block h-28 w-24 sm:h-36 sm:w-32" />
    </div>
  );
}
