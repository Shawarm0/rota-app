import { useState } from "react";
import { useForm } from "react-hook-form";
import { TopBar } from "../../components/layout/TopBar";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Badge } from "../../components/ui/Badge";
import { Spinner } from "../../components/ui/Spinner";
import { useUsers, useCreateUser } from "../../hooks/useUsers";
import { Plus, Users } from "lucide-react";

interface CreateManagerForm {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  businessId: string;
}

export function AdminPage() {
  const { data: managers, isLoading: managersLoading } = useUsers("MANAGER");
  const createUser = useCreateUser();
  const [showCreateManager, setShowCreateManager] = useState(false);
  const managerForm = useForm<CreateManagerForm>();

  const onCreateManager = (data: CreateManagerForm) => {
    createUser.mutate(
      { ...data, role: "MANAGER" },
      { onSuccess: () => { setShowCreateManager(false); managerForm.reset(); } },
    );
  };

  return (
    <>
      <TopBar title="System Admin" />
      <div className="p-4 md:p-6 space-y-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Users className="h-4 w-4" /> Managers
            </h3>
            <Button size="sm" onClick={() => setShowCreateManager(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add Manager
            </Button>
          </div>
          {managersLoading ? (
            <Spinner />
          ) : (
            <div className="space-y-2">
              {managers?.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{m.firstName} {m.lastName}</p>
                    <p className="text-xs text-gray-500">{m.email}</p>
                  </div>
                  <Badge variant={m.active ? "green" : "red"}>
                    {m.active ? "Active" : "Disabled"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Modal open={showCreateManager} onClose={() => setShowCreateManager(false)} title="Add Manager">
        <form onSubmit={managerForm.handleSubmit(onCreateManager)} className="space-y-4">
          <Input id="mFirstName" label="First Name" {...managerForm.register("firstName", { required: true })} />
          <Input id="mLastName" label="Last Name" {...managerForm.register("lastName", { required: true })} />
          <Input id="mEmail" label="Email" type="email" {...managerForm.register("email", { required: true })} />
          <Input id="mPassword" label="Password" type="password" {...managerForm.register("password", { required: true, minLength: 8 })} />
          <Input id="mBusinessId" label="Business ID" {...managerForm.register("businessId", { required: true })} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setShowCreateManager(false)}>Cancel</Button>
            <Button type="submit" loading={createUser.isPending}>Create</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
