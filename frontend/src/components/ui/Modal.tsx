import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
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

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className={clsx(
          "w-full max-w-[480px] rounded-xl bg-white border border-gray-200 shadow-[0_8px_30px_rgba(0,0,0,0.08)] animate-in fade-in zoom-in-95 duration-200 overflow-hidden",
          className,
        )}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-gray-200 px-[22px] py-[18px]">
            <h2 className="text-base font-bold text-gray-900">{title}</h2>
            <button onClick={onClose} className="rounded-md p-1 hover:bg-gray-100 transition-colors">
              <X className="h-[22px] w-[22px] text-gray-400" />
            </button>
          </div>
        )}
        <div className="px-[22px] py-[22px] overflow-x-hidden">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
