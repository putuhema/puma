import { TransmissionDesk } from "@/components/transmission-desk";
import { getArchive } from "@/lib/content";

export default async function Home({ searchParams }: PageProps<"/">) {
  const { ask } = await searchParams;

  return (
    <TransmissionDesk
      archive={getArchive()}
      initialAsk={typeof ask === "string" ? ask.slice(0, 200) : undefined}
    />
  );
}
