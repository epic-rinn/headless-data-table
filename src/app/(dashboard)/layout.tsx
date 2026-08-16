import type { ReactNode } from "react";
import { Sidebar } from "@/components/shell/Sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
