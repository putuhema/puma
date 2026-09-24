import { ExternalLinkIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { ContentEntry } from "@/lib/content";

export function BookEntry({ entry }: { entry: ContentEntry }) {
  return (
    <div className="mt-8 flex flex-col gap-5">
      <Separator />
      <div className="flex flex-col justify-between gap-5 py-1 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Book details
          </p>
          <p className="font-serif text-lg">
            {entry.author} <span className="text-muted-foreground">· {entry.bookYear}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {entry.readingStatus && <Badge variant="secondary">{entry.readingStatus}</Badge>}
          {entry.externalUrl && (
            <a
              className={buttonVariants({ variant: "outline" })}
              href={entry.externalUrl}
              rel="noreferrer"
              target="_blank"
            >
              Publisher
              <ExternalLinkIcon data-icon="inline-end" />
            </a>
          )}
        </div>
      </div>
      <Separator />
    </div>
  );
}
