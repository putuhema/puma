"use client";

import { useRef } from "react";
import { useSound } from "@/components/sound-control";

export function PickSoundButton() {
  const { muted } = useSound();
  const pickSound = useRef<HTMLAudioElement>(null);

  function playPickSound() {
    if (!pickSound.current) return;

    pickSound.current.currentTime = 0;
    void pickSound.current.play();
  }

  return (
    <>
      <audio ref={pickSound} src="/pick.mp3" preload="auto" muted={muted} />
      <button
        type="button"
        onClick={playPickSound}
        className="type-label touch-manipulation text-primary underline-offset-4 outline-none hover:underline focus-visible:underline active:opacity-70"
      >
        /Play-sound
      </button>
    </>
  );
}
