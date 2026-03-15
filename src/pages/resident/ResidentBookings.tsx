import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/contexts/AppContext";
import { useSiteContext } from "@/contexts/SiteContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { getBrowsePath } from "@/lib/app-shell";
import { formatCurrency, getUserCurrency } from "@/lib/currency";
import { BookingService, ResidentService } from "@/services";

export default function ResidentBookings() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { database, currentUser, refreshData } = useApp();
  const { buildPublicPath } = useSiteContext();
  const isMobile = useIsMobile();
  const [roomChangeOpen, setRoomChangeOpen] = useState(false);
  const [activeBookingId, setActiveBookingId] = useState("");
  const [roomChangeForm, setRoomChangeForm] = useState({
    preferredRoomType: "single",
    preferredPeriod: "",
    note: "",
  });
  const bookings = database?.bookings.filter((booking) => booking.residentId === currentUser?.id) ?? [];
  const waitingList = database?.waitingList.filter((entry) => entry.residentId === currentUser?.id) ?? [];
  const activeBooking = useMemo(
    () => bookings.find((booking) => booking.id === activeBookingId),
    [activeBookingId, bookings],
  );
  const activePeriods = database?.periods.filter((period) => period.hostelId === activeBooking?.hostelId) ?? [];
  const browsePath = getBrowsePath(currentUser, buildPublicPath);
  const highlightedBookingId = searchParams.get("booking");
  const highlightedWaitlistId = searchParams.get("waitlist");

  if (!database || !currentUser) return <div className="container py-10">Loading bookings...</div>;
  const currency = getUserCurrency(database, currentUser.id);

  const roomChangeContent = (
    <>
      <div className="space-y-4 px-4 sm:px-0">
        <div className="space-y-2">
          <Label>Preferred room type</Label>
          <select
            value={roomChangeForm.preferredRoomType}
            onChange={(event) => setRoomChangeForm({ ...roomChangeForm, preferredRoomType: event.target.value })}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="single">Single</option>
            <option value="double">Double</option>
            <option value="triple">Triple</option>
            <option value="quad">Quad</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Preferred period</Label>
          <select
            value={roomChangeForm.preferredPeriod}
            onChange={(event) => setRoomChangeForm({ ...roomChangeForm, preferredPeriod: event.target.value })}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="">Keep current period</option>
            {activePeriods.map((period) => (
              <option key={period.id} value={period.id}>{period.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Reason</Label>
          <Textarea
            rows={5}
            value={roomChangeForm.note}
            onChange={(event) => setRoomChangeForm({ ...roomChangeForm, note: event.target.value })}
            placeholder="Tell the hostel team what needs to change."
          />
        </div>
        <div className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
          Current booking: {activeBooking ? `Room ${database.rooms.find((item) => item.id === activeBooking.roomId)?.name} / ${activeBooking.durationLabel}` : "-"}
        </div>
      </div>
      <div className="px-4 pb-4 sm:px-0 sm:pb-0">
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => setRoomChangeOpen(false)}>Cancel</Button>
          <Button
            variant="emerald"
            onClick={async () => {
              if (!activeBooking) return;
              await ResidentService.requestRoomChange(
                currentUser.id,
                "Room change request",
                [
                  roomChangeForm.note || "Resident requested a room change.",
                  `Preferred room type: ${roomChangeForm.preferredRoomType}`,
                  roomChangeForm.preferredPeriod ? `Preferred period: ${activePeriods.find((period) => period.id === roomChangeForm.preferredPeriod)?.name}` : "Preferred period: current period",
                  `Booking: ${activeBooking.id}`,
                ].join("\n"),
                activeBooking.hostelId,
              );
              await refreshData();
              setRoomChangeOpen(false);
              setRoomChangeForm({ preferredRoomType: "single", preferredPeriod: "", note: "" });
              toast.success("Room change request sent.");
            }}
          >
            Submit request
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <div className="container mx-auto max-w-6xl space-y-6 py-6">
      <PageHeader title="My bookings" description="Bookings, waitlist, and next steps." />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div>
          {bookings.length === 0 ? (
            <EmptyState
              title="No bookings yet"
              description="Browse rooms to make your first booking."
              action={<Button variant="emerald" onClick={() => navigate(browsePath)}>Browse rooms</Button>}
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {bookings.map((booking) => {
                const room = database.rooms.find((item) => item.id === booking.roomId);
                const hostel = database.hostels.find((item) => item.id === booking.hostelId);
                return (
                  <div key={booking.id} className={`rounded-lg border bg-card p-4 ${highlightedBookingId === booking.id ? "border-emerald/40 bg-emerald-light/30" : ""}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-display text-lg font-semibold">Room {room?.name}</h2>
                        <p className="text-sm text-muted-foreground">{hostel?.name} / {booking.durationLabel}</p>
                      </div>
                      <StatusBadge status={booking.status} type="booking" />
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                      <p><span className="text-muted-foreground">Amount:</span> {formatCurrency(booking.amount, currency)}</p>
                      <p><span className="text-muted-foreground">Created:</span> {booking.createdAt.slice(0, 10)}</p>
                      {booking.checkInDate && <p><span className="text-muted-foreground">Check-in:</span> {booking.checkInDate.slice(0, 10)}</p>}
                      {booking.checkOutDate && <p><span className="text-muted-foreground">Check-out:</span> {booking.checkOutDate.slice(0, 10)}</p>}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {(booking.status === "pending" || booking.status === "reserved") && (
                        <>
                          <Button variant="emerald" size="sm" onClick={() => navigate("/payment")}>
                            Pay now
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              await BookingService.cancelBooking(booking.id);
                              await refreshData();
                              toast.success("Booking cancelled.");
                            }}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                      {booking.status !== "cancelled" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const room = database.rooms.find((item) => item.id === booking.roomId);
                            setActiveBookingId(booking.id);
                            setRoomChangeForm({
                              preferredRoomType: room?.type ?? "single",
                              preferredPeriod: booking.periodId,
                              note: "",
                            });
                            setRoomChangeOpen(true);
                          }}
                        >
                          Room change
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => navigate("/resident/qr")}>
                        View QR
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-5">
            <h2 className="font-display text-lg font-semibold">Waiting list</h2>
            {waitingList.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">You are not on any waiting list.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {waitingList.map((entry) => (
                  <div key={entry.id} className={`flex items-center justify-between rounded-lg border p-3 ${highlightedWaitlistId === entry.id ? "border-emerald/40 bg-emerald-light/30" : ""}`}>
                    <div>
                      <p className="font-medium capitalize">{entry.roomType} room</p>
                      <p className="text-xs text-muted-foreground">Position {entry.position}</p>
                    </div>
                    <StatusBadge status={entry.status} variant={entry.status === "waiting" ? "warning" : entry.status === "notified" ? "info" : "success"} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border bg-card p-5">
            <h2 className="font-display text-lg font-semibold">Need another room?</h2>
            <p className="mt-2 text-sm text-muted-foreground">Browse current room options before sending a room-change request.</p>
            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={() => navigate(browsePath)}>Browse rooms</Button>
            </div>
          </div>
        </div>
      </div>

      {isMobile ? (
        <Sheet open={roomChangeOpen} onOpenChange={setRoomChangeOpen}>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>Room change request</SheetTitle>
              <SheetDescription>Tell the team what should change.</SheetDescription>
            </SheetHeader>
            {roomChangeContent}
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={roomChangeOpen} onOpenChange={setRoomChangeOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Room change request</DialogTitle>
              <DialogDescription>Request a change for this booking.</DialogDescription>
            </DialogHeader>
            {roomChangeContent}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
