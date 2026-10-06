import { TransmissionDesk } from "@/components/transmission-desk";
import { getArchive } from "@/lib/content";
import { profile, profileLinks, siteConfig } from "@/lib/site";

/** Who the site belongs to, for search engines: a schema.org Person. */
function personData() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: siteConfig.fullname,
    alternateName: siteConfig.author,
    url: siteConfig.url,
    jobTitle: profile.role,
    description: profile.summary,
    ...(profile.location ? { homeLocation: profile.location } : {}),
    ...(profile.skills.length ? { knowsAbout: profile.skills } : {}),
    sameAs: profileLinks.filter((link) => link.href.startsWith("http")).map((link) => link.href),
  };
}

/** The desk is static; a question in the link (?ask=…) is read in the browser. */
export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        // Escaped so nothing in the profile can close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personData()).replace(/</g, "\\u003c") }}
      />
      <TransmissionDesk archive={getArchive()} />
    </>
  );
}
