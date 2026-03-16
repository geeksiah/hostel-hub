import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/contexts/AppContext";
import { formatCurrency, getHostelCurrency } from "@/lib/currency";
import { getGroupWorkspace } from "@/modules/group/selectors";
import { getRoomPriceForPeriod, roomHasActiveRateForPeriod } from "@/services/store";
import { BookingService } from "@/services";
import type { AppDatabase } from "@/types";

function estimateGroupAmount(
  hostelId: string,
  periodId: string,
  bedsRequired: number,
  database: AppDatabase,
) {
  const period = database.periods.find((item) => item.id === periodId);
  const roomPrices = database.rooms
    .filter((room) => room.hostelId === hostelId)
    .filter((room) => !period || roomHasActiveRateForPeriod(database, room.id, period.id))
    .map((room) => getRoomPriceForPeriod(database, room, period));
  const source = roomPrices.filter((price) => price > 0);
  return (source.length ? Math.min(...source) : 0) * bedsRequired;
}

export default function GroupBookingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { database, currentUser, refreshData } = useApp();
  const [form, setForm] = useState({
    groupName: "Field School Africa",
    hostelId: "h1",
    bedsRequired: 8,
    periodId: "p3",
    contactPhone: currentUser?.phone ?? "",
    notes: "Keep rooms close together.",
  });

  const workspace = useMemo(
    () => (database && currentUser ? getGroupWorkspace(database, currentUser.id) : null),
    [currentUser, database],
  );

  if (!database || !currentUser || !workspace) return <div className="container py-10">Loading group requests...</div>;

  const hostels = database.hostels;
  const periods = database.periods.filter((period) => period.hostelId === form.hostelId);
  const estimatedAmount = estimateGroupAmount(form.hostelId, form.periodId, form.bedsRequired, database);
  const currency = getHostelCurrency(database, form.hostelId);
  const highlightedGroupId = searchParams.get("group");

  return (
    <div className="container mx-auto max-w-6xl space-y-6 py-6">
      <PageHeader title="Group booking" description="Requests, allocation, and payment." />

      <div className="rounded-lg border bg-card p-5">
        <h2 className="font-display text-lg font-semibold">New request</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Group name</Label>
              <Input value={form.groupName} onChange={(event) => setForm({ ...form, groupName: event.target.value })} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Hostel</Label>
                <select
                  value={form.hostelId}
                  onChange={(event) => {
                    const hostelId = event.target.value;
                    const periodId = database.periods.find((period) => period.hostelId === hostelId)?.id ?? "";
                    setForm({ ...form, hostelId, periodId });
                  }}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  {hostels.map((hostel) => (
                    <option key={hostel.id} value={hostel.id}>{hostel.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Beds needed</Label>
                <Input type="number" value={form.bedsRequired} onChange={(event) => setForm({ ...form, bedsRequired: Number(event.target.value) })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Stay period</Label>
              <select
                value={form.periodId}
                onChange={(event) => setForm({ ...form, periodId: event.target.value })}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                {periods.map((period) => (
                  <option key={period.id} value={period.id}>{period.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Contact phone</Label>
              <Input value={form.contactPhone} onChange={(event) => setForm({ ...form, contactPhone: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={4} />
            </div>
            <Button
              variant="emerald"
              className="w-full lg:w-auto"
              onClick={async () => {
                await BookingService.createGroupRequest({
                  organizerId: currentUser.id,
                  hostelId: form.hostelId,
                  groupName: form.groupName,
                  bedsRequired: form.bedsRequired,
                  periodId: form.periodId,
                  contactPhone: form.contactPhone,
                  notes: form.notes,
                });
                await refreshData();
                toast.success("Group request submitted.");
              }}
            >
              Submit request
            </Button>
          </div>

          <div className="rounded-lg border bg-muted/40 p-4">
            <p className="text-xs text-muted-foreground">Estimated amount</p>
            <p className="mt-1 font-display text-3xl font-semibold">{formatCurrency(estimatedAmount, currency)}</p>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p>This estimate updates from the selected hostel, period, and bed count.</p>
              <p>Final amount is confirmed after allocation.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {workspace.requests.map((request) => {
          const hostel = database.hostels.find((item) => item.id === request.hostelId);
          const period = database.periods.find((item) => item.id === request.periodId);
          return (
            <div key={request.id} className={`rounded-lg border bg-card p-5 ${highlightedGroupId === request.id ? "border-emerald/40 bg-emerald-light/30" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-semibold">{request.groupName}</h2>
                  <p className="text-sm text-muted-foreground">
                    {hostel?.name} / {period?.name}
                  </p>
                </div>
                <StatusBadge
                  status={request.status}
                  variant={request.status === "confirmed" ? "success" : request.status === "allocated" ? "info" : "warning"}
                />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-md bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Beds</p>
                  <p className="font-display text-lg font-semibold">{request.bedsRequired}</p>
                </div>
                <div className="rounded-md bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Allocated</p>
                  <p className="font-display text-lg font-semibold">{request.bedsAllocated}</p>
                </div>
                <div className="rounded-md bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="font-display text-lg font-semibold">{formatCurrency(request.amount, getHostelCurrency(database, request.hostelId))}</p>
                </div>
              </div>

              {request.notes && <p className="mt-3 text-sm text-muted-foreground">{request.notes}</p>}

              <div className="mt-4 flex flex-wrap gap-2">
                {request.status === "allocated" && (
                  <Button variant="emerald" size="sm" onClick={() => navigate(`/payment?group=${request.id}`)}>
                    Pay now
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => navigate("/group/profile")}>
                  Update profile
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
