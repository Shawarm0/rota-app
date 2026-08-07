import { TopBar } from "../components/layout/TopBar";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/ui/EmptyState";
import { useNotifications, useMarkRead, useMarkAllRead } from "../hooks/useNotifications";
import { Bell, CheckCheck } from "lucide-react";
import clsx from "clsx";

export function NotificationsPage() {
  const { data, isLoading } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const notifications = data?.notifications || [];

  return (
    <>
      <TopBar title="Notifications" />
      <div className="p-4 md:p-6 space-y-4">
        {notifications.some((n) => !n.read) && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllRead.mutate()}
              loading={markAllRead.isPending}
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : !notifications.length ? (
          <EmptyState icon={Bell} title="No notifications" description="You're all caught up" />
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <Card
                key={n.id}
                className={clsx(
                  "cursor-pointer transition-colors",
                  !n.read && "border-l-4 border-l-indigo-500 bg-indigo-50/50",
                )}
                onClick={() => {
                  if (!n.read) markRead.mutate(n.id);
                }}
              >
                <p className="text-sm font-medium text-gray-900">{n.title}</p>
                <p className="text-sm text-gray-600">{n.body}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(n.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
