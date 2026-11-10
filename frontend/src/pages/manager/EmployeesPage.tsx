import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { TopBar } from "../../components/layout/TopBar";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Modal } from "../../components/ui/Modal";
import { Spinner } from "../../components/ui/Spinner";
import { EmptyState } from "../../components/ui/EmptyState";
import { useUsers, useCreateUser, useDisableUser, useEnableUser, useResetPassword, useUpdateUser, useDeleteUser } from "../../hooks/useUsers";
import { useLocations, useCreateLocation, useDeleteLocation } from "../../hooks/useLocations";
import { useCategories, useCreateCategory, useDeleteCategory } from "../../hooks/useCategories";
import { useAuthStore } from "../../stores/authStore";
import { usePermissions } from "../../hooks/usePermissions";
import { Users, Plus, UserX, UserCheck, KeyRound, MapPin, Trash2, Search, ChevronDown, Pencil, Tag } from "lucide-react";
import clsx from "clsx";
import type { User } from "../../types";
import { STAFF_ROLES } from "../../types";

const PRESET_COLORS = [
  "#4F46E5",
  "#059669",
  "#DC2626",
  "#D97706",
  "#7C3AED",
  "#0891B2",
  "#EA580C",
  "#DB2777",
];

interface CreateEmployeeForm {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  locationId: string;
  categoryId: string;
}

interface EditEmployeeForm {
  firstName: string;
  lastName: string;
  email: string;
  locationId: string;
  categoryId: string;
  access: "EMPLOYEE" | "ASSISTANT" | "MANAGER";
}

function FilterSelect({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none py-[9px] pl-3 pr-8 border border-gray-200 rounded-lg text-[13.5px] text-gray-800 bg-white cursor-pointer outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
    </div>
  );
}

