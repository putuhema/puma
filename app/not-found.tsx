import Link from "next/link";
import { TubeScreen } from "@/components/tube-screen";

export default function NotFound() {
  return (
    <TubeScreen channel="--" label="No signal" glass="black">
      <span aria-hidden="true" className="tv-static animate-snow absolute inset-0 opacity-35" />
      <div className="relative flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center font-tube uppercase">
        <p className="bg-tube px-3 text-2xl leading-7">Error 404 · sector unmapped</p>
        <h1 className="bg-tube px-4 text-[clamp(4.5rem,13vw,10rem)] leading-[0.85]">No signal</h1>
        <p className="max-w-md bg-tube px-3 text-xl leading-6">
          The page may have moved, stayed a draft, or never existed on this station.
        </p>
        <Link
          href="/"
          className="bg-tube-foreground px-3 text-2xl leading-8 text-tube outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-tube-foreground"
        >
          [1] Return to station
        </Link>
      </div>
    </TubeScreen>
  );
}
