"use client";

/**
 * The glass in front of everything: scanlines, vignette, rounded tube
 * corners, faint snow, and a rolling VHS tracking band.
 * Purely decorative and never intercepts the pointer.
 */
export function CrtOverlay({ curvedGlass }: { curvedGlass: boolean }) {
  return (
    <div aria-hidden="true" data-crt-glass className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {/* Tracking band rolling down the picture. */}
      <div className="animate-tracking absolute inset-x-0 top-0 h-[14vh] bg-[linear-gradient(to_bottom,transparent,rgb(255_255_255/0.035)_40%,rgb(255_255_255/0.07)_50%,rgb(255_255_255/0.035)_60%,transparent)] mix-blend-screen">
        <div className="tv-static animate-snow absolute inset-x-0 top-[46%] h-1.5 opacity-40" />
      </div>

      {/* Snow, then the raster: scanlines over a faint aperture grille. On
          roomy screens the raster is drawn through the lens, so it bows out
          from the middle like the face of a convex tube. */}
      <div className="tv-static animate-snow absolute inset-0 opacity-[0.045]" />
      <div
        className="animate-flicker absolute inset-0"
        style={curvedGlass ? { filter: "url(#crt-glass)" } : undefined}
      >
        <div className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,rgb(0_0_0/0.3)_0_1px,transparent_1px_3px)]" />
        <div className="absolute inset-0 bg-[repeating-linear-gradient(to_right,rgb(255_40_60/0.035)_0_1px,rgb(40_255_120/0.035)_1px_2px,rgb(40_120_255/0.035)_2px_3px)]" />
        <div className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent_0_47px,rgb(255_255_255/0.025)_47px_48px),repeating-linear-gradient(to_right,transparent_0_47px,rgb(255_255_255/0.025)_47px_48px)]" />
      </div>

      {/* Vignette, a glare across the domed glass, and the tube's rounded rim. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgb(0_0_0/0.6)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_32%_18%,rgb(255_255_255/0.07),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(255_255_255/0.025),transparent_60%)]" />
      <div className="absolute inset-0 rounded-[1.75rem] shadow-[0_0_0_3rem_#000,inset_0_0_2.5rem_rgb(0_0_0/0.8)] max-sm:rounded-[1rem]" />

    </div>
  );
}
