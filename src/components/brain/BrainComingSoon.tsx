import Image from "next/image";

export function BrainComingSoon() {
  return (
    <main className="min-h-[calc(100vh-72px)] bg-[#f8f5ec] px-4 py-10 text-[#111827] sm:px-6 lg:px-8">
      <section className="mx-auto flex max-w-6xl flex-col items-center gap-8">
        <div className="text-center">
          <div className="inline-flex rounded-full border border-[#d7cec0] bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#9a6a35]">
            BlackDog Brain
          </div>
          <h1 className="mt-5 text-4xl font-black tracking-tight md:text-5xl">BlackDog Brain</h1>
          <p className="mt-3 text-2xl font-black text-[#1f5c43]">Coming Soon</p>
          <p className="mt-3 text-sm font-semibold text-[#6f6256]">
            This workspace is currently under internal development.
          </p>
        </div>

        <div className="w-full overflow-hidden rounded-[28px] border border-[#d0c3b3] bg-[#fffdf8] p-3 shadow-[0_24px_70px_rgba(31,41,51,0.14)] sm:p-5">
          <div className="relative mx-auto aspect-[16/9] w-full max-w-[1000px] overflow-hidden rounded-[22px] bg-[#efe7da]">
            <Image
              src="/images/blackdog-brain-coming-soon.png"
              alt="BlackDog Brain coming soon"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 1000px"
              className="object-contain"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
