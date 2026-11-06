"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

const LEAVE_MESSAGE = "Bạn có thay đổi chưa lưu. Rời đi sẽ mất các thay đổi này. Vẫn tiếp tục?";

type UnsavedChangesContextValue = {
  setDirty: (id: string, dirty: boolean) => void;
  /** True when nothing is pending, or the partner agrees to drop it. Call before a tab or hotel switch. */
  confirmDiscard: () => boolean;
};

const UnsavedChangesContext = createContext<UnsavedChangesContextValue | null>(null);

/**
 * Guards the partner's unsaved form edits: closing or reloading the tab asks the browser's own question, and a click
 * on an in-app link asks before leaving. Forms register with `useUnsavedChanges(isDirty)`.
 */
export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const dirtyIds = useRef(new Set<string>());
  const [hasDirty, setHasDirty] = useState(false);

  const setDirty = useCallback((id: string, dirty: boolean) => {
    if (dirty) dirtyIds.current.add(id);
    else dirtyIds.current.delete(id);
    setHasDirty(dirtyIds.current.size > 0);
  }, []);

  const confirmDiscard = useCallback(() => dirtyIds.current.size === 0 || window.confirm(LEAVE_MESSAGE), []);

  useEffect(() => {
    if (!hasDirty) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Older browsers show the prompt only when returnValue is set.
      event.returnValue = "";
    };

    // Next.js links navigate in their own click handler, which runs after this capture listener on the document.
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      // Other sites go through beforeunload; a hash on the same page keeps the form.
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      if (window.confirm(LEAVE_MESSAGE)) return;
      event.preventDefault();
      event.stopPropagation();
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [hasDirty]);

  const value = useMemo(() => ({ setDirty, confirmDiscard }), [setDirty, confirmDiscard]);
  return <UnsavedChangesContext.Provider value={value}>{children}</UnsavedChangesContext.Provider>;
}

function useUnsavedChangesContext() {
  const context = useContext(UnsavedChangesContext);
  if (!context) throw new Error("Unsaved changes hooks must be used within UnsavedChangesProvider");
  return context;
}

/** Registers a form's dirty state for the leave guard; unmounting the form clears it. */
export function useUnsavedChanges(isDirty: boolean) {
  const id = useId();
  const { setDirty } = useUnsavedChangesContext();
  useEffect(() => {
    setDirty(id, isDirty);
    return () => setDirty(id, false);
  }, [id, isDirty, setDirty]);
}

export function useConfirmDiscard() {
  return useUnsavedChangesContext().confirmDiscard;
}
