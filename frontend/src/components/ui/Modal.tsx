import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useUiStore } from "../../stores/uiStore";
import clsx from "clsx";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const theme = useUiStore((s) => s.theme);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [open, onClose]);

  if (!open) return null;

  const isCompact = theme === "compact";
  const isModern = theme === "modern";

  const panelClass = clsx(
    "w-full max-w-lg shadow-xl animate-in fade-in zoom-in-95 duration-200",
    isCompact ? "rounded-lg bg-white" :
    isModern ? "rounded-3xl bg-white/95 backdrop-blur-xl shadow-2xl" :
    "rounded-2xl bg-white",
    className,
  );

  return createPortal(
    <div
      ref={overlayRef}
      className={clsx(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        isModern ? "bg-black/30 backdrop-blur-sm" : "bg-black/50",
      )}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className={panelClass}>
        {title && (
          <div className={clsx(
            "flex items-center justify-between border-b",
            isCompact ? "px-4 py-3" : isModern ? "px-6 py-5 border-gray-100" : "px-5 py-4",
          )}>
            <h2 className={clsx(
              "font-semibold",
              isCompact ? "text-sm" : isModern ? "text-lg tracking-tight" : "text-lg",
            )}>{title}</h2>
            <button onClick={onClose} className={clsx(
              "p-1 transition-colors",
              isCompact ? "rounded-md hover:bg-gray-100" :
              isModern ? "rounded-xl hover:bg-gray-100" :
              "rounded-lg hover:bg-gray-100",
            )}>
              <X className={clsx("text-gray-500", isCompact ? "h-4 w-4" : "h-5 w-5")} />
            </button>
          </div>
        )}
        <div className={clsx(isCompact ? "p-4" : isModern ? "p-6" : "p-5")}>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
