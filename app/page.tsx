import { RansomWord } from "@/components/ransom-word";
import { PickSoundButton } from "@/components/pick-sound-button";

export default function Home() {
  return (
    <main className="flex w-full flex-1 items-center px-4 py-8 min-[360px]:px-5 sm:px-10 sm:py-12 lg:px-16">
      <article className="mx-auto w-full max-w-3xl p-0 sm:p-11 lg:p-14">
        <header>
          <h1 className="sr-only">puma</h1>
          <RansomWord />
          <div className="mt-4 flex items-center gap-2">
            <p className="text-start text-base text-muted-foreground">
              /ˈpuː.mə/
            </p>
            <PickSoundButton />
          </div>
        </header>
      </article>
    </main>
  );
}
