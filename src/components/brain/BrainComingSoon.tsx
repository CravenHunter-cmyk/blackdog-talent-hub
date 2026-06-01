import Link from "next/link";

export function BrainComingSoon() {
  return (
    <main
      className="relative min-h-[calc(100vh-72px)] overflow-hidden bg-[#111827] px-4 py-12 text-[#111827] sm:px-6 lg:px-8"
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgba(17, 24, 39, 0.74), rgba(31, 92, 67, 0.56) 48%, rgba(154, 106, 53, 0.44)), url('/images/blackdog-access-bg.jpeg')",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.18),transparent_28%),radial-gradient(circle_at_82%_14%,rgba(245,197,129,0.18),transparent_26%),linear-gradient(180deg,rgba(17,24,39,0.10),rgba(17,24,39,0.38))] backdrop-blur-[1px]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#111827]/60 to-transparent" />

      <section className="relative mx-auto flex min-h-[calc(100vh-160px)] max-w-6xl items-center">
        <div className="w-full max-w-[720px] rounded-[34px] border border-white/30 bg-[#fffdf8]/90 px-8 py-10 shadow-[0_32px_90px_rgba(0,0,0,0.38)] backdrop-blur-xl sm:px-12 sm:py-12">
          <div className="inline-flex rounded-full border border-[#d7cec0] bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#9a6a35]">
            Protected AI workspace preview
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-tight md:text-5xl">BlackDog Brain</h1>
          <p className="mt-4 text-2xl font-black text-[#1f5c43]">Coming Soon</p>
          <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-[#40372f]">
            A protected AI workspace is being prepared.
          </p>
          <p className="mt-4 max-w-xl rounded-2xl border border-[#eadfcd] bg-white/70 px-4 py-3 text-sm font-semibold leading-6 text-[#6f6256]">
            The full Brain workspace remains available only in local development until the production release is explicitly enabled.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/" className="inline-flex min-w-40 items-center justify-center rounded-md border border-[#1f5c43] bg-[#1f5c43] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(31,92,67,0.18)]">
              Back to Talent Map
            </Link>
            <Link href="/login" className="inline-flex min-w-28 items-center justify-center rounded-md border border-[#d7cec0] bg-white px-5 py-2.5 text-sm font-semibold text-[#4b5563]">
              Login
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
