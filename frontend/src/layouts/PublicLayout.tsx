import type { ReactNode } from "react";
import PublicPageHeader from "../components/PublicPageHeader";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f6fa] text-slate-900">
      <PublicPageHeader />
      <main className="pt-16 p-8">{children}</main>
    </div>
  );
}
