import type { ReactNode } from "react";
import { Console } from "@/components/console";
import { ConvexClientProvider, OnAir } from "@/components/convex-client-provider";
import { Listener } from "@/components/listener";
import { PreferencesProvider } from "@/components/set-preferences";
import { SoundProvider } from "@/components/sound-control";
import { StationProvider } from "@/components/station-context";
import type { Archive } from "@/lib/transmission";

export function SiteShell({ archive, children }: { archive: Archive; children: ReactNode }) {
  return (
    <ConvexClientProvider>
      <PreferencesProvider>
        <SoundProvider>
          <StationProvider>
            <OnAir>
              <Listener />
            </OnAir>
            <Console archive={archive}>{children}</Console>
          </StationProvider>
        </SoundProvider>
      </PreferencesProvider>
    </ConvexClientProvider>
  );
}
