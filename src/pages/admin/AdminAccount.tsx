import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/contexts/AppContext";
import { UserService } from "@/services";

export default function AdminAccount() {
  const { currentUser, database, refreshData } = useApp();
  const hostels = useMemo(
    () => database?.hostels.filter((hostel) => hostel.tenantId === currentUser?.tenantId) ?? [],
    [currentUser?.tenantId, database],
  );
  const [form, setForm] = useState({
    name: currentUser?.name ?? "",
    email: currentUser?.email ?? "",
    phone: currentUser?.phone ?? "",
  });

  if (!currentUser) return <div className="py-10">Loading account...</div>;

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Admin account" description="Account details and hostel access." />

      <div className="rounded-lg border bg-card p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Full name</Label>
            <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="emerald"
            onClick={async () => {
              await UserService.updateAccount(currentUser.id, form);
              await refreshData();
              toast.success("Admin account updated.");
            }}
          >
            Save changes
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-5">
        <h2 className="font-display text-lg font-semibold">Assigned hostels</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {hostels.map((hostel) => (
            <div key={hostel.id} className="rounded-md border p-3">
              <p className="font-medium">{hostel.name}</p>
              <p className="text-sm text-muted-foreground">{hostel.location}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
