import { siteConfig } from "@/lib/site";

/** A page's name on the station, for "someone's on Notes". */
export function placeName(path: string) {
  const named = [...siteConfig.navigation, ...siteConfig.extras].find((item) => item.href === path);
  if (named) return named.label;
  if (path.startsWith("/notes/")) return "a note";
  if (path.startsWith("/projects/")) return "a project";
  return "somewhere quiet";
}
