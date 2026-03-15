import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { QrService } from "@/services";
import { useApp } from "@/contexts/AppContext";
import { formatCurrency, getUserCurrency } from "@/lib/currency";

export default function ResidentQR() {
  const { database, currentUser } = useApp();
  const [qrValue, setQrValue] = useState("");

  useEffect(() => {
    if (!currentUser) return;
    void QrService.generateResidentQr(currentUser.id).then((result) => setQrValue(result.data));
  }, [currentUser]);

  if (!database || !currentUser) return <div className="container py-10">Loading QR...</div>;

  const booking = database.bookings.find((item) => item.residentId === currentUser.id && item.status !== "cancelled");
  const room = booking ? database.rooms.find((item) => item.id === booking.roomId) : undefined;
  const hostel = database.hostels.find((item) => item.id === booking?.hostelId);
  const currency = getUserCurrency(database, currentUser.id);

  return (
    <div className="container mx-auto max-w-5xl space-y-6 py-6">
      <PageHeader title="Resident QR ID" description="Show this code for verification." />

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border bg-card p-6 text-center">
          <p className="font-display text-2xl font-bold">{currentUser.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">{room ? `Room ${room.name} / ${hostel?.name}` : "No active assignment"}</p>
          <div className="mt-6 flex justify-center">
            <QRCodeSVG value={qrValue} size={240} level="H" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-5">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald" />
              <div>
                <h2 className="font-display text-lg font-semibold">Verification details</h2>
                <p className="text-sm text-muted-foreground">Staff can scan this code to confirm your record.</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-5">
            <h2 className="font-display text-lg font-semibold">Current stay</h2>
            {booking ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{hostel?.name}</p>
                    <p className="text-sm text-muted-foreground">Room {room?.name} / {booking.durationLabel}</p>
                  </div>
                  <StatusBadge status={booking.status} type="booking" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="font-display text-lg font-semibold">{formatCurrency(booking.amount, currency)}</p>
                  </div>
                  <div className="rounded-md bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Booking ID</p>
                    <p className="font-medium">{booking.id}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">There is no active booking tied to this account yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
