import type { Metadata } from "next";
import { OnAir } from "@/components/convex-client-provider";
import { Guestbook } from "@/components/guestbook";
import { TubeScreen } from "@/components/tube-screen";
import { siteConfig } from "@/lib/site";

const description = "The station guestbook: one line from every visitor, kept for good.";

export const metadata: Metadata = {
  title: "Guestbook",
  description,
  alternates: { canonical: "/guestbook" },
  openGraph: { title: `Guestbook — ${siteConfig.name}`, description, url: "/guestbook" },
};

/** Off the dial: the guestbook, on amber glass. */
export default function GuestbookPage() {
  return (
    <TubeScreen channel="GB" label="Guestbook" glass="amber">
      <OnAir
        offline={
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center font-tube text-xl uppercase">
            <p className="bg-signal px-2 text-2xl text-amber-glass [text-shadow:none]">Guestbook</p>
            <p>Off the air: no Convex deployment is configured.</p>
          </div>
        }
      >
        <Guestbook />
      </OnAir>
    </TubeScreen>
  );
}
