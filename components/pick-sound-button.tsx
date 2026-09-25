"use client";

import { useRef } from "react";
import { AudioLinesIcon } from "lucide-react";
import { useSound } from "@/components/sound-control";
import { Button } from "@/components/ui/button";

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
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label="Play the pronunciation sound"
        onClick={playPickSound}
      >
        <AudioLinesIcon aria-hidden="true" />
      </Button>
    </>
  );
}
