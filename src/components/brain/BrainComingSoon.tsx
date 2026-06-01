export function BrainComingSoon() {
  return (
    <main
      className="relative min-h-[calc(100vh-72px)] overflow-hidden bg-[#16110d] px-5 py-10 sm:px-8 lg:px-12"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(18, 13, 10, 0.46) 0%, rgba(31, 22, 16, 0.28) 38%, rgba(22, 17, 13, 0.08) 70%, rgba(22, 17, 13, 0.04) 100%), linear-gradient(180deg, rgba(20, 14, 10, 0.08) 0%, rgba(18, 13, 10, 0.20) 100%), url('/images/blackdog-brain-coming-soon.png')",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_21%_58%,rgba(221,178,113,0.12),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(255,244,218,0.05),transparent_35%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#120d0a]/28 to-transparent" />

      <section className="relative mx-auto flex min-h-[calc(100vh-152px)] max-w-7xl items-end pb-[clamp(78px,16vh,148px)] pt-[clamp(96px,14vh,150px)]">
        <div className="max-w-[560px] pb-[clamp(10px,3vh,34px)] sm:ml-[clamp(8px,4vw,74px)]">
          <h1 className="max-w-2xl text-[clamp(2.6rem,5vw,4.55rem)] font-semibold leading-[0.95] tracking-[-0.015em] text-[#ead6af] drop-shadow-[0_2px_10px_rgba(0,0,0,0.30)]">
            Coming Soon
          </h1>
          <p className="mt-5 max-w-xl text-[clamp(1.05rem,1.7vw,1.45rem)] font-medium leading-7 text-[#f2e6d1] drop-shadow-[0_2px_8px_rgba(0,0,0,0.26)]">
            Personalized AI tools, shaped by individual thinking profiles.
          </p>
          <p className="mt-4 max-w-[540px] text-sm font-normal leading-6 text-[#dfcfb6] drop-shadow-[0_2px_7px_rgba(0,0,0,0.24)] sm:text-base sm:leading-7">
            BlackDog creates tailored AI workspaces for clients, teams, and individuals — turning unique needs, context, and habits into dedicated AI apps for work, communication, decision-making, and delivery.
          </p>
        </div>
      </section>
    </main>
  );
}
