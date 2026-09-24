import type { ReactNode } from "react";
import { LiquidGlassNavigation } from "@/components/liquid-glass-navigation";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col pb-28">
      {children}
      <LiquidGlassNavigation />
    </div>
  );
}
