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
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-lg font-semibold text-gray-950">BlackDog Talent Hub</div>
          <div className="text-sm text-gray-500">Global native talent coverage</div>
        </div>

        <nav className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
          {navItems.map((item) => (
            <span
              key={item}
              className={
                item === "Talent Map"
                  ? "rounded-md border border-gray-900 bg-gray-900 px-3 py-2 font-medium text-white"
                  : "rounded-md px-3 py-2 hover:bg-gray-100"
              }
            >
              {item}
            </span>
          ))}
          <span className="rounded-md border border-gray-300 px-3 py-2 font-medium text-gray-900">
            Login
          </span>
        </nav>
      </div>
    </header>
  );
}
