import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { useIsDesktop } from "../../hooks/useMediaQuery";
import { useUiStore } from "../../stores/uiStore";
import clsx from "clsx";

export function AppLayout() {
  const isDesktop = useIsDesktop();
  const theme = useUiStore((s) => s.theme);

  const bg = theme === "compact" ? "bg-white" : theme === "modern" ? "bg-[#F5F5F7]" : "bg-gray-50";

  return (
    <div className={clsx("flex h-screen", bg)} data-theme={theme}>
      {isDesktop && <Sidebar />}
      <main className={clsx("flex-1 overflow-y-auto", !isDesktop && "pb-20")}>
        <Outlet />
      </main>
      {!isDesktop && <BottomNav />}
    </div>
  );
}
