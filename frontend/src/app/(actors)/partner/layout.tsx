import type { ReactNode } from "react";
import {
  PartnerActionProvider,
  PartnerHotelProvider,
  UnsavedChangesProvider,
} from "@/features/partner/components";
import { PartnerShell } from "@/features/partner/shell/PartnerShell";

export default function PartnerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="partner-role">
      <PartnerActionProvider>
        <PartnerHotelProvider>
          <UnsavedChangesProvider>
            <PartnerShell>{children}</PartnerShell>
          </UnsavedChangesProvider>
        </PartnerHotelProvider>
      </PartnerActionProvider>
    </div>
  );
}
