"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export function ManagerPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <Card className={`bg-card shadow-card ${className}`}>{children}</Card>;
}
