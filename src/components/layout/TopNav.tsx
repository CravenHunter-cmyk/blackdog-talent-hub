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
    <header className="border-b border-[#e2d8c8] bg-[#fbfaf6]/96 shadow-[0_8px_20px_rgba(31,41,51,0.05)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-lg font-bold tracking-tight text-[#111827]">BlackDog Talent Hub</div>
          <div className="text-sm font-medium text-[#64748b]">Global native talent coverage</div>
        </div>

        <nav className="flex flex-wrap items-center gap-2 text-sm text-[#6f6256]">
          {navItems.map((item) => (
            <span
              key={item}
              className={
                item === "Talent Map"
                  ? "rounded-md border border-[#1f5c43] bg-[#1f5c43] px-3 py-2 font-semibold text-white shadow-[0_8px_18px_rgba(31,92,67,0.18)]"
                  : "rounded-md px-3 py-2 font-medium hover:bg-[#f4efe2] hover:text-[#111827]"
              }
            >
              {item}
            </span>
          ))}
          <span className="rounded-md border border-[#1f5c43] bg-[#1f5c43] px-3 py-2 font-semibold text-white shadow-[0_8px_18px_rgba(31,92,67,0.18)]">
            Login
          </span>
        </nav>
      </div>
    </header>
  );
}
