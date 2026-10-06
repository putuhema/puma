"use client";

import { useEffect } from "react";
import Link from "next/link";
import { TubeScreen } from "@/components/tube-screen";

/** When a page breaks: the signal drops, and there's a button to retune. */
export default function SignalLost({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error("P-4 signal lost", error);
  }, [error]);

  return (
    <TubeScreen channel="!!" label="Signal lost" glass="blue">
      <span aria-hidden="true" className="tv-static animate-snow absolute inset-0 opacity-25" />
      <div className="type-osd relative flex flex-1 flex-col items-center justify-center gap-5 p-6 text-center">
        <p className="bg-osd-foreground px-2 text-lg text-osd">Signal lost</p>
        <h1 className="text-3xl leading-tight sm:text-5xl">This channel dropped out</h1>
        <p className="max-w-md text-sm leading-6 normal-case">
          Something on the station broke mid-broadcast. Mr. P is hitting the side of the set. Try retuning.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => retry()}
            className="bg-osd-foreground px-3 py-1 text-osd outline-none focus-visible:ring-2 focus-visible:ring-osd-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-osd"
          >
            ↻ Retune
          </button>
          <Link href="/" className="border border-osd-foreground px-3 py-1 outline-none focus-visible:ring-2 focus-visible:ring-osd-foreground">
            Back to the station
          </Link>
        </div>
        {error.digest && <p className="text-[0.625rem] opacity-60">Fault {error.digest}</p>}
      </div>
    </TubeScreen>
  );
}
