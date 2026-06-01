import Link from "next/link";

export function BrainComingSoon() {
  return (
    <main
      className="relative min-h-[calc(100vh-72px)] overflow-hidden bg-[#111827] px-5 py-10 text-white sm:px-8 lg:px-12"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(9, 18, 16, 0.78) 0%, rgba(15, 31, 27, 0.56) 34%, rgba(17, 24, 39, 0.24) 68%, rgba(17, 24, 39, 0.16) 100%), linear-gradient(180deg, rgba(17, 24, 39, 0.18) 0%, rgba(17, 24, 39, 0.42) 100%), url('/images/blackdog-brain-coming-soon.png')",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_17%_28%,rgba(245,197,129,0.16),transparent_25%),radial-gradient(circle_at_72%_18%,rgba(31,92,67,0.12),transparent_32%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#050807]/70 to-transparent" />

      <section className="relative mx-auto flex min-h-[calc(100vh-152px)] max-w-7xl items-end pb-[clamp(42px,8vh,96px)] pt-[clamp(92px,13vh,150px)]">
        <div className="max-w-[620px]">
          <div className="inline-flex rounded-full border border-white/28 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em] text-[#f5d29d] shadow-[0_10px_26px_rgba(0,0,0,0.22)] backdrop-blur-sm">
            BlackDog Brain
          </div>
          <h1 className="mt-6 max-w-2xl text-5xl font-black tracking-tight text-white drop-shadow-[0_5px_18px_rgba(0,0,0,0.55)] sm:text-6xl lg:text-7xl">
            Coming Soon
          </h1>
          <p className="mt-5 max-w-xl text-lg font-bold leading-7 text-[#f7f1e7] drop-shadow-[0_3px_10px_rgba(0,0,0,0.50)] sm:text-xl">
            A protected AI workspace is being prepared.
          </p>
          <p className="mt-4 max-w-xl text-sm font-semibold leading-6 text-[#e9ded0] drop-shadow-[0_3px_10px_rgba(0,0,0,0.45)] sm:text-base">
            Task reasoning, project intelligence, and AI data workflows are being connected behind the scenes.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/" className="inline-flex min-w-36 items-center justify-center rounded-md border border-[#1f5c43] bg-[#1f5c43] px-4 py-2.5 text-sm font-bold text-white shadow-[0_14px_28px_rgba(0,0,0,0.26)] transition hover:bg-[#184935]">
              Back to Talent Map
            </Link>
            <Link href="/login" className="inline-flex min-w-24 items-center justify-center rounded-md border border-white/45 bg-white/10 px-4 py-2.5 text-sm font-bold text-white shadow-[0_14px_28px_rgba(0,0,0,0.18)] backdrop-blur-sm transition hover:bg-white/18">
              Login
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
