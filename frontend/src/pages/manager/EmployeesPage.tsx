import { useState } from "react";
import { useForm } from "react-hook-form";
import { TopBar } from "../../components/layout/TopBar";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Badge } from "../../components/ui/Badge";
import { Spinner } from "../../components/ui/Spinner";
import { EmptyState } from "../../components/ui/EmptyState";
import { useUsers, useCreateUser, useDisableUser, useEnableUser, useResetPassword } from "../../hooks/useUsers";
import { Users, Plus, UserX, UserCheck, KeyRound } from "lucide-react";

interface CreateEmployeeForm {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export function EmployeesPage() {
  const { data: users, isLoading } = useUsers("EMPLOYEE");
  const createUser = useCreateUser();
  const disableUser = useDisableUser();
  const enableUser = useEnableUser();
  const resetPassword = useResetPassword();
  const [showCreate, setShowCreate] = useState(false);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateEmployeeForm>();
  const resetForm = useForm<{ newPassword: string }>();

  const onCreateSubmit = (data: CreateEmployeeForm) => {
    createUser.mutate(
      { ...data, role: "EMPLOYEE" },
      {
        onSuccess: () => {
          setShowCreate(false);
          reset();
        },
      },
    );
  };

  return (
    <>
      <TopBar title="Employees" />
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">{users?.length || 0} employees</p>
          <Button onClick={() => setShowCreate(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Employee
          </Button>
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
                </div>
                <div className="flex items-center gap-2">
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
    </>
  );
}
