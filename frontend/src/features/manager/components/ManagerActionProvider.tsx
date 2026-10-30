"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { OperationDialog } from "@/components/common/modal/OperationDialog";
import { ManagerNotice, type ManagerNoticeTone } from "./ManagerNotice";

type ManagerActionContextValue = {
  /** Mock screens: opens the sample operation dialog for an action that has no API yet. */
  notify: (message: string) => void;
  /** Toast-like notice for the outcome of an API call. */
  showNotice: (message: string, tone?: ManagerNoticeTone) => void;
};

type Notice = { message: string; tone: ManagerNoticeTone; id: number };

const ManagerActionContext = createContext<ManagerActionContextValue | null>(
  null,
);

export function ManagerActionProvider({ children }: { children: ReactNode }) {
  const [action, setAction] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const showNotice = useCallback(
    (message: string, tone: ManagerNoticeTone = "success") =>
      setNotice({ message, tone, id: Date.now() }),
    [],
  );
  const value = useMemo(
    () => ({ notify: setAction, showNotice }),
    [showNotice],
  );

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), notice.tone === "error" ? 8000 : 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  return (
    <ManagerActionContext.Provider value={value}>
      {children}
      <OperationDialog
        action={action}
        scope="Platform Operations · StayReco"
        onClose={() => setAction("")}
        onComplete={() => {
          showNotice(`${action} đã được ghi nhận.`);
          setAction("");
        }}
      />
      {notice && (
        <ManagerNotice
          key={notice.id}
          message={notice.message}
          tone={notice.tone}
          onClose={() => setNotice(null)}
        />
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
