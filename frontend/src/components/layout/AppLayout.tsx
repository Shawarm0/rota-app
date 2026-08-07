import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { useIsDesktop } from "../../hooks/useMediaQuery";

export function AppLayout() {
  const isDesktop = useIsDesktop();

  return (
    <div className="flex h-screen bg-gray-50">
      {isDesktop && <Sidebar />}
      <main className={`flex-1 overflow-y-auto ${!isDesktop ? "pb-16" : ""}`}>
        <Outlet />
      </main>
      {!isDesktop && <BottomNav />}
    </div>
  );
}
