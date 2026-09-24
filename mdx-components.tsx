import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const components = {
  h2: (props) => (
    <h2
      className="mt-14 scroll-mt-24 font-serif text-3xl leading-tight tracking-[-0.025em] text-foreground first:mt-0"
      {...props}
    />
  ),
  h3: (props) => (
    <h3
      className="mt-10 scroll-mt-24 font-sans text-base font-semibold tracking-[-0.01em] text-foreground"
      {...props}
    />
  ),
  p: (props) => (
    <p
      className="mt-5 font-serif text-[1.125rem] leading-8 text-foreground/88 first:mt-0"
      {...props}
    />
  ),
  a: ({ href = "", ...props }) => {
    const isExternal = href.startsWith("http");
    return (
      <Link
        className="font-medium text-primary underline decoration-primary/30 underline-offset-4 transition-colors duration-150 hover:decoration-primary motion-reduce:transition-none"
        href={href}
        rel={isExternal ? "noreferrer" : undefined}
        target={isExternal ? "_blank" : undefined}
        {...props}
      />
    );
  },
  ul: (props) => (
    <ul
      className="mt-5 flex list-disc flex-col gap-2 pl-5 font-serif text-[1.125rem] leading-8 marker:text-primary"
      {...props}
    />
  ),
  ol: (props) => (
    <ol
      className="mt-5 flex list-decimal flex-col gap-2 pl-5 font-serif text-[1.125rem] leading-8 marker:text-primary"
      {...props}
    />
  ),
  blockquote: (props) => (
    <blockquote
      className="my-8 border-l-2 border-primary/50 pl-5 font-serif text-xl/8 italic text-muted-foreground"
      {...props}
    />
  ),
  strong: (props) => <strong className="font-semibold text-foreground" {...props} />,
  code: (props) => (
    <code
      className="rounded-sm bg-muted px-1.5 py-0.5 font-sans text-[0.85em] text-foreground"
      {...props}
    />
  ),
  pre: (props) => (
    <pre
      className="my-8 overflow-x-auto rounded-md border bg-card p-5 text-sm leading-6 [&_code]:bg-transparent [&_code]:p-0"
      {...props}
    />
  ),
  hr: () => <Separator className="my-12" />,
} satisfies MDXComponents;

export function useMDXComponents(): MDXComponents {
  return components;
}
