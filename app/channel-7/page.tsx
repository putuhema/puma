import type { Metadata } from "next";
import Link from "next/link";
import { SecretArrival } from "@/components/secret-arrival";
import { TubeScreen } from "@/components/tube-screen";

export const metadata: Metadata = {
  title: "Channel 07",
  description: "You weren't supposed to find this.",
  robots: { index: false, follow: false },
};

const outtakes = [
  "Take 1. Mr. P introduces himself to an empty room. The room does not respond. He bows anyway.",
  "Take 4. Mr. P attempts the word “portfolio”. Says “port-foil-io”. Insists that's the galactic pronunciation.",
  "Take 9. A moth lands on the camera. Mr. P interviews it for twenty minutes. The moth has no comment.",
  "Take 12. Mr. P is asked to look natural. Floats upside down. Claims that's natural where he's from.",
  "Take 15. The helmet fogs up mid-sentence. The rest of the take is just breathing and the word “moment”.",
];

/**
 * Channel 07: off the dial, reached by the Konami code or by tuning to the
 * transmitter's frequency. Mr. P's personnel file and his outtakes.
 */
export default function SecretChannel() {
  return (
    <TubeScreen channel="07" label="Off the dial" glass="blue">
      <SecretArrival />
      <div className="type-osd flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-6 sm:px-10 sm:py-8">
        <p className="self-start bg-osd-foreground px-2 py-0.5 text-lg leading-7 text-osd">CH 07 · You found it</p>
        <h1 className="text-2xl leading-8 sm:text-3xl">Personnel file: Mr. P</h1>
        <dl className="grid max-w-xl grid-cols-[8rem_1fr] gap-x-4 gap-y-1 text-sm leading-6">
          <dt className="opacity-70">Species</dt>
          <dd>Small, orange, antennaed</dd>
          <dt className="opacity-70">Position</dt>
          <dd>Host, Field Station P-4 (unpaid)</dd>
          <dt className="opacity-70">Hired</dt>
          <dd>Never formally. Just stayed.</dd>
          <dt className="opacity-70">Skills</dt>
          <dd>Floating. Typing very fast. Small talk in four galaxies.</dd>
          <dt className="opacity-70">Weakness</dt>
          <dd>Stairs. Also, being asked about stairs.</dd>
        </dl>
        <section>
          <h2 className="text-lg">Outtakes reel</h2>
          <ol className="mt-2 flex max-w-2xl flex-col gap-2 font-tube text-xl leading-6 normal-case">
            {outtakes.map((take) => (
              <li key={take}>{take}</li>
            ))}
          </ol>
        </section>
        <p className="mt-auto text-xs opacity-80">
          Tell no one. Or tell everyone; it&rsquo;s a website.{" "}
          <Link href="/passport" className="underline outline-none focus-visible:bg-osd-foreground focus-visible:text-osd">
            Check your passport
          </Link>
          .
        </p>
      </div>
    </TubeScreen>
  );
}
