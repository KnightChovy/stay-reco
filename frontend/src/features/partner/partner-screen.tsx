"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { OperationDialog } from "@/components/common/modal/OperationDialog";
import { PartnerBookingsScreen } from "@/features/partner/bookings/partner-bookings-screen";
import {
  PartnerNotice,
  PartnerPanel,
  PartnerTitle,
} from "@/features/partner/partner-primitives";
import { PartnerRevenueScreen } from "@/features/partner/revenue/partner-revenue-screen";
import { PartnerVerificationFlowScreen } from "@/features/partner/verification/partner-verification-flow-screen";
import {
  partnerWorkspaces,
  type PartnerMode,
  type PartnerWorkspace,
} from "@/lib/partner-data";

type Notify = (message: string) => void;

export function PartnerScreen({ mode }: { mode: PartnerMode }) {
  const [action, setAction] = useState("");
  const [notice, setNotice] = useState("");
  const notify: Notify = (message) => setAction(message);

  return (
    <>
      <PartnerScreenContent mode={mode} notify={notify} />
      <OperationDialog
        action={action}
        onClose={() => setAction("")}
        onComplete={() => {
          setNotice(`${action} đã được ghi nhận.`);
          setAction("");
        }}
      />
      {notice && (
        <PartnerNotice message={notice} onClose={() => setNotice("")} />
      )}
    </>
  );
}

function PartnerScreenContent({
  mode,
  notify,
}: {
  mode: PartnerMode;
  notify: Notify;
}) {
  if (mode === "bookings") {
    return <PartnerBookingsScreen notify={notify} />;
  }
  if (mode === "revenue") {
    return <PartnerRevenueScreen notify={notify} />;
  }
  if (mode === "verification") {
    return <PartnerVerificationFlowScreen notify={notify} />;
  }

  return <PartnerWorkspaceScreen data={partnerWorkspaces[mode]} notify={notify} />;
}

function PartnerWorkspaceScreen({
  data,
  notify,
}: {
  data: PartnerWorkspace;
  notify: Notify;
}) {
  const Icon = data.icon;

  return (
    <div className="space-y-6">
      <PartnerTitle
        title={data.title}
        description={data.description}
        action={
          <Button onClick={() => notify(data.action)}>
            <Icon />
            {data.action}
          </Button>
        }
      />
      <section className="grid gap-4 md:grid-cols-[260px_1fr]">
        <PartnerPanel className="p-5">
          <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
            <Icon size={21} />
          </span>
          <p className="mt-5 text-xs font-semibold text-muted-foreground">
            TỔNG QUAN
          </p>
          <strong className="mt-2 block text-2xl text-primary">
            {data.summary}
          </strong>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Dữ liệu mẫu phục vụ prototype, chưa kết nối API.
          </p>
        </PartnerPanel>
        <PartnerPanel className="overflow-hidden">
          <div className="border-b px-5 py-4">
            <h2 className="font-bold text-primary">Thông tin vận hành</h2>
          </div>
          <div className="divide-y">
            {data.rows.map(([name, detail, state]) => (
              <div
                key={name}
                className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_1.5fr_auto] sm:items-center"
              >
                <strong className="text-sm text-primary">{name}</strong>
                <span className="text-sm text-muted-foreground">{detail}</span>
                <span className="w-fit rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">
                  {state}
                </span>
              </div>
            ))}
          </div>
        </PartnerPanel>
      </section>
    </div>
  );
}
