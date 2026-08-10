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
import { useAuthStore } from "../../stores/authStore";
import { Users, Plus, UserX, UserCheck, KeyRound, MapPin, Trash2, Search, ChevronDown, Pencil } from "lucide-react";
import clsx from "clsx";
import type { User } from "../../types";

interface CreateEmployeeForm {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  locationId: string;
}

interface EditEmployeeForm {
  firstName: string;
  lastName: string;
  email: string;
  locationId: string;
}

function initials(firstName: string, lastName: string) {
  return `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();
}

export function EmployeesPage() {
  const currentUser = useAuthStore((s) => s.user);
  const { data: users, isLoading } = useUsers("EMPLOYEE");
  const { data: locations } = useLocations();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const disableUser = useDisableUser();
  const enableUser = useEnableUser();
  const resetPassword = useResetPassword();
  const deleteUserMut = useDeleteUser();
  const createLocation = useCreateLocation();
  const deleteLocation = useDeleteLocation();
  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [showLocations, setShowLocations] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [filter, setFilter] = useState("");
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateEmployeeForm>();
  const editForm = useForm<EditEmployeeForm>();
  const resetForm = useForm<{ newPassword: string }>();

  useEffect(() => {
    if (editingUser) {
      editForm.reset({
        firstName: editingUser.firstName,
        lastName: editingUser.lastName,
        email: editingUser.email,
        locationId: editingUser.locationId || "",
      });
    }
  }, [editingUser, editForm]);

  const onCreateSubmit = (data: CreateEmployeeForm) => {
    createUser.mutate(
      { ...data, role: "EMPLOYEE", locationId: data.locationId || undefined },
      {
        onSuccess: () => {
          setShowCreate(false);
          reset();
        },
      },
    );
  };

  const locationOptions = [
    { value: "", label: "No location" },
    ...(locations?.map((l) => ({ value: l.id, label: l.name })) || []),
  ];

  const handleLocationChange = (userId: string, locationId: string) => {
    updateUser.mutate({ id: userId, data: { locationId: locationId || null } });
  };

  const filteredUsers = users?.filter((u) =>
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <>
      <TopBar
        title="Employees"
        subtitle={`${users?.length || 0} employees`}
      />
      <div className="p-4 md:p-7 max-w-[1400px] space-y-5">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search employees"
              className="pl-8 pr-3 py-[9px] border border-gray-200 rounded-lg text-[13.5px] w-[220px] outline-none text-gray-900 bg-white"
            />
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowLocations(true)}
              className="flex items-center gap-[7px] bg-gray-100 text-gray-800 border border-gray-200 rounded-lg px-3.5 py-[9px] text-[13.5px] font-semibold cursor-pointer hover:bg-gray-200 transition-colors"
            >
              <MapPin className="h-[15px] w-[15px]" />
              Locations
            </button>
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
            description={filter ? "No employees match your search" : "Add your first employee to get started"}
            action={
              !filter ? (
                <Button onClick={() => setShowCreate(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Add Employee
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* Desktop row list */}
            <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden">
              {filteredUsers?.map((user, idx) => (
                <div
                  key={user.id}
                  className={clsx(
                    "flex items-center justify-between gap-4 px-5 py-4 flex-wrap",
                    idx < (filteredUsers?.length || 0) - 1 && "border-b border-gray-100",
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[13px] font-bold shrink-0">
                      {initials(user.firstName, user.lastName)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[14.5px] font-semibold text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-[12.5px] text-gray-500">{user.email}</div>
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
                        className="appearance-none px-3 py-[7px] pr-7 border border-gray-200 rounded-lg text-[13px] text-gray-800 bg-gray-50 cursor-pointer outline-none"
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
              {filteredUsers?.map((user) => (
                <div key={user.id} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-[38px] h-[38px] rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-bold shrink-0">
                      {initials(user.firstName, user.lastName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-semibold text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-[12.5px] text-gray-500">{user.email}</div>
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
                  </div>
                </div>
              ))}
            </div>
          </>
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
                { id: editingUser.id, data: { ...data, locationId: data.locationId || null } },
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
    </>
  );
}
