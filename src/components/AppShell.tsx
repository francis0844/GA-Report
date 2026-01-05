"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { AlertTriangle, FileText, Layers } from "lucide-react";

type Props = {
  children: React.ReactNode;
  missingEnv?: string[];
};

const navLinks = [
  { href: "/generate", label: "Generate Report", icon: Layers },
  { href: "/reports", label: "Reports Log", icon: FileText },
];

export function AppShell({ children, missingEnv = [] }: Props) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <aside className="w-64 border-r border-slate-800 bg-slate-900/70 backdrop-blur">
        <div className="px-5 py-5 border-b border-slate-800">
          <h1 className="text-lg font-semibold text-white">GA Monthly Report Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">
            Foundation setup · Vercel + Next.js App Router
          </p>
        </div>
        <nav className="px-3 py-4 space-y-1">
          {navLinks.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition hover:bg-slate-800/80",
                  active ? "bg-slate-800 text-white" : "text-slate-300"
                )}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        {missingEnv.length ? (
          <div className="m-3 rounded-xl border border-amber-500/60 bg-amber-500/10 px-3 py-2 text-xs text-amber-100 flex items-start gap-2">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <span>Env missing: {missingEnv.join(", ")}</span>
          </div>
        ) : null}
      </aside>
      <main className="flex-1">
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Module 1</p>
            <h2 className="text-xl font-semibold text-white">Project Setup & App Foundation</h2>
          </div>
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 px-3 py-2 text-xs text-slate-300">
            Tailwind • shadcn/ui • Recharts installed
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
