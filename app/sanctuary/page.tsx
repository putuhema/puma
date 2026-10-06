import type { Metadata } from "next";
import { OnAir } from "@/components/convex-client-provider";
import { Sanctuary } from "@/components/sanctuary";
import { TubeScreen } from "@/components/tube-screen";
import { siteConfig } from "@/lib/site";

const description = "A quiet room where visitors talk to each other in real time.";

export const metadata: Metadata = {
  title: "Sanctuary",
  description,
  alternates: { canonical: "/sanctuary" },
  openGraph: { title: `Sanctuary — ${siteConfig.name}`, description, url: "/sanctuary" },
};

/** Channel 03: the Sanctuary, a live room on blue VHS glass. */
export default function SanctuaryPage() {
  return (
    <TubeScreen channel="03" label="Sanctuary" glass="blue" fit>
      <OnAir
        offline={
          <div className="type-osd flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
            <p className="bg-osd-foreground px-2 text-lg text-osd">Sanctuary</p>
            <p className="text-sm">Off the air: no Convex deployment is configured.</p>
          </div>
        }
      >
        <Sanctuary />
      </OnAir>
    </TubeScreen>
  );
}
