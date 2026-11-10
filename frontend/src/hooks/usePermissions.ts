import { useAuthStore } from "../stores/authStore";

export function usePermissions() {
  const user = useAuthStore((s) => s.user);
  const isOwner = user?.role === "OWNER" || user?.role === "SYSTEM_ADMIN";
  const isStoreManager = user?.role === "MANAGER";
  const isAssistantManager = user?.role === "EMPLOYEE" && Boolean(user.isAssistantManager);
  const homeStore = user?.location ?? null;

  // Stores this person can change; null means every store. Comes from /auth/me, with a fallback
  // until that has loaded.
  const editableStores =
    user?.editableStores !== undefined
      ? user.editableStores
      : isOwner || (isAssistantManager && !homeStore)
        ? null
        : homeStore
          ? [homeStore]
          : [];

  return {
    isOwner,
    isStoreManager,
    // Owner and store managers: manager dashboard and rota builder
    isManager: isOwner || isStoreManager,
    isAssistantManager,
    // Can see the whole team's shifts, manage staff, cover, reports and holiday approvals
    canManageStaff: isOwner || isStoreManager || isAssistantManager,
    editableStores,
    canEditStore: (store: string | null | undefined) =>
      editableStores === null || (!!store && editableStores.some((s) => s.name === store)),
    canEditStoreId: (storeId: string | null | undefined) =>
      editableStores === null || (!!storeId && editableStores.some((s) => s.id === storeId)),
    // Category names: the owner for every store, a store manager for their own store only
    canSeeCategoryNames: isOwner || isStoreManager,
    seesCategoryNamesFor: (storeId: string | null | undefined) =>
      isOwner || (isStoreManager && !!storeId && storeId === homeStore?.id),
    homeStore,
    // A store-based assistant manager who also works elsewhere views one store's calendar at a time
    calendarStores: isAssistantManager && homeStore ? (user?.calendarStores ?? [homeStore]) : null,
    // Location dropdown options limited to the stores this person can change
    storeOptions: (locations: { id: string; name: string }[] | undefined, by: "id" | "name" = "name") =>
      editableStores === null
        ? [{ value: "", label: "No location" }, ...(locations?.map((l) => ({ value: l[by], label: l.name })) || [])]
        : editableStores.map((l) => ({ value: l[by], label: l.name })),
  };
}
