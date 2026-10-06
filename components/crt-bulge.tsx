"use client";

import { useEffect, useState } from "react";

/** How far the picture swells toward the viewer when the full lens is on. */
const pictureBulge = 0.05;
/** The raster on the glass bends harder, so the dome reads at a glance. */
const glassBulge = 0.16;

type Lens = { width: number; height: number; map: string };

/**
 * Paints a displacement map for a convex tube face: the middle is magnified,
 * the rim stays put. Red carries the horizontal pull, green the vertical.
 * Painted at screen resolution; a stretched map smears what it bends.
 */
function paintLensMap(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const image = context.createImageData(width, height);
  const aspect = height / width;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = (x / (width - 1)) * 2 - 1;
      const v = (y / (height - 1)) * 2 - 1;
      // Sample closer to the centre than we draw: magnifies the middle.
      const swell = Math.max(0, 1 - (u * u + v * v));
      const index = (y * width + x) * 4;
      image.data[index] = Math.round((0.5 - (u * swell) / 2) * 255);
      image.data[index + 1] = Math.round((0.5 - (v * swell * aspect) / 2) * 255);
      image.data[index + 2] = 128;
      image.data[index + 3] = 255;
    }
  }

  context.putImageData(image, 0, 0);
  return canvas.toDataURL();
}

function canCurve() {
  // The lens is drawn every frame; keep it to roomy, pointer-driven screens.
  return window.matchMedia("(min-width: 48rem) and (pointer: fine)").matches;
}

function LensFilter({ id, lens, bulge }: { id: string; lens: Lens; bulge: number }) {
  return (
    <filter
      id={id}
      x="0"
      y="0"
      width={lens.width}
      height={lens.height}
      filterUnits="userSpaceOnUse"
      primitiveUnits="userSpaceOnUse"
      colorInterpolationFilters="sRGB"
    >
      <feImage
        href={lens.map}
        x="0"
        y="0"
        width={lens.width}
        height={lens.height}
        preserveAspectRatio="none"
        result="lens"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="lens"
        scale={lens.width * bulge}
        xChannelSelector="R"
        yChannelSelector="G"
      />
    </filter>
  );
}

/**
 * The SVG lenses behind the curved tube. `#crt-glass` bends the raster on the
 * glass and is always on where it is cheap; `#crt-bulge` bends the picture
 * itself, which softens text, so it is the visitor's choice (Alt+B).
 */
export function useCrtBulge() {
  const [lens, setLens] = useState<Lens | null>(null);

  useEffect(() => {
    let frame = 0;

    function measure() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!canCurve()) {
          setLens(null);
          return;
        }
        const width = window.innerWidth;
        const height = window.innerHeight;
        const map = paintLensMap(width, height);
        setLens(map ? { width, height, map } : null);
      });
    }

    measure();
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
    };
  }, []);

  const filters = lens ? (
    <svg aria-hidden="true" width="0" height="0" className="absolute">
      <LensFilter id="crt-glass" lens={lens} bulge={glassBulge} />
      <LensFilter id="crt-bulge" lens={lens} bulge={pictureBulge} />
    </svg>
  ) : null;

  return { filters, available: lens !== null };
}
