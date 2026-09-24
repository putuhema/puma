import { HomeWater } from "@/components/home-water";
import { siteConfig } from "@/lib/site";

export default function Home() {
  return (
    <main className="relative isolate -mb-28 flex min-h-svh w-full flex-1 items-center overflow-hidden px-5 pb-36 pt-10 sm:px-10 sm:pb-40 sm:pt-16 lg:px-16">
      <HomeWater />
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-background/38"
        aria-hidden="true"
      />

      <article className="mx-auto w-full max-w-2xl p-7  sm:p-11 lg:p-14">
        <header>
          <h1 className="mt-5 font-serif text-7xl leading-none tracking-[-0.06em] text-balance sm:text-8xl lg:text-9xl">
            puma
          </h1>
          <p className="mt-4 font-serif text-lg italic text-muted-foreground sm:text-xl">
            /puma/
          </p>
        </header>

        <section
          className="mt-12 border-t pt-8"
          aria-labelledby="definition-type"
        >
          <h2
            className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
            id="definition-type"
          >
            noun
          </h2>
          <div className="mt-5 grid grid-cols-[1.5rem_minmax(0,1fr)] gap-3">
            <span
              className="pt-1 font-serif text-base text-muted-foreground"
              aria-hidden="true"
            >
              1.
            </span>
            <p className="font-serif text-2xl/9 tracking-[-0.02em] text-pretty sm:text-3xl/10">
              {siteConfig.description}
            </p>
          </div>
        </section>
      </article>
    </main>
  );
}
