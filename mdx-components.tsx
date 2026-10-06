import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const components = {
  h2: (props) => (
    <h2
      className="mt-12 scroll-mt-24 border-t border-rule pt-4 font-osd text-2xl leading-8 text-foreground uppercase first:mt-0"
      {...props}
    />
  ),
  h3: (props) => (
    <h3
      className="type-label mt-10 scroll-mt-24 font-semibold text-foreground"
      {...props}
    />
  ),
  p: (props) => (
    <p
      className="mt-5 text-base/7 text-foreground first:mt-0"
      {...props}
    />
  ),
  a: ({ href = "", ...props }) => {
    const isExternal = href.startsWith("http");
    return (
      <Link
        className="text-primary underline decoration-1 underline-offset-4 transition-[text-decoration-thickness] duration-150 hover:decoration-2 motion-reduce:transition-none"
        href={href}
        rel={isExternal ? "noreferrer" : undefined}
        target={isExternal ? "_blank" : undefined}
        {...props}
      />
    );
  },
  ul: (props) => (
    <ul
      className="mt-5 flex list-[square] flex-col gap-2 pl-5 text-base/7 marker:text-primary"
      {...props}
    />
  ),
  ol: (props) => (
    <ol
      className="mt-5 flex list-decimal flex-col gap-2 pl-5 text-base/7 marker:text-primary"
      {...props}
    />
  ),
  blockquote: (props) => (
    <blockquote
      className="my-8 text-lg/8 text-foreground sm:text-[1.1875rem]/[2rem] [&_p]:inline [&_p]:bg-sunken [&_p]:box-decoration-clone [&_p]:px-1 [&_p]:text-inherit"
      {...props}
    />
  ),
  strong: (props) => <strong className="font-semibold text-foreground" {...props} />,
  code: (props) => (
    <code
      className="bg-sunken px-1.5 py-0.5 text-[0.9em] text-foreground"
      {...props}
    />
  ),
  pre: (props) => (
    <pre
      className="my-8 overflow-x-auto border bg-surface p-5 text-sm leading-6 [&_code]:bg-transparent [&_code]:p-0"
      {...props}
    />
  ),
  hr: () => <Separator className="my-12" />,
} satisfies MDXComponents;

export function useMDXComponents(): MDXComponents {
  return components;
}
