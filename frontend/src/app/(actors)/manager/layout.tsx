import type { ReactNode } from "react";
import { ManagerActionProvider } from "@/features/manager/components";
import { ManagerShell } from "@/features/manager/shell/ManagerShell";
export default function ManagerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="manager-role">
      <ManagerActionProvider>
        <ManagerShell>{children}</ManagerShell>
      </ManagerActionProvider>
    </div>
  );
}
