import type { ReactNode } from "react";
import { IllustratedBottomNavigation } from "@/components/illustrated-bottom-navigation";
import { SoundControl, SoundProvider } from "@/components/sound-control";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <SoundProvider>
      <div className="flex min-h-dvh flex-col pb-28">
        {children}
        <SoundControl />
        <IllustratedBottomNavigation />
      </div>
    </SoundProvider>
  );
}
