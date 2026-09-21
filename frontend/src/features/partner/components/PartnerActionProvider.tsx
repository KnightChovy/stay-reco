"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { OperationDialog } from "@/components/common/modal/OperationDialog";
import { PartnerNotice } from "./PartnerNotice";

type PartnerActionContextValue = {
  notify: (message: string) => void;
};

const PartnerActionContext = createContext<PartnerActionContextValue | null>(
  null,
);

export function PartnerActionProvider({ children }: { children: ReactNode }) {
  const [action, setAction] = useState("");
  const [notice, setNotice] = useState("");
  const value = useMemo(() => ({ notify: setAction }), []);

  return (
    <PartnerActionContext.Provider value={value}>
      {children}
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
    </PartnerActionContext.Provider>
  );
}

export function usePartnerActions() {
  const context = useContext(PartnerActionContext);
  if (!context) {
    throw new Error("usePartnerActions must be used within PartnerActionProvider");
  }
  return context;
}
