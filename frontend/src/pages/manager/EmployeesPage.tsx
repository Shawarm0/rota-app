import { useState } from "react";
import { useForm } from "react-hook-form";
import { TopBar } from "../../components/layout/TopBar";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Modal } from "../../components/ui/Modal";
import { Badge } from "../../components/ui/Badge";
import { Spinner } from "../../components/ui/Spinner";
import { EmptyState } from "../../components/ui/EmptyState";
import { useUsers, useCreateUser, useDisableUser, useEnableUser, useResetPassword, useUpdateUser, useDeleteUser } from "../../hooks/useUsers";
import { useLocations, useCreateLocation, useDeleteLocation } from "../../hooks/useLocations";
import { useAuthStore } from "../../stores/authStore";
import { Users, Plus, UserX, UserCheck, KeyRound, MapPin, Trash2 } from "lucide-react";

interface CreateEmployeeForm {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  locationId: string;
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
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [showLocations, setShowLocations] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateEmployeeForm>();
  const resetForm = useForm<{ newPassword: string }>();

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

  return (
    <>
      <TopBar title="Employees" />
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">{users?.length || 0} employees</p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowLocations(true)}>
              <MapPin className="h-4 w-4 mr-1" /> Locations
            </Button>
            <Button onClick={() => setShowCreate(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add Employee
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : users?.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No employees"
            description="Add your first employee to get started"
            action={
              <Button onClick={() => setShowCreate(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add Employee
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3">
            {users?.map((user) => (
              <Card key={user.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  {user.location && (
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" /> {user.location.name}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={user.locationId || ""}
                    onChange={(e) => handleLocationChange(user.id, e.target.value)}
                    className="text-xs border rounded-lg px-2 py-1.5 text-gray-600 bg-white"
                  >
                    {locationOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <Badge variant={user.active ? "green" : "red"}>
                    {user.active ? "Active" : "Disabled"}
                  </Badge>
                  <button
                    onClick={() => setResetUserId(user.id)}
                    className="p-1.5 rounded-lg hover:bg-gray-100"
                    title="Reset password"
                  >
                    <KeyRound className="h-4 w-4 text-gray-500" />
                  </button>
                  {user.active ? (
                    <button
                      onClick={() => disableUser.mutate(user.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50"
                      title="Disable"
                    >
                      <UserX className="h-4 w-4 text-red-500" />
                    </button>
                  ) : (
                    <button
                      onClick={() => enableUser.mutate(user.id)}
                      className="p-1.5 rounded-lg hover:bg-green-50"
                      title="Enable"
                    >
                      <UserCheck className="h-4 w-4 text-green-500" />
                    </button>
                  )}
                  {currentUser?.role === "SYSTEM_ADMIN" && (
                    <button
                      onClick={() => {
                        if (confirm(`Delete ${user.firstName} ${user.lastName}? This cannot be undone.`)) {
                          deleteUserMut.mutate(user.id);
                        }
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-50"
                      title="Delete user"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Employee">
        <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
          <Input id="firstName" label="First Name" error={errors.firstName?.message} {...register("firstName", { required: "Required" })} />
          <Input id="lastName" label="Last Name" error={errors.lastName?.message} {...register("lastName", { required: "Required" })} />
          <Input id="email" label="Email" type="email" error={errors.email?.message} {...register("email", { required: "Required" })} />
          <Input id="password" label="Password" type="password" error={errors.password?.message} {...register("password", { required: "Required", minLength: { value: 8, message: "Min 8 characters" } })} />
          <Select id="locationId" label="Store Location" options={locationOptions} {...register("locationId")} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" loading={createUser.isPending}>Create</Button>
          </div>
        </form>
      </Modal>

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
          className="space-y-4"
        >
          <Input
            id="newPassword"
            label="New Password"
            type="password"
            error={resetForm.formState.errors.newPassword?.message}
            {...resetForm.register("newPassword", { required: "Required", minLength: { value: 8, message: "Min 8 characters" } })}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setResetUserId(null)}>Cancel</Button>
            <Button type="submit" loading={resetPassword.isPending}>Reset</Button>
          </div>
        </form>
      </Modal>

      <Modal open={showLocations} onClose={() => setShowLocations(false)} title="Manage Locations">
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              id="newLocation"
              placeholder="New location name"
              value={newLocationName}
              onChange={(e) => setNewLocationName(e.target.value)}
              className="flex-1"
            />
            <Button
              size="sm"
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
            <div className="space-y-2">
              {locations.map((loc) => (
                <div key={loc.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{loc.name}</p>
                    <p className="text-xs text-gray-400">{loc._count?.users || 0} employees</p>
                  </div>
                  <button
                    onClick={() => deleteLocation.mutate(loc.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50"
                    title="Delete location"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
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
