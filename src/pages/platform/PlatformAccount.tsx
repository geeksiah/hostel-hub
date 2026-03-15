import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/contexts/AppContext";
import { UserService } from "@/services";

export default function PlatformAccount() {
  const { currentUser, refreshData } = useApp();
  const [form, setForm] = useState({
    name: currentUser?.name ?? "",
    email: currentUser?.email ?? "",
    phone: currentUser?.phone ?? "",
  });

  if (!currentUser) return <div className="py-10">Loading account...</div>;

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Platform account" description="Owner account details." />

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

        <div className="mt-4">
          <Button
            variant="emerald"
            onClick={async () => {
              await UserService.updateAccount(currentUser.id, form);
              await refreshData();
              toast.success("Platform account updated.");
            }}
          >
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}
