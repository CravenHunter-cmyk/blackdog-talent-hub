import Link from "next/link";

export function BrainComingSoon() {
  return (
    <main
      className="relative min-h-[calc(100vh-72px)] overflow-hidden bg-transparent px-5 py-10 sm:px-8 lg:px-12"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(0, 7, 14, 0.84) 0%, rgba(0, 12, 20, 0.66) 38%, rgba(0, 10, 18, 0.28) 70%, rgba(0, 8, 15, 0.12) 100%), linear-gradient(180deg, rgba(0, 7, 14, 0.10) 0%, rgba(0, 8, 15, 0.48) 100%)",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_21%_60%,rgba(88,120,150,0.07),transparent_31%),linear-gradient(90deg,rgba(0,12,18,0.18),transparent_56%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#000711]/60 to-transparent" />

      <section className="relative mx-auto flex min-h-[calc(100vh-152px)] max-w-7xl items-end pb-[clamp(56px,10vh,104px)] pt-[clamp(72px,10vh,120px)]">
        <div className="max-w-[620px] pb-[clamp(8px,2.5vh,24px)] sm:ml-[clamp(4px,2.5vw,40px)]">
          <h1 className="max-w-2xl text-[clamp(2.35rem,4vw,3.95rem)] font-semibold leading-[0.95] tracking-[-0.015em] text-[#f5f7fa] drop-shadow-[0_3px_15px_rgba(0,0,0,0.50)]">
            Coming Soon
          </h1>
          <p className="mt-4 max-w-xl text-[clamp(0.98rem,1.2vw,1.08rem)] font-medium leading-6 text-[#e8eef5] drop-shadow-[0_2px_10px_rgba(0,0,0,0.42)] sm:leading-7">
            Personalized AI tools, shaped by individual thinking profiles.
          </p>
          <p className="mt-3 max-w-[520px] text-sm font-normal leading-6 text-[#c8d2dd] drop-shadow-[0_2px_9px_rgba(0,0,0,0.42)] sm:text-[0.98rem] sm:leading-7">
            BlackDog creates tailored AI workspaces for clients, teams, and individuals — turning unique needs, context, and habits into dedicated AI apps for work, communication, decision-making, and delivery.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href="/" className="inline-flex min-w-36 items-center justify-center rounded-md border border-[#17634f] bg-[#083f35] px-4 py-2 text-xs font-semibold text-[#f4faf7] shadow-[0_12px_24px_rgba(0,0,0,0.30)] transition hover:bg-[#0c5244]">
              Back to Talent Map
            </Link>
            <Link href="/login" className="inline-flex min-w-20 items-center justify-center rounded-md border border-[#d8e4ef]/30 bg-[#030912]/68 px-4 py-2 text-xs font-semibold text-[#e5edf5] shadow-[0_12px_24px_rgba(0,0,0,0.24)] backdrop-blur-sm transition hover:bg-[#07131f]/78">
              Login
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
