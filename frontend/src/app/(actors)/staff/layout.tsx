import type { ReactNode } from "react";
import { StaffHotelProvider } from "@/features/staff/components/StaffHotelProvider";
import { StaffShell } from "@/features/staff/staff-shell";

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <StaffHotelProvider>
      <StaffShell>{children}</StaffShell>
    </StaffHotelProvider>
  );
}
