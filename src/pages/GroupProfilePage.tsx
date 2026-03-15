import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/contexts/AppContext";
import { BookingService, QrService, UserService } from "@/services";

export default function GroupProfilePage() {
  const { currentUser, database, refreshData } = useApp();
  const latestRequest = useMemo(
    () => database?.groupBookings.find((request) => request.organizerId === currentUser?.id),
    [currentUser?.id, database],
  );
  const [qrValue, setQrValue] = useState("");
  const [form, setForm] = useState({
    name: currentUser?.name ?? "",
    email: currentUser?.email ?? "",
    phone: currentUser?.phone ?? "",
    notes: latestRequest?.notes ?? "",
  });

  useEffect(() => {
    if (!latestRequest) return;
    void QrService.generateGroupQr(latestRequest.id).then((result) => setQrValue(result.data));
  }, [latestRequest]);

  if (!currentUser) return <div className="container py-10">Loading profile...</div>;

  return (
    <div className="container mx-auto max-w-5xl space-y-6 py-6">
      <PageHeader title="Organizer profile" description="Group contact details and notes." />

      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-lg border bg-card p-5">
          <div className="space-y-4">
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
            <div className="space-y-2">
              <Label>Default notes</Label>
              <Textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={4} />
            </div>
            <Button
              variant="emerald"
              className="w-full"
              onClick={async () => {
                await UserService.updateAccount(currentUser.id, {
                  name: form.name,
                  email: form.email,
                  phone: form.phone,
                });
                if (latestRequest) {
                  await BookingService.updateGroupRequest(latestRequest.id, { notes: form.notes, contactPhone: form.phone });
                }
                await refreshData();
                toast.success("Organizer profile updated.");
              }}
            >
              Save changes
            </Button>
          </div>
        </div>

        {latestRequest ? (
          <div className="space-y-4">
            <div className="rounded-lg border bg-card p-5 text-center">
              <h2 className="font-display text-lg font-semibold">Group access QR</h2>
              <p className="mt-1 text-sm text-muted-foreground">Security can scan this code to verify the current group allocation status.</p>
              <div className="mt-5 flex justify-center">
                <QRCodeSVG value={qrValue || latestRequest.id} size={220} level="H" />
              </div>
            </div>

            <div className="rounded-lg border bg-card p-5">
              <h2 className="font-display text-lg font-semibold">Latest request</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-md bg-muted p-3">
                <p className="text-xs text-muted-foreground">Group</p>
                <p className="font-medium">{latestRequest.groupName}</p>
              </div>
              <div className="rounded-md bg-muted p-3">
                <p className="text-xs text-muted-foreground">Beds required</p>
                <p className="font-display text-lg font-semibold">{latestRequest.bedsRequired}</p>
              </div>
              <div className="rounded-md bg-muted p-3">
                <p className="text-xs text-muted-foreground">Allocated</p>
                <p className="font-display text-lg font-semibold">{latestRequest.bedsAllocated}</p>
              </div>
              <div className="rounded-md bg-muted p-3">
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="font-medium capitalize">{latestRequest.status.replace(/_/g, " ")}</p>
              </div>
            </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
