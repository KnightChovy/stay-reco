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
import { PartnerNotice, type PartnerNoticeTone } from "./PartnerNotice";

type PartnerActionContextValue = {
  /** Toast-like notice for the outcome of an API call. */
  showNotice: (message: string, tone?: PartnerNoticeTone) => void;
};

type Notice = { message: string; tone: PartnerNoticeTone; id: number };

const PartnerActionContext = createContext<PartnerActionContextValue | null>(
  null,
);

export function PartnerActionProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const showNotice = useCallback(
    (message: string, tone: PartnerNoticeTone = "success") =>
      setNotice({ message, tone, id: Date.now() }),
    [],
  );
  const value = useMemo(() => ({ showNotice }), [showNotice]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), notice.tone === "error" ? 8000 : 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  return (
    <PartnerActionContext.Provider value={value}>
      {children}
      {notice && (
        <PartnerNotice
          key={notice.id}
          message={notice.message}
          tone={notice.tone}
          onClose={() => setNotice(null)}
        />
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
