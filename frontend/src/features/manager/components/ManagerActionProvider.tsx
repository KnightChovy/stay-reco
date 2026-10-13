"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { OperationDialog } from "@/components/common/modal/OperationDialog";
import { ManagerNotice } from "./ManagerNotice";

type ManagerActionContextValue = {
  notify: (message: string) => void;
};

const ManagerActionContext = createContext<ManagerActionContextValue | null>(
  null,
);

export function ManagerActionProvider({ children }: { children: ReactNode }) {
  const [action, setAction] = useState("");
  const [notice, setNotice] = useState("");
  const value = useMemo(() => ({ notify: setAction }), []);

  return (
    <ManagerActionContext.Provider value={value}>
      {children}
      <OperationDialog
        action={action}
        scope="Platform Operations · StayReco"
        onClose={() => setAction("")}
        onComplete={() => {
          setNotice(`${action} đã được ghi nhận.`);
          setAction("");
        }}
      />
      {notice && (
        <ManagerNotice message={notice} onClose={() => setNotice("")} />
      )}
    </ManagerActionContext.Provider>
  );
}

export function useManagerActions() {
  const context = useContext(ManagerActionContext);
  if (!context) {
    throw new Error("useManagerActions must be used within ManagerActionProvider");
  }
  return context;
}
