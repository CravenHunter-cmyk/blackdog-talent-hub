import Link from "next/link";

export function BrainComingSoon() {
  return (
    <main
      className="relative min-h-[calc(100vh-72px)] overflow-hidden bg-[#030712] px-5 py-10 sm:px-8 lg:px-12"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(1, 5, 12, 0.78) 0%, rgba(3, 10, 18, 0.58) 38%, rgba(3, 8, 14, 0.20) 70%, rgba(3, 8, 14, 0.10) 100%), linear-gradient(180deg, rgba(1, 5, 12, 0.06) 0%, rgba(1, 5, 12, 0.42) 100%), url('/images/blackdog-brain-coming-soon.png')",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_58%,rgba(92,132,170,0.08),transparent_31%),radial-gradient(circle_at_82%_18%,rgba(220,232,242,0.03),transparent_35%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#01040a]/55 to-transparent" />

      <section className="relative mx-auto flex min-h-[calc(100vh-152px)] max-w-7xl items-end pb-[clamp(78px,16vh,148px)] pt-[clamp(96px,14vh,150px)]">
        <div className="max-w-[560px] pb-[clamp(10px,3vh,34px)] sm:ml-[clamp(8px,4vw,74px)]">
          <h1 className="max-w-2xl text-[clamp(2.6rem,5vw,4.55rem)] font-semibold leading-[0.95] tracking-[-0.015em] text-[rgba(255,255,255,0.94)] drop-shadow-[0_3px_15px_rgba(0,0,0,0.48)]">
            Coming Soon
          </h1>
          <p className="mt-5 max-w-xl text-[clamp(1.05rem,1.7vw,1.45rem)] font-medium leading-7 text-[#eef3f8] drop-shadow-[0_2px_10px_rgba(0,0,0,0.40)]">
            Personalized AI tools, shaped by individual thinking profiles.
          </p>
          <p className="mt-4 max-w-[540px] text-sm font-normal leading-6 text-[#cbd5df] drop-shadow-[0_2px_9px_rgba(0,0,0,0.38)] sm:text-base sm:leading-7">
            BlackDog creates tailored AI workspaces for clients, teams, and individuals — turning unique needs, context, and habits into dedicated AI apps for work, communication, decision-making, and delivery.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href="/" className="inline-flex min-w-36 items-center justify-center rounded-md border border-[#1f6b56] bg-[#0f4a3e] px-4 py-2 text-xs font-semibold text-[#f7fbf8] shadow-[0_12px_24px_rgba(0,0,0,0.28)] transition hover:bg-[#155a4a]">
              Back to Talent Map
            </Link>
            <Link href="/login" className="inline-flex min-w-20 items-center justify-center rounded-md border border-white/30 bg-[#050b12]/62 px-4 py-2 text-xs font-semibold text-[#e5edf5] shadow-[0_12px_24px_rgba(0,0,0,0.22)] backdrop-blur-sm transition hover:bg-[#0a1420]/72">
              Login
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
