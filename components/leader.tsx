import type { ReactNode } from "react";

/** A dotted-leader row from a case file: LABEL ........ value */
export function Leader({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline gap-2 text-sm leading-7">
      <dt className="type-label shrink-0 text-muted-foreground">{label}</dt>
      <span aria-hidden="true" className="min-w-4 flex-1 translate-y-[-0.3rem] border-b border-dotted border-muted-foreground" />
      <dd className="min-w-0 text-right">{children}</dd>
    </div>
  );
}
