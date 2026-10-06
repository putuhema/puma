import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** The ruled, typed header that files every panel: "RECENTLY FILED:" */
export function PanelLabel({
  className,
  ...props
}: ComponentProps<"h2">) {
  return (
    <h2
      className={cn(
        "type-label flex items-center justify-between gap-4 border-b px-5 py-4 text-foreground sm:px-6",
        className,
      )}
      {...props}
    />
  );
}

/** A bordered /command link with a trailing index number. */
export function LinkTile({
  children,
  className,
  index,
  ...props
}: ComponentProps<"a"> & { index: number; children: ReactNode }) {
  return (
    <a
      className={cn(
        "group flex min-h-12 items-center justify-between gap-4 border px-4 text-foreground outline-none transition-colors duration-150 hover:border-primary hover:bg-primary hover:text-primary-foreground focus-visible:border-primary focus-visible:bg-primary focus-visible:text-primary-foreground active:opacity-85 motion-reduce:transition-none",
        className,
      )}
      {...props}
    >
      <span className="type-label">/{children}</span>
      <span className="type-label text-muted-foreground transition-colors duration-150 group-hover:text-primary-foreground group-focus-visible:text-primary-foreground motion-reduce:transition-none">
        {String(index).padStart(2, "0")}
      </span>
    </a>
  );
}
