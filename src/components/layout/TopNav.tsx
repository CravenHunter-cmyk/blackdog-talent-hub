const navItems = [
  "Talent Map",
  "Candidates",
  "Screening",
  "Intake Forms",
  "AI Assistant",
  "Settings",
];

export function TopNav() {
  return (
    <header className="border-b border-[#d2c8ba] bg-[#f7f6f0]/92 shadow-[0_6px_22px_rgba(31,41,51,0.05)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-lg font-bold tracking-tight text-[#1e1712]">BlackDog Talent Hub</div>
          <div className="text-sm font-medium text-[#6b6258]">Global native talent coverage</div>
        </div>

        <nav className="flex flex-wrap items-center gap-2 text-sm text-[#6b6258]">
          {navItems.map((item) => (
            <span
              key={item}
              className={
                item === "Talent Map"
                  ? "rounded-md border border-[#214d3a] bg-[#214d3a] px-3 py-2 font-semibold text-white shadow-[0_8px_18px_rgba(33,77,58,0.18)]"
                  : "rounded-md px-3 py-2 font-medium hover:bg-[#e4ded3] hover:text-[#1e1712]"
              }
            >
              {item}
            </span>
          ))}
          <span className="rounded-md border border-[#1f2933] bg-[#1f2933] px-3 py-2 font-semibold text-white shadow-[0_8px_18px_rgba(31,41,51,0.18)]">
            Login
          </span>
        </nav>
      </div>
    </header>
  );
}
