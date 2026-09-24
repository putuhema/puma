import Link from "next/link";
import { siteConfig } from "@/lib/site";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-[calc(100svh-7rem)] w-full max-w-4xl flex-1 items-center px-6 py-16 sm:px-10 lg:px-16">
      <article className="w-full max-w-2xl">
        <header>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
            Personal definition
          </p>
          <h1 className="mt-5 font-serif text-7xl leading-none tracking-[-0.06em] text-balance sm:text-8xl lg:text-9xl">
            puma
          </h1>
          <p className="mt-4 font-serif text-lg italic text-muted-foreground sm:text-xl">
            /puma/
          </p>
        </header>

        <section className="mt-12 border-t pt-8" aria-labelledby="definition-type">
          <h2
            className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
            id="definition-type"
          >
            noun
          </h2>
          <div className="mt-5 grid grid-cols-[1.5rem_minmax(0,1fr)] gap-3">
            <span className="pt-1 font-serif text-base text-muted-foreground" aria-hidden="true">
              1.
            </span>
            <p className="font-serif text-2xl/9 tracking-[-0.02em] text-pretty sm:text-3xl/10">
              {siteConfig.description}
            </p>
          </div>
        </section>

        <footer className="mt-12 flex flex-wrap items-baseline gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <span className="font-serif italic">See also:</span>
          {siteConfig.navigation.slice(1).map((item) => (
            <Link
              className="rounded-sm underline decoration-border underline-offset-4 transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
              href={item.href}
              key={item.href}
            >
              {item.label.toLowerCase()}
            </Link>
          ))}
        </footer>
      </article>
    </main>
  );
}
