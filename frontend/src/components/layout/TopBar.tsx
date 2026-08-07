import { Bell, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUiStore } from "../../stores/uiStore";
import { useUnreadCount } from "../../hooks/useNotifications";

interface TopBarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  const navigate = useNavigate();
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const { data: unreadCount } = useUnreadCount();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-3 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={toggleSidebar} className="md:hidden rounded-md p-1.5 hover:bg-gray-100">
          <Menu className="h-4 w-4 text-gray-600" />
        </button>
        <div className="min-w-0">
          <h1 className="text-[20px] font-bold text-gray-900 tracking-[-0.01em]">{title}</h1>
          {subtitle && <p className="text-[13px] text-gray-500">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {actions}
        <button
          onClick={() => navigate("/notifications")}
          className="relative border border-gray-200 rounded-lg w-9 h-9 flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <Bell className="h-[17px] w-[17px] text-gray-500" />
          {unreadCount ? (
            <span className="absolute top-1.5 right-[7px] h-[7px] w-[7px] rounded-full bg-red-500 border-[1.5px] border-white" />
          ) : null}
        </button>
      </div>
    </header>
  );
}
