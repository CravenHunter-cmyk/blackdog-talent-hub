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

        <div className="flex flex-wrap items-center gap-3">
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

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <span>UI Language</span>
            <select
              defaultValue="English"
              className="rounded-md border border-gray-300 bg-white px-2 py-2 text-sm text-gray-950 outline-none focus:border-gray-900"
              aria-label="UI Language"
            >
              <option>English</option>
              <option>中文</option>
            </select>
          </label>
        </div>
      </div>
    </header>
  );
}
