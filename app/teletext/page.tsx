import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { PrintButton } from "@/components/print-button";
import { getEntries } from "@/lib/content";
import { formatEntryDate } from "@/lib/format";
import { now, profile, profileLinks, siteConfig } from "@/lib/site";

const description = `The plain facts about ${siteConfig.fullname}: role, work, and how to get in touch.`;

export const metadata: Metadata = {
  title: "Teletext",
  description,
  alternates: { canonical: "/teletext" },
  openGraph: { title: `Teletext — ${siteConfig.name}`, description, url: "/teletext" },
};

/** A coloured teletext band heading a block of facts. */
function Band({ color, children }: { color: string; children: ReactNode }) {
  return (
    <h2 className={`mt-8 px-2 text-2xl leading-8 text-black [text-shadow:none] print:border-b-2 print:border-black print:bg-transparent print:px-0 ${color}`}>
      {children}
    </h2>
  );
}

/**
 * Page 100: everything a recruiter needs, with no alien, no static and no
 * chat. Teletext on screen, plain black ink on paper.
 */
export default function TeletextPage() {
  const projects = getEntries("projects");
  const notes = getEntries("notes").slice(0, 5);
  const absolute = (href: string) => new URL(href, siteConfig.url).toString();

  return (
    <div className="flex flex-1 flex-col px-2 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-16 sm:px-6 lg:px-10 lg:pt-[calc(env(safe-area-inset-top)+1.25rem)] print:p-0">
      <p className="type-label flex justify-between gap-4 px-1 text-muted-foreground print:hidden pointer-coarse:pr-14">
        <Link href="/" className="outline-none hover:text-foreground focus-visible:text-foreground">
          ◂ Back to the station <span className="hidden sm:inline">(Esc)</span>
        </Link>
        <PrintButton className="outline-none hover:text-foreground focus-visible:text-foreground">Print / save as PDF</PrintButton>
      </p>

      <article className="animate-tube-on mx-auto mt-4 w-full max-w-3xl bg-black px-4 py-5 font-tube text-xl leading-7 text-white sm:px-8 sm:py-7 sm:text-2xl print:mt-0 print:max-w-none print:bg-white print:p-0 print:font-sans print:text-sm print:leading-6 print:text-black">
        <p className="flex justify-between gap-4 text-[#ffff00] print:hidden">
          <span>P100</span>
          <span>{siteConfig.name.toUpperCase()} TELETEXT</span>
          <span>{formatEntryDate(now.updatedAt).toUpperCase()}</span>
        </p>

        <header className="mt-4 bg-[#0000ff] px-3 py-3 print:bg-transparent print:px-0">
          <h1 className="text-5xl leading-[0.9] text-[#ffff00] uppercase sm:text-6xl print:text-3xl print:text-black">
            {siteConfig.fullname}
          </h1>
          <p className="mt-2 text-[#00ffff] uppercase print:text-black">
            {profile.role}
            {profile.location ? ` · ${profile.location}` : ""}
          </p>
        </header>

        <p className="mt-5">{profile.summary}</p>

        {profile.experience.length > 0 && (
          <section>
            <Band color="bg-[#00ffff]">EXPERIENCE</Band>
            <ul className="mt-2">
              {profile.experience.map((job) => (
                <li key={`${job.period}${job.title}`} className="flex flex-col sm:flex-row sm:gap-4">
                  <span className="shrink-0 text-[#ffff00] sm:w-40 print:text-black">{job.period}</span>
                  <span>
                    {job.title}, {job.place}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {profile.skills.length > 0 && (
          <section>
            <Band color="bg-[#00ff00]">SKILLS</Band>
            <p className="mt-2">{profile.skills.join(" · ")}</p>
          </section>
        )}

        <section>
          <Band color="bg-[#ffff00]">PROJECTS</Band>
          {projects.length ? (
            <ul className="mt-2 flex flex-col gap-3">
              {projects.map((project) => (
                <li key={project.href}>
                  <Link href={project.href} className="text-[#00ffff] uppercase underline-offset-4 outline-none hover:underline focus-visible:underline print:text-black">
                    {project.title}
                  </Link>
                  <span className="text-[#ffff00] print:text-black"> · {project.publishedAt.slice(0, 4)}</span>
                  <p>{project.summary}</p>
                  {project.stack.length > 0 && <p className="text-[#00ff00] print:text-black">{project.stack.join(" · ")}</p>}
                  <p className="hidden print:block">{absolute(project.href)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2">None filed yet.</p>
          )}
        </section>

        {notes.length > 0 && (
          <section>
            <Band color="bg-[#ff00ff]">RECENT NOTES</Band>
            <ul className="mt-2">
              {notes.map((note) => (
                <li key={note.href} className="flex gap-4">
                  <span className="shrink-0 text-[#ffff00] print:text-black">{note.publishedAt}</span>
                  <Link href={note.href} className="outline-none hover:underline focus-visible:underline">
                    {note.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <Band color="bg-[#ff0000]">CONTACT</Band>
          <ul className="mt-2">
            <li>
              Transmitter: <span className="text-[#00ffff] print:text-black">{absolute("/")}</span>{" "}
              <span className="opacity-80">(ask Mr. P to get in touch)</span>
            </li>
            {profileLinks.map((link) => (
              <li key={link.label}>
                {link.label}:{" "}
                <a href={link.href} className="text-[#00ffff] outline-none hover:underline focus-visible:underline print:text-black">
                  {link.href.startsWith("/") ? absolute(link.href) : link.href.replace(/^(mailto:|https?:\/\/)/, "")}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <nav aria-label="More pages" className="mt-8 flex flex-wrap gap-x-4 bg-[#0000ff] px-2 text-[#ffff00] print:hidden">
          {[...siteConfig.navigation, ...siteConfig.extras.filter((item) => item.href !== "/teletext")].map((item) => (
            <Link key={item.href} href={item.href} className="uppercase outline-none hover:underline focus-visible:underline">
              {item.label}
            </Link>
          ))}
        </nav>
      </article>
    </div>
  );
}
