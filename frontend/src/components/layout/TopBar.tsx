import { Bell, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUiStore } from "../../stores/uiStore";
import { useUnreadCount } from "../../hooks/useNotifications";
import clsx from "clsx";

interface TopBarProps {
  title: string;
}

export function TopBar({ title }: TopBarProps) {
  const navigate = useNavigate();
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const theme = useUiStore((s) => s.theme);
  const { data: unreadCount } = useUnreadCount();

  const isCompact = theme === "compact";
  const isModern = theme === "modern";

  return (
    <header className={clsx(
      "sticky top-0 z-20 flex items-center justify-between",
      isCompact ? "border-b border-gray-200 bg-white px-4 py-2" :
      isModern ? "bg-transparent px-6 py-5" :
      "border-b bg-white px-4 py-3 md:px-6",
    )}>
      <div className="flex items-center gap-3">
        <button onClick={toggleSidebar} className="md:hidden rounded-lg p-1.5 hover:bg-gray-100">
          <Menu className={clsx("text-gray-600", isCompact ? "h-4 w-4" : "h-5 w-5")} />
        </button>
        <h1 className={clsx(
          "font-semibold text-gray-900",
          isCompact ? "text-sm" :
          isModern ? "text-2xl tracking-tight" :
          "text-lg",
        )}>{title}</h1>
      </div>
      <button
        onClick={() => navigate("/notifications")}
        className={clsx(
          "relative rounded-lg p-2 transition-colors",
          isCompact ? "hover:bg-gray-100" :
          isModern ? "hover:bg-white/60 rounded-xl" :
          "hover:bg-gray-100",
        )}
      >
        <Bell className={clsx("text-gray-600", isCompact ? "h-4 w-4" : "h-5 w-5")} />
        {unreadCount ? (
          <span className={clsx(
            "absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full text-white text-[10px]",
            isModern ? "h-5 w-5 bg-indigo-500" : "h-4 w-4 bg-red-500",
          )}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>
    </header>
  );
}
