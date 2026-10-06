"use client";

import { useCallback, useRef } from "react";
import { useSound } from "@/components/sound-control";

const navigationSounds: Record<string, string> = {
  "/": "/sound/grunt.mp3",
  "/notes": "/sound/write.mp3",
  "/books": "/sound/book.mp3",
};

/** Returns a function that plays the sound filed under a section's href. */
export function useNavigationSound() {
  const { muted } = useSound();
  const sounds = useRef(new Map<string, HTMLAudioElement>());

  return useCallback(
    (href: string) => {
      const src = navigationSounds[href];
      if (muted || !src) return;

      let sound = sounds.current.get(href);
      if (!sound) {
        sound = new Audio(src);
        sounds.current.set(href, sound);
      }
      sound.currentTime = 0;
      void sound.play();
    },
    [muted],
  );
}
