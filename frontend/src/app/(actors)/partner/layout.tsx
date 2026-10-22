import type { ReactNode } from "react";
import { PartnerActionProvider, PartnerHotelProvider } from "@/features/partner/components";
import { PartnerShell } from "@/features/partner/shell/PartnerShell";

export default function PartnerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="partner-role">
      <PartnerActionProvider>
        <PartnerHotelProvider>
          <PartnerShell>{children}</PartnerShell>
        </PartnerHotelProvider>
      </PartnerActionProvider>
    </div>
  );
}
