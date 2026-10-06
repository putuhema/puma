import type { Metadata } from "next";
import { StarCatcher } from "@/components/star-catcher";
import { TubeScreen } from "@/components/tube-screen";
import { siteConfig } from "@/lib/site";

const description = "Star Catcher, full screen: fly Mr. P's saucer, catch the stars, dodge the rocks, and get on the board.";

export const metadata: Metadata = {
  title: "Arcade",
  description,
  alternates: { canonical: "/play" },
  openGraph: { title: `Arcade — ${siteConfig.name}`, description, url: "/play" },
};

/** Off the dial: the arcade, Star Catcher on the whole tube. */
export default function PlayPage() {
  return (
    <TubeScreen channel="AR" label="Arcade" glass="black" fit>
      <h1 className="sr-only">Star Catcher</h1>
      <StarCatcher autoFocus />
    </TubeScreen>
  );
}
