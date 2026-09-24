import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Page 404</p>
      <h1 className="mt-5 font-serif text-5xl tracking-[-0.05em] sm:text-7xl">
        This page left no mark.
      </h1>
      <p className="mt-5 max-w-md font-serif text-lg/8 text-muted-foreground">
        The entry may have moved, remained a draft, or never belonged to this library.
      </p>
      <Link className={buttonVariants({ variant: "outline", className: "mt-8" })} href="/">
        Return to the library
      </Link>
    </div>
  );
}
