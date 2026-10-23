import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { PushPrompt } from "./PushPrompt";

export function AppLayout() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <PushPrompt />
        <Outlet />
      </main>
    </div>
  );
}
