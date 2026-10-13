import type { ReactNode } from "react";
import { PartnerActionProvider } from "@/features/partner/components";
import { PartnerShell } from "@/features/partner/shell/PartnerShell";

export default function PartnerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="partner-role">
      <PartnerActionProvider>
        <PartnerShell>{children}</PartnerShell>
      </PartnerActionProvider>
    </div>
  );
}
