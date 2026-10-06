import type { ReactNode } from "react";
import { Console } from "@/components/console";
import { SoundProvider } from "@/components/sound-control";
import { StationProvider } from "@/components/station-context";
import type { Archive } from "@/lib/transmission";

export function SiteShell({ archive, children }: { archive: Archive; children: ReactNode }) {
  return (
    <SoundProvider>
      <StationProvider>
        <Console archive={archive}>{children}</Console>
      </StationProvider>
    </SoundProvider>
  );
}
