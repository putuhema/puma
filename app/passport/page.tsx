import type { Metadata } from "next";
import Link from "next/link";
import { Passport } from "@/components/passport";
import { siteConfig } from "@/lib/site";

const description = "Your station passport: stickers for exploring every corner of the set.";

export const metadata: Metadata = {
  title: "Passport",
  description,
  alternates: { canonical: "/passport" },
  openGraph: { title: `Passport — ${siteConfig.name}`, description, url: "/passport" },
};

/** Off the dial: the visitor's sticker passport, the inside of a VHS case. */
export default function PassportPage() {
  return (
    <div className="flex flex-1 flex-col px-2 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-16 sm:px-6 lg:px-10 lg:pt-[calc(env(safe-area-inset-top)+1.25rem)]">
      <p className="type-label flex justify-between gap-4 px-1 text-muted-foreground pointer-coarse:pr-14">
        <Link href="/" className="outline-none hover:text-foreground focus-visible:text-foreground">
          ◂ Back to the station <span className="hidden sm:inline">(Esc)</span>
        </Link>
        <span>Kept in this browser</span>
      </p>

      <section className="animate-tube-on mx-auto mt-4 w-full max-w-3xl rounded-sm border-2 border-rule bg-surface p-5 shadow-[inset_0_0_3rem_rgb(0_0_0/0.5)] sm:p-8">
        <div className="flex items-start justify-between gap-4 border-b border-dashed border-rule pb-4">
          <div>
            <h1 className="font-osd text-3xl leading-none uppercase sm:text-4xl">Passport</h1>
            <p className="mt-2 text-sm text-muted-foreground">Field Station P-4 · visitor&rsquo;s copy</p>
          </div>
          <p aria-hidden="true" className="border-2 border-stamp px-2 py-0.5 font-display text-sm font-bold tracking-[0.14em] text-stamp uppercase rotate-[-6deg]">
            Valid
          </p>
        </div>
        <div className="mt-6">
          <Passport />
        </div>
      </section>
    </div>
  );
}
