import type { ReactNode } from "react";
import { Console } from "@/components/console";
import { SoundProvider } from "@/components/sound-control";
import { StationProvider } from "@/components/station-context";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <SoundProvider>
      <StationProvider>
        <Console>{children}</Console>
      </StationProvider>
    </SoundProvider>
  );
}
