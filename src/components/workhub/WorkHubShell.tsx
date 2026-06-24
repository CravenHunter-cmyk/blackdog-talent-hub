import type { ReactNode } from "react";

type WorkHubShellProps = {
  children: ReactNode;
};

export function WorkHubShell({ children }: WorkHubShellProps) {
  return (
    <div className="min-h-screen bg-transparent pb-24 text-[#111827]">
      <section className="page-shell pt-8">
        <header className="rounded-2xl border border-[#e2d8c8] bg-[#fbfaf6]/92 p-6 shadow-[0_18px_44px_rgba(31,41,51,0.08)] backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#1f5c43]">WorkHub</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#111827] md:text-4xl">
            BlackDog WorkHub
          </h1>
          <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-[#64748b]">
            One workspace for talent resources, project management, and sourcing operations.
          </p>
        </header>
      </section>
      <div className="mt-6">
        {children}
      </div>
    </div>
  );
}
