import { useState } from "react";
import { useForm, type UseFormRegister } from "react-hook-form";
import { TopBar } from "../../components/layout/TopBar";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Badge } from "../../components/ui/Badge";
import { Spinner } from "../../components/ui/Spinner";
import { useUsers, useCreateUser, useDeleteUser } from "../../hooks/useUsers";
import { useBusinesses, useCreateBusiness } from "../../hooks/useBusinesses";
import { Plus, Users, Trash2, Building2, Search, MapPin, UserPlus } from "lucide-react";
import type { User } from "../../types";

interface OwnerForm {
  // Business name, only used when creating a new business
  name?: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

function roleLabel(user: User) {
  if (user.role === "OWNER") return "Owner";
  if (user.role === "MANAGER") return "Store Manager";
  return user.isAssistantManager ? "Assistant Manager" : "Employee";
}

function OwnerFields({ register }: { register: UseFormRegister<OwnerForm> }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Input id="ownerFirstName" label="First Name" {...register("firstName", { required: true })} />
        <Input id="ownerLastName" label="Last Name" {...register("lastName", { required: true })} />
      </div>
      <Input id="ownerEmail" label="Email" type="email" {...register("email", { required: true })} />
      <Input id="ownerPassword" label="Password" type="password" {...register("password", { required: true, minLength: 8 })} />
    </>
  );
}

export function AdminPage() {
  const { data: businesses, isLoading: businessesLoading } = useBusinesses();
  const { data: users, isLoading: usersLoading } = useUsers();
  const createBusiness = useCreateBusiness();
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();
  const [showNewBusiness, setShowNewBusiness] = useState(false);
  const [ownerForBusiness, setOwnerForBusiness] = useState<string | null>(null);
  const [businessFilter, setBusinessFilter] = useState("");
  const [search, setSearch] = useState("");
  const businessForm = useForm<OwnerForm>();
  const ownerForm = useForm<OwnerForm>();

  const businessName = (id: string | null) => businesses?.find((b) => b.id === id)?.name ?? "—";

  // Everyone except system admins, so any person can be found and permanently deleted
  const people = (users ?? [])
    .filter((u) => u.role !== "SYSTEM_ADMIN")
    .filter((u) => !businessFilter || u.businessId === businessFilter)
    .filter((u) => `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase()));

  const onCreateBusiness = ({ name, ...owner }: OwnerForm) => {
    createBusiness.mutate(
      { name: name ?? "", owner },
      { onSuccess: () => { setShowNewBusiness(false); businessForm.reset(); } },
    );
  };

  const onAddOwner = ({ name: _name, ...data }: OwnerForm) => {
    if (!ownerForBusiness) return;
    createUser.mutate(
      { ...data, role: "OWNER", businessId: ownerForBusiness },
      { onSuccess: () => { setOwnerForBusiness(null); ownerForm.reset(); } },
    );
  };

  const onDelete = (user: User) => {
    if (confirm(`Permanently delete ${user.firstName} ${user.lastName}? Their holidays and notifications are removed and their shifts become open. This cannot be undone.`)) {
      deleteUser.mutate(user.id);
    }
  };

  return (
    <>
      <TopBar title="System Admin" />
      <div className="p-4 md:p-6 space-y-6 max-w-[1000px]">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Businesses
            </h3>
            <Button size="sm" onClick={() => setShowNewBusiness(true)}>
              <Plus className="h-4 w-4 mr-1" /> New Business
            </Button>
          </div>
          {businessesLoading ? (
            <Spinner />
          ) : !businesses?.length ? (
            <p className="text-sm text-gray-500">No businesses yet</p>
          ) : (
            <div className="space-y-2">
              {businesses.map((b) => (
                <div key={b.id} className="flex items-start justify-between gap-3 py-2 border-b last:border-0 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{b.name}</p>
                    <p className="text-xs text-gray-500">
                      Owner: {b.users.length ? b.users.map((o) => `${o.firstName} ${o.lastName}`).join(", ") : "none"}
                      {" · "}
                      {b._count.users} {b._count.users === 1 ? "person" : "people"}
                    </p>
                    {b.locations.length > 0 && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        {b.locations.map((l) => l.name).join(", ")}
                      </p>
                    )}
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => setOwnerForBusiness(b.id)}>
                    <UserPlus className="h-4 w-4 mr-1" /> Add Owner
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Users className="h-4 w-4" /> People
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              {businesses && businesses.length > 1 && (
                <select
                  value={businessFilter}
                  onChange={(e) => setBusinessFilter(e.target.value)}
                  className="py-[7px] px-2.5 border border-gray-200 rounded-lg text-[13px] text-gray-800 bg-white outline-none"
                >
                  <option value="">All businesses</option>
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              )}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search people"
                  className="pl-8 pr-3 py-[7px] border border-gray-200 rounded-lg text-[13px] w-[190px] outline-none bg-white"
                />
              </div>
            </div>
          </div>
          {usersLoading ? (
            <Spinner />
          ) : !people.length ? (
            <p className="text-sm text-gray-500">No people found</p>
          ) : (
            <div className="space-y-2">
              {people.map((u) => (
                <div key={u.id} className="flex items-center justify-between gap-3 py-2 border-b last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{u.firstName} {u.lastName}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {u.email} · {businessName(u.businessId)}
                      {u.location ? ` · ${u.location.name}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={u.role === "OWNER" ? "purple" : u.role === "MANAGER" ? "blue" : "gray"}>{roleLabel(u)}</Badge>
                    {!u.active && <Badge variant="red">Disabled</Badge>}
                    <button onClick={() => onDelete(u)} className="p-1.5 rounded-lg hover:bg-red-50" title="Permanently delete">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Modal open={showNewBusiness} onClose={() => setShowNewBusiness(false)} title="New Business">
        <form onSubmit={businessForm.handleSubmit(onCreateBusiness)} className="flex flex-col gap-4">
          <Input id="businessName" label="Business Name" {...businessForm.register("name", { required: true })} />
          <p className="text-[13px] font-semibold text-gray-700 -mb-2">Owner</p>
          <OwnerFields register={businessForm.register} />
          <p className="text-[12px] text-gray-500 -mt-2">The owner can then add stores, store managers and staff.</p>
          <div className="flex justify-end gap-2.5 border-t border-gray-200 pt-4 -mx-[22px] px-[22px] -mb-[22px] pb-4">
            <Button variant="secondary" type="button" onClick={() => setShowNewBusiness(false)}>Cancel</Button>
            <Button type="submit" loading={createBusiness.isPending}>Create</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!ownerForBusiness} onClose={() => setOwnerForBusiness(null)} title={`Add Owner · ${businessName(ownerForBusiness)}`}>
        <form onSubmit={ownerForm.handleSubmit(onAddOwner)} className="flex flex-col gap-4">
          <OwnerFields register={ownerForm.register} />
          <div className="flex justify-end gap-2.5 border-t border-gray-200 pt-4 -mx-[22px] px-[22px] -mb-[22px] pb-4">
            <Button variant="secondary" type="button" onClick={() => setOwnerForBusiness(null)}>Cancel</Button>
            <Button type="submit" loading={createUser.isPending}>Create</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
