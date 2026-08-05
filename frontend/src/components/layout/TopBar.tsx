import { Bell, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUiStore } from "../../stores/uiStore";
import { useUnreadCount } from "../../hooks/useNotifications";

interface TopBarProps {
  title: string;
}

export function TopBar({ title }: TopBarProps) {
  const navigate = useNavigate();
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const { data: unreadCount } = useUnreadCount();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-white px-4 py-3 md:px-6">
      <div className="flex items-center gap-3">
        <button onClick={toggleSidebar} className="md:hidden rounded-lg p-1.5 hover:bg-gray-100">
          <Menu className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      </div>
      <button
        onClick={() => navigate("/notifications")}
        className="relative rounded-lg p-2 hover:bg-gray-100 transition-colors"
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {unreadCount ? (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>
    </header>
  );
}