function initials(firstName: string, lastName: string) {
  return `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();
}

export function EmployeesPage() {
  const currentUser = useAuthStore((s) => s.user);
  const { isOwner, isStoreManager, isAssistantManager, storeOptions, canEditStoreId, canSeeCategoryNames, seesCategoryNamesFor, homeStore } =
    usePermissions();
  const { data: users, isLoading } = useUsers(STAFF_ROLES);
  const { data: locations } = useLocations();
  const { data: categories } = useCategories(canSeeCategoryNames);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const disableUser = useDisableUser();
  const enableUser = useEnableUser();
  const resetPassword = useResetPassword();
  const deleteUserMut = useDeleteUser();
  const createLocation = useCreateLocation();
  const deleteLocation = useDeleteLocation();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [showLocations, setShowLocations] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState(PRESET_COLORS[0]);
  // The owner picks which store a new category is for; store managers always use their own
  const [newCategoryStore, setNewCategoryStore] = useState("");
  const [filter, setFilter] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  // Stores a store manager may also edit (owner only)
  const [storeAccess, setStoreAccess] = useState<Record<string, "view" | "edit">>({});
  // Other stores this person also works at (set by the owner or a store manager)
  const [workStoreIds, setWorkStoreIds] = useState<string[]>([]);
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<CreateEmployeeForm>();
  const editForm = useForm<EditEmployeeForm>();
  const resetForm = useForm<{ newPassword: string }>();

  useEffect(() => {
    if (editingUser) {
      editForm.reset({
        firstName: editingUser.firstName,
        lastName: editingUser.lastName,
        email: editingUser.email,
        locationId: editingUser.locationId || "",
        categoryId: editingUser.categoryId || "",
        access: editingUser.role === "MANAGER" ? "MANAGER" : editingUser.isAssistantManager ? "ASSISTANT" : "EMPLOYEE",
      });
      setStoreAccess(Object.fromEntries((editingUser.storeAccess ?? []).map((a) => [a.locationId, a.canEdit ? "edit" : "view"])));
      setWorkStoreIds(editingUser.workStores?.map((w) => w.locationId) ?? []);
    }
  }, [editingUser, editForm]);

  const onCreateSubmit = (data: CreateEmployeeForm) => {
    createUser.mutate(
      {
        ...data,
        role: "EMPLOYEE",
        locationId: data.locationId || undefined,
        categoryId: seesCategoryNamesFor(data.locationId) ? data.categoryId || undefined : undefined,
      },
      {
        onSuccess: () => {
          setShowCreate(false);
          reset();
        },
      },
    );
  };

  // Staff can only be placed at stores this person runs
  const locationOptions = storeOptions(locations, "id");

  // Categories belong to one store, so only that store's are offered
  const categoryOptionsFor = (storeId: string) => [
    { value: "", label: "No category" },
    ...(categories?.filter((c) => c.locationId === storeId).map((c) => ({ value: c.id, label: c.name })) || []),
  ];
  const multiStore = (locations?.length ?? 0) > 1;
  const categoryLabel = (c: { name: string; location?: { name: string } | null }) =>
    isOwner && multiStore && c.location ? `${c.name} · ${c.location.name}` : c.name;
  const createStore = watch("locationId");

  const handleLocationChange = (userId: string, locationId: string) => {
    updateUser.mutate({ id: userId, data: { locationId: locationId || null } });
  };

  const alsoWorksAt = (user: User) =>
    user.workStores
      ?.map((w) => locations?.find((l) => l.id === w.locationId)?.name)
      .filter(Boolean)
      .join(", ");

  // Mirrors the server: the owner manages everyone; store managers manage employees at their stores;
  // assistant managers manage regular employees at theirs. Nobody below the owner edits themselves.
  const canEdit = (user: User) => {
    if (isOwner) return true;
    if (user.id === currentUser?.id || user.role !== "EMPLOYEE") return false;
    if (isAssistantManager && user.isAssistantManager) return false;
    return canEditStoreId(user.locationId);
  };
  const editAccess = editForm.watch("access");
  const editStore = editForm.watch("locationId");

  // "" = all, "none" = not set, otherwise an id
  const matchesFilter = (value: string | null | undefined, selected: string) =>
    !selected || (selected === "none" ? !value : value === selected);
  const filteredUsers = users?.filter(
    (u) =>
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(filter.toLowerCase()) &&
      matchesFilter(u.locationId, storeFilter) &&
      matchesFilter(u.categoryId, categoryFilter),
  );
  const isFiltering = Boolean(filter || storeFilter || categoryFilter);

  // Grouped under category headings like the Holidays page. Categories only show for staff the viewer
  // can see them for, so staff at other stores are grouped by store instead. Order: categories,
  // uncategorised, then other stores.
  const groups: { key: string; rank: number; name: string; color?: string; users: User[] }[] = [];
  for (const user of filteredUsers ?? []) {
    const otherStore = homeStore && user.locationId !== homeStore.id;
    const group = user.category?.name
      ? { key: user.category.id, rank: 0, name: categoryLabel(user.category), color: user.category.color }
      : otherStore
        ? { key: `store:${user.locationId ?? ""}`, rank: 2, name: user.location?.name ?? "No store" }
        : { key: "", rank: 1, name: "No category" };
    let existing = groups.find((g) => g.key === group.key);
    if (!existing) {
      existing = { ...group, users: [] };
      groups.push(existing);
    }
    existing.users.push(user);
  }
  groups.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));
  // A lone "No category" heading would just be noise
  const showHeadings = groups.length > 1 || Boolean(groups[0]?.key);

  return (
    <>
      <TopBar
        title="Employees"
        subtitle={`${users?.length || 0} employees`}
      />
      <div className="p-4 md:p-7 max-w-[1400px] space-y-5">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search employees"
                className="pl-8 pr-3 py-[9px] border border-gray-200 rounded-lg text-[13.5px] w-[220px] outline-none text-gray-900 bg-white"
              />
            </div>
            {locations && locations.length > 1 && (
              <FilterSelect
                value={storeFilter}
                onChange={setStoreFilter}
                options={[
                  { value: "", label: "All stores" },
                  ...locations.map((l) => ({ value: l.id, label: l.name })),
                  { value: "none", label: "No store" },
                ]}
              />
            )}
            {canSeeCategoryNames && categories && categories.length > 0 && (
              <FilterSelect
                value={categoryFilter}
                onChange={setCategoryFilter}
                options={[
                  { value: "", label: "All categories" },
                  ...categories.map((c) => ({ value: c.id, label: categoryLabel(c) })),
                  { value: "none", label: "No category" },
                ]}
              />
            )}
          </div>
          <div className="flex items-center gap-2.5">
            {canSeeCategoryNames && (
            <button
              onClick={() => setShowCategories(true)}
              className="flex items-center gap-[7px] bg-gray-100 text-gray-800 border border-gray-200 rounded-lg px-3.5 py-[9px] text-[13.5px] font-semibold cursor-pointer hover:bg-gray-200 transition-colors"
            >
              <Tag className="h-[15px] w-[15px]" />
              Categories
            </button>
            )}
            {isOwner && (
            <button
              onClick={() => setShowLocations(true)}
              className="flex items-center gap-[7px] bg-gray-100 text-gray-800 border border-gray-200 rounded-lg px-3.5 py-[9px] text-[13.5px] font-semibold cursor-pointer hover:bg-gray-200 transition-colors"
            >
              <MapPin className="h-[15px] w-[15px]" />
              Locations
            </button>
            )}
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-[7px] bg-indigo-600 text-white rounded-lg px-4 py-[9px] text-[13.5px] font-semibold cursor-pointer hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-[15px] w-[15px]" />
              Add Employee
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : filteredUsers?.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No employees"
            description={isFiltering ? "No employees match your filters" : "Add your first employee to get started"}
            action={
              !isFiltering ? (
                <Button onClick={() => setShowCreate(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Add Employee
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-5">
            {groups.map((group) => (
              <div key={group.key || "none"}>
                {showHeadings && (
                  <h3 className="flex items-center gap-2 text-[15px] font-bold text-gray-900 mb-2.5">
                    {group.color && <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: group.color }} />}
                    {group.name}
                  </h3>
                )}
                {/* Desktop row list */}
                <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden">
                  {group.users.map((user, idx) => (
                    <div
                      key={user.id}
                      className={clsx(
                        "flex items-center justify-between gap-4 px-5 py-4 flex-wrap",
                        idx < group.users.length - 1 && "border-b border-gray-100",
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[13px] font-bold shrink-0">
                          {initials(user.firstName, user.lastName)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {/* Assistant managers see a category's colour but not its name */}
                            {user.category?.color && !user.category.name && (
                              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: user.category.color }} />
                            )}
                            <span className="text-[14.5px] font-semibold text-gray-900">
                              {user.firstName} {user.lastName}
                            </span>
                            {user.role === "MANAGER" && (
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                                Store Manager
                              </span>
                            )}
                            {user.isAssistantManager && (
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                                Assistant Manager
                              </span>
                            )}
                          </div>
                          <div className="text-[12.5px] text-gray-500">{user.email}</div>
                          {alsoWorksAt(user) && <div className="text-[12px] text-indigo-600">Also works at {alsoWorksAt(user)}</div>}
                          {user.location && (
                            <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="h-[11px] w-[11px]" />
                              {user.location.name}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <div className="relative">
                          <select
                            value={user.locationId || ""}
                            onChange={(e) => handleLocationChange(user.id, e.target.value)}
                            disabled={!canEdit(user)}
                            className="disabled:opacity-60 disabled:cursor-default appearance-none px-3 py-[7px] pr-7 border border-gray-200 rounded-lg text-[13px] text-gray-800 bg-gray-50 cursor-pointer outline-none"
                          >
                            {locationOptions.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-[11px] w-[11px] text-gray-400 pointer-events-none" />
                        </div>
                        <span className={clsx(
                          "text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap",
                          user.active
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-red-50 text-red-600",
                        )}>
                          {user.active ? "Active" : "Disabled"}
                        </span>
                        {canEdit(user) && (
                        <>
                        <button
                          onClick={() => setEditingUser(user)}
                          className="w-8 h-8 rounded-[7px] border border-gray-200 bg-white flex items-center justify-center hover:bg-indigo-50 text-gray-500 hover:text-indigo-600"
                          title="Edit employee"
                        >
                          <Pencil className="h-[15px] w-[15px]" />
                        </button>
                        <button
                          onClick={() => setResetUserId(user.id)}
                          className="w-8 h-8 rounded-[7px] border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 text-gray-500"
                          title="Reset password"
                        >
                          <KeyRound className="h-[15px] w-[15px]" />
                        </button>
                        {user.active ? (
                          <button
                            onClick={() => disableUser.mutate(user.id)}
                            className="w-8 h-8 rounded-[7px] border border-gray-200 bg-white flex items-center justify-center hover:bg-red-50 text-red-500"
                            title="Deactivate"
                          >
                            <UserX className="h-[15px] w-[15px]" />
                          </button>
                        ) : (
                          <button
                            onClick={() => enableUser.mutate(user.id)}
                            className="w-8 h-8 rounded-[7px] border border-gray-200 bg-white flex items-center justify-center hover:bg-green-50 text-green-500"
                            title="Enable"
                          >
                            <UserCheck className="h-[15px] w-[15px]" />
                          </button>
                        )}
                        </>
                        )}
                        {currentUser?.role === "SYSTEM_ADMIN" && (
                          <button
                            onClick={() => {
                              if (confirm(`Delete ${user.firstName} ${user.lastName}? This cannot be undone.`)) {
                                deleteUserMut.mutate(user.id);
                              }
                            }}
                            className="w-8 h-8 rounded-[7px] border border-gray-200 bg-white flex items-center justify-center hover:bg-red-50 text-red-500"
                            title="Delete user"
                          >
                            <Trash2 className="h-[15px] w-[15px]" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mobile card list */}
                <div className="md:hidden flex flex-col gap-3">
                  {group.users.map((user) => (
                    <div key={user.id} className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-[38px] h-[38px] rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-bold shrink-0">
                          {initials(user.firstName, user.lastName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {/* Assistant managers see a category's colour but not its name */}
                            {user.category?.color && !user.category.name && (
                              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: user.category.color }} />
                            )}
                            <span className="text-[15px] font-semibold text-gray-900">
                              {user.firstName} {user.lastName}
                            </span>
                            {user.role === "MANAGER" && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                                Store Manager
                              </span>
                            )}
                            {user.isAssistantManager && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700">
                                Assistant Manager
                              </span>
                            )}
                          </div>
                          <div className="text-[12.5px] text-gray-500">{user.email}</div>
                          {alsoWorksAt(user) && <div className="text-[12px] text-indigo-600">Also works at {alsoWorksAt(user)}</div>}
                        </div>
                        <span className={clsx(
                          "text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap",
                          user.active
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-red-50 text-red-600",
                        )}>
                          {user.active ? "Active" : "Disabled"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <div className="text-[12.5px] text-gray-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {user.location?.name || "No location"}
                        </div>
                        {canEdit(user) && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="w-8 h-8 rounded-[7px] border border-gray-200 bg-white flex items-center justify-center text-gray-500"
                            title="Edit employee"
                          >
                            <Pencil className="h-[15px] w-[15px]" />
                          </button>
                          <button
                            onClick={() => setResetUserId(user.id)}
                            className="w-8 h-8 rounded-[7px] border border-gray-200 bg-white flex items-center justify-center text-gray-500"
                            title="Reset password"
                          >
                            <KeyRound className="h-[15px] w-[15px]" />
                          </button>
                          {user.active ? (
                            <button
                              onClick={() => disableUser.mutate(user.id)}
                              className="w-8 h-8 rounded-[7px] border border-gray-200 bg-white flex items-center justify-center text-red-500"
                              title="Deactivate"
                            >
                              <UserX className="h-[15px] w-[15px]" />
                            </button>
                          ) : (
                            <button
                              onClick={() => enableUser.mutate(user.id)}
                              className="w-8 h-8 rounded-[7px] border border-gray-200 bg-white flex items-center justify-center text-green-500"
                              title="Enable"
                            >
                              <UserCheck className="h-[15px] w-[15px]" />
                            </button>
                          )}
                        </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Employee modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Employee">
        <form onSubmit={handleSubmit(onCreateSubmit)} className="flex flex-col gap-4">
          <Input id="firstName" label="First Name" error={errors.firstName?.message} {...register("firstName", { required: "Required" })} />
          <Input id="lastName" label="Last Name" error={errors.lastName?.message} {...register("lastName", { required: "Required" })} />
          <Input id="email" label="Email" type="email" error={errors.email?.message} {...register("email", { required: "Required" })} />
          <Input id="password" label="Password" type="password" error={errors.password?.message} {...register("password", { required: "Required", minLength: { value: 8, message: "Min 8 characters" } })} />
          <Select id="locationId" label="Store Location" options={locationOptions} {...register("locationId")} />
          {seesCategoryNamesFor(createStore) && (
            <Select id="categoryId" label="Category" options={categoryOptionsFor(createStore)} {...register("categoryId")} />
          )}
          <div className="flex justify-end gap-2.5 border-t border-gray-200 pt-4 -mx-[22px] px-[22px] -mb-[22px] pb-4">
            <Button variant="secondary" type="button" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" loading={createUser.isPending}>Create</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Employee modal */}
      <Modal open={!!editingUser} onClose={() => setEditingUser(null)} title="Edit Employee">
        <form
          onSubmit={editForm.handleSubmit((data) => {
            if (editingUser) {
              updateUser.mutate(
                {
                  id: editingUser.id,
                  data: {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                    locationId: data.locationId || null,
                    // Only the store's manager or the owner sets categories
                    ...(seesCategoryNamesFor(data.locationId) ? { categoryId: data.categoryId || null } : {}),
                    // The owner sets the role; store managers can only make someone an assistant manager
                    ...(isOwner
                      ? {
                          role: data.access === "MANAGER" ? "MANAGER" : "EMPLOYEE",
                          isAssistantManager: data.access === "ASSISTANT",
                          storeAccess:
                            data.access === "MANAGER"
                              ? Object.entries(storeAccess)
                                  .filter(([locationId]) => locationId !== data.locationId)
                                  .map(([locationId, level]) => ({ locationId, canEdit: level === "edit" }))
                              : [],
                        }
                      : isStoreManager
                        ? { isAssistantManager: data.access === "ASSISTANT" }
                        : {}),
                    ...(isOwner || isStoreManager ? { workStoreIds: workStoreIds.filter((id) => id !== data.locationId) } : {}),
                  },
                },
                { onSuccess: () => setEditingUser(null) },
              );
            }
          })}
          className="flex flex-col gap-4"
        >
          <Input
            id="editFirstName"
            label="First Name"
            error={editForm.formState.errors.firstName?.message}
            {...editForm.register("firstName", { required: "Required" })}
          />
          <Input
            id="editLastName"
            label="Last Name"
            error={editForm.formState.errors.lastName?.message}
            {...editForm.register("lastName", { required: "Required" })}
          />
          <Input
            id="editEmail"
            label="Email"
            type="email"
            error={editForm.formState.errors.email?.message}
            {...editForm.register("email", { required: "Required" })}
          />
          <Select
            id="editLocationId"
            label="Store Location"
            options={locationOptions}
            {...editForm.register("locationId")}
          />
          {seesCategoryNamesFor(editStore) && (
            <Select
              id="editCategoryId"
              label="Category"
              options={categoryOptionsFor(editStore)}
              {...editForm.register("categoryId")}
            />
          )}
          {(isOwner || isStoreManager) && (
            <Select
              id="editAccess"
              label="Role"
              options={[
                { value: "EMPLOYEE", label: "Employee" },
                { value: "ASSISTANT", label: "Assistant manager" },
                ...(isOwner ? [{ value: "MANAGER", label: "Store manager" }] : []),
              ]}
              {...editForm.register("access")}
            />
          )}
          {editAccess === "ASSISTANT" && (
            <p className="-mt-2 text-[12px] text-gray-500">
              Can manage employees, approve holidays, edit shifts in the calendar, and see shifts to cover and reports.
            </p>
          )}
          {editAccess === "MANAGER" && (
            <div className="-mt-2 space-y-2">
              <p className="text-[12px] text-gray-500">
                Builds rotas and manages staff for their store. They only see other stores you give them access to.
              </p>
              {isOwner && (locations?.filter((l) => l.id !== editStore).length ?? 0) > 0 && (
                <div>
                  <span className="block text-[13px] font-semibold text-gray-700 mb-1">Other stores</span>
                  {locations
                    ?.filter((l) => l.id !== editStore)
                    .map((l) => (
                      <div key={l.id} className="flex items-center justify-between gap-3 py-1">
                        <span className="text-[13px] text-gray-700">{l.name}</span>
                        <select
                          value={storeAccess[l.id] ?? ""}
                          onChange={(e) =>
                            setStoreAccess(({ [l.id]: _old, ...rest }) =>
                              e.target.value ? { ...rest, [l.id]: e.target.value as "view" | "edit" } : rest,
                            )
                          }
                          className="py-1.5 px-2 border border-gray-200 rounded-lg text-[13px] text-gray-800 bg-white outline-none"
                        >
                          <option value="">No access</option>
                          <option value="view">Can view</option>
                          <option value="edit">Can edit</option>
                        </select>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
          {(isOwner || isStoreManager) && (locations?.filter((l) => l.id !== editStore).length ?? 0) > 0 && (
            <div>
              <span className="block text-[13px] font-semibold text-gray-700">Also works at</span>
              <span className="block text-[12px] text-gray-500 mb-1">
                Those stores can put them on rotas. Shifts there need approval from their home store's manager.
              </span>
              {locations
                ?.filter((l) => l.id !== editStore)
                .map((l) => (
                  <label key={l.id} className="flex items-center gap-2 text-[13px] text-gray-700 py-0.5 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-indigo-600"
                      checked={workStoreIds.includes(l.id)}
                      onChange={(e) =>
                        setWorkStoreIds((ids) => (e.target.checked ? [...ids, l.id] : ids.filter((id) => id !== l.id)))
                      }
                    />
                    {l.name}
                  </label>
                ))}
            </div>
          )}
          <div className="flex justify-end gap-2.5 border-t border-gray-200 pt-4 -mx-[22px] px-[22px] -mb-[22px] pb-4">
            <Button variant="secondary" type="button" onClick={() => setEditingUser(null)}>Cancel</Button>
            <Button type="submit" loading={updateUser.isPending}>Save</Button>
          </div>
        </form>
      </Modal>

      {/* Reset Password modal */}
      <Modal open={!!resetUserId} onClose={() => setResetUserId(null)} title="Reset Password">
        <form
          onSubmit={resetForm.handleSubmit((data) => {
            if (resetUserId) {
              resetPassword.mutate(
                { id: resetUserId, newPassword: data.newPassword },
                { onSuccess: () => { setResetUserId(null); resetForm.reset(); } },
              );
            }
          })}
          className="flex flex-col gap-4"
        >
          <Input
            id="newPassword"
            label="New Password"
            type="password"
            error={resetForm.formState.errors.newPassword?.message}
            {...resetForm.register("newPassword", { required: "Required", minLength: { value: 8, message: "Min 8 characters" } })}
          />
          <div className="flex justify-end gap-2.5 border-t border-gray-200 pt-4 -mx-[22px] px-[22px] -mb-[22px] pb-4">
            <Button variant="secondary" type="button" onClick={() => setResetUserId(null)}>Cancel</Button>
            <Button type="submit" loading={resetPassword.isPending}>Reset</Button>
          </div>
        </form>
      </Modal>

      {/* Manage Locations modal */}
      <Modal open={showLocations} onClose={() => setShowLocations(false)} title="Manage Locations">
        <div className="flex flex-col gap-4">
          <div className="flex gap-2.5">
            <Input
              id="newLocation"
              placeholder="New location name"
              value={newLocationName}
              onChange={(e) => setNewLocationName(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={() => {
                if (newLocationName.trim()) {
                  createLocation.mutate(newLocationName.trim(), {
                    onSuccess: () => setNewLocationName(""),
                  });
                }
              }}
              loading={createLocation.isPending}
            >
              Add
            </Button>
          </div>
          {locations && locations.length > 0 ? (
            <div className="space-y-0">
              {locations.map((loc) => (
                <div key={loc.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{loc.name}</p>
                    <p className="text-xs text-gray-400">{loc._count?.users || 0} employees</p>
                  </div>
                  <button
                    onClick={() => deleteLocation.mutate(loc.id)}
                    className="w-8 h-8 rounded-[7px] border border-gray-200 bg-white flex items-center justify-center hover:bg-red-50 text-red-500"
                    title="Delete location"
                  >
                    <Trash2 className="h-[15px] w-[15px]" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No locations yet. Add one above.</p>
          )}
        </div>
      </Modal>

      {/* Manage Categories modal */}
      <Modal open={showCategories} onClose={() => setShowCategories(false)} title="Manage Categories">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2.5">
            <div className="flex gap-2.5">
              <Input
                id="newCategory"
                placeholder="New category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={() => {
                  if (newCategoryName.trim()) {
                    createCategory.mutate(
                      { name: newCategoryName.trim(), color: newCategoryColor, locationId: newCategoryStore || locations?.[0]?.id },
                      { onSuccess: () => setNewCategoryName("") },
                    );
                  }
                }}
                loading={createCategory.isPending}
              >
                Add
              </Button>
            </div>
            {isOwner && multiStore && (
              <Select
                id="newCategoryStore"
                options={locations?.map((l) => ({ value: l.id, label: l.name })) ?? []}
                value={newCategoryStore || locations?.[0]?.id}
                onChange={(e) => setNewCategoryStore(e.target.value)}
              />
            )}
            <div className="flex items-center gap-1.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewCategoryColor(c)}
                  className={clsx(
                    "w-7 h-7 rounded-full cursor-pointer transition-all",
                    newCategoryColor === c ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : "hover:scale-105",
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          {categories && categories.length > 0 ? (
            <div className="space-y-0">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{cat.name}</p>
                      <p className="text-xs text-gray-400">
                        {isOwner && multiStore && cat.location ? `${cat.location.name} · ` : ""}
                        {cat._count?.users || 0} employees
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteCategory.mutate(cat.id)}
                    className="w-8 h-8 rounded-[7px] border border-gray-200 bg-white flex items-center justify-center hover:bg-red-50 text-red-500"
                    title="Delete category"
                  >
                    <Trash2 className="h-[15px] w-[15px]" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No categories yet. Add one above.</p>
          )}
        </div>
      </Modal>
    </>
  );
}
