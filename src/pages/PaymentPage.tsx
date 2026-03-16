import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Banknote, Building, Check, CreditCard, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { BackBreadcrumbHeader } from "@/components/shared/BackBreadcrumbHeader";
import { FileUploader } from "@/components/shared/FileUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/contexts/AppContext";
import { useSiteContext } from "@/contexts/SiteContext";
import { triggerDownload } from "@/lib/download";
import { formatCurrency, getTenantCurrency } from "@/lib/currency";
import { getStoredFileName } from "@/lib/files";
import { BookingService, PaymentService } from "@/services";
import type { PaymentMethod } from "@/types";

const methodVisuals: Record<PaymentMethod, { icon: React.ElementType; description: string }> = {
  momo: { icon: Smartphone, description: "Mobile wallet checkout" },
  card: { icon: CreditCard, description: "Visa or Mastercard" },
  bank_transfer: { icon: Building, description: "Upload proof for admin verification" },
  cash: { icon: Banknote, description: "Pay at the front desk" },
};

const fallbackMethods: { value: PaymentMethod; label: string; icon: React.ElementType; description: string }[] = [
  { value: "momo", label: "Mobile money", icon: Smartphone, description: "MTN, Telecel, AirtelTigo" },
  { value: "card", label: "Card", icon: CreditCard, description: "Visa or Mastercard" },
  { value: "bank_transfer", label: "Bank transfer", icon: Building, description: "Submit proof for verification" },
  { value: "cash", label: "Cash", icon: Banknote, description: "Pay at the front desk" },
];

export default function PaymentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { database, currentUser, session, clearPendingBooking, refreshData } = useApp();
  const { activeTenant, buildPublicPath } = useSiteContext();
  const [method, setMethod] = useState<PaymentMethod>("momo");
  const [step, setStep] = useState<"method" | "details" | "success">("method");
  const [referenceNote, setReferenceNote] = useState("");
  const [createdPaymentId, setCreatedPaymentId] = useState<string | null>(null);

  const groupId = searchParams.get("group");
  const groupBooking = useMemo(
    () => (database && groupId ? database.groupBookings.find((item) => item.id === groupId) : undefined),
    [database, groupId],
  );
  const residentBooking = useMemo(() => {
    if (!database || !currentUser || session.pendingBooking) return undefined;
    return database.bookings.find(
      (booking) => booking.residentId === currentUser.id && (booking.status === "pending" || booking.status === "reserved"),
    );
  }, [currentUser, database, session.pendingBooking]);

  if (!database) return <div className="container py-10">Loading payment...</div>;

  const targetHostelId = groupBooking?.hostelId ?? session.pendingBooking?.hostelId ?? residentBooking?.hostelId ?? currentUser?.hostelId;
  const targetTenantId = targetHostelId ? database.hostels.find((hostel) => hostel.id === targetHostelId)?.tenantId : currentUser?.tenantId ?? activeTenant?.id;
  const paymentConfig = database.tenantPaymentConfigs.find((config) => config.tenantId === targetTenantId);
  const methods = paymentConfig?.supportedMethods.filter((item) => item.enabled).map((item) => ({
    value: item.method,
    label: item.displayLabel,
    icon: methodVisuals[item.method].icon,
    description: item.instructions ?? methodVisuals[item.method].description,
  })) ?? fallbackMethods;
  const checkoutBlocked = Boolean(paymentConfig && methods.length === 0);
  const currentMethodConfig = paymentConfig?.supportedMethods.find((item) => item.method === method);
  const currency = getTenantCurrency(database, targetTenantId);

  useEffect(() => {
    if (!methods.some((item) => item.value === method)) {
      setMethod(methods[0]?.value ?? "momo");
    }
  }, [method, methods]);

  const targetAmount = groupBooking?.amount ?? session.pendingBooking?.amount ?? residentBooking?.amount ?? 0;
  const targetDescription = groupBooking
    ? `${groupBooking.groupName} / ${groupBooking.bedsRequired} beds`
    : session.pendingBooking
      ? `${database.rooms.find((room) => room.id === session.pendingBooking?.roomId)?.name ?? "Pending room"} / ${session.pendingBooking.durationLabel}`
      : residentBooking
        ? `${database.rooms.find((room) => room.id === residentBooking.roomId)?.name ?? "Existing booking"} / ${residentBooking.durationLabel}`
        : "No payment target";

  const handleConfirm = async () => {
    if (!currentUser) {
      toast.error("Sign in first to complete payment.");
      navigate("/login");
      return;
    }

    let bookingId = residentBooking?.id;

    if (!bookingId && session.pendingBooking) {
      const bookingResult = await BookingService.createBooking({
        residentId: currentUser.id,
        hostelId: session.pendingBooking.hostelId,
        roomId: session.pendingBooking.roomId,
        bedId: session.pendingBooking.bedId,
        periodId: session.pendingBooking.periodId,
        durationLabel: session.pendingBooking.durationLabel,
        discountCode: session.pendingBooking.discountCode,
      });
      bookingId = bookingResult.data.id;
    }

    const paymentResult = await PaymentService.createPayment({
      bookingId,
      groupBookingId: groupBooking?.id,
      residentId: currentUser.id,
      amount: targetAmount,
      method,
      receiptName: referenceNote || undefined,
    });

    setCreatedPaymentId(paymentResult.data.id);
    clearPendingBooking();
    await refreshData();
    setStep("success");
    toast.success("Payment submitted.");
  };

  return (
    <div className="container mx-auto max-w-5xl space-y-6 py-6">
      <BackBreadcrumbHeader
        title="Payment"
        backHref={currentUser?.role === "group_organizer" ? "/group-booking" : "/resident/bookings"}
        backLabel="Back"
        breadcrumbs={[
          { label: currentUser?.role === "group_organizer" ? "Group booking" : "Resident dashboard", href: currentUser?.role === "group_organizer" ? "/group-booking" : "/resident" },
          { label: "Payment" },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-5 text-center">
            <p className="text-xs text-muted-foreground">Amount due</p>
            <p className="font-display text-4xl font-bold">{formatCurrency(targetAmount, currency)}</p>
            <p className="mt-2 text-sm text-muted-foreground">{targetDescription}</p>
          </div>

          <div className="rounded-lg border bg-card p-5">
            <h2 className="font-display text-lg font-semibold">Payment summary</h2>
            <div className="mt-4 space-y-2 text-sm">
              <p><span className="text-muted-foreground">Method:</span> {methods.find((item) => item.value === method)?.label ?? method.replace("_", " ")}</p>
              <p><span className="text-muted-foreground">Provider:</span> {paymentConfig?.providerDisplayName ?? "Tenant setup pending"}</p>
              <p><span className="text-muted-foreground">Flow:</span> {groupBooking ? "Group organizer" : "Resident booking"}</p>
              <p><span className="text-muted-foreground">Status after submit:</span> {currentMethodConfig?.channel === "offline" ? "Pending verification" : "Confirmed"}</p>
            </div>
          </div>
        </div>

        <div>
          {step === "method" && (
            <div className="space-y-3 rounded-lg border bg-card p-5">
              <h2 className="font-display text-lg font-semibold">Choose payment method</h2>
              {paymentConfig ? (
                <p className="text-sm text-muted-foreground">
                  {paymentConfig.providerDisplayName} / {paymentConfig.status === "live" ? "live" : paymentConfig.status === "test" ? "test mode" : "draft"} setup
                </p>
              ) : null}
              {checkoutBlocked ? (
                <p className="text-sm text-destructive">
                  This tenant has not enabled any checkout methods yet. Ask the hostel admin to finish payment setup.
                </p>
              ) : null}
              {methods.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setMethod(item.value)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left ${method === item.value ? "border-emerald bg-emerald-light" : ""}`}
                >
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </button>
              ))}
              <Button variant="emerald" className="w-full" disabled={!targetAmount || checkoutBlocked || methods.length === 0} onClick={() => setStep("details")}>
                Continue
              </Button>
            </div>
          )}

          {step === "details" && (
            <div className="space-y-4 rounded-lg border bg-card p-5">
              {method === "momo" && (
                <>
                  <div className="space-y-2">
                    <Label>Mobile number</Label>
                    <Input placeholder="+233 24 000 0000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Network</Label>
                    <Input placeholder="MTN / Telecel / AirtelTigo" />
                  </div>
                </>
              )}

              {method === "card" && (
                <>
                  <div className="space-y-2">
                    <Label>Card number</Label>
                    <Input placeholder="4242 4242 4242 4242" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Expiry</Label>
                      <Input placeholder="MM/YY" />
                    </div>
                    <div className="space-y-2">
                      <Label>CVV</Label>
                      <Input placeholder="123" />
                    </div>
                  </div>
                </>
              )}

              {(method === "bank_transfer" || method === "cash") && (
                <div className="rounded-lg border bg-muted p-4 text-sm">
                  <p className="font-medium">{method === "bank_transfer" ? "Bank transfer instructions" : "Cash payment instructions"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {currentMethodConfig?.instructions ??
                      (method === "bank_transfer"
                        ? "Transfer to the tenant account shown during setup, then upload the proof below."
                        : "Pay at the front desk. The record stays pending until admin verification.")}
                  </p>
                  {currentMethodConfig?.accountName || currentMethodConfig?.accountNumber ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {currentMethodConfig?.accountName ? `${currentMethodConfig.accountName}` : ""}
                      {currentMethodConfig?.accountName && currentMethodConfig?.accountNumber ? " / " : ""}
                      {currentMethodConfig?.accountNumber ?? ""}
                    </p>
                  ) : null}
                </div>
              )}

              {method === "bank_transfer" ? (
                <FileUploader
                  label="Transfer proof"
                  description="Upload the transfer slip or screenshot for admin verification."
                  accept=".pdf,image/*"
                  value={referenceNote}
                  onChange={(nextValue) => setReferenceNote(nextValue)}
                />
              ) : (
                <div className="space-y-2">
                  <Label>Reference note</Label>
                  <Input value={referenceNote} onChange={(event) => setReferenceNote(event.target.value)} placeholder="Payment reference or note" />
                </div>
              )}

              {method === "bank_transfer" && referenceNote ? (
                <p className="text-xs text-muted-foreground">Proof attached: {getStoredFileName(referenceNote)}</p>
              ) : null}

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="emerald" className="flex-1" onClick={() => void handleConfirm()}>
                  Confirm payment
                </Button>
                <Button variant="ghost" className="flex-1" onClick={() => setStep("method")}>
                  Back
                </Button>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="space-y-4 rounded-lg border bg-card p-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-light">
                <Check className="h-8 w-8 text-emerald" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold">Payment submitted</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {method === "cash" || method === "bank_transfer"
                    ? "This payment now awaits admin verification."
                    : "Your receipt is ready to download."}
                </p>
              </div>
              <div className="grid gap-2">
                <Button
                  variant="emerald"
                  className="w-full"
                  onClick={() => navigate(currentUser?.role === "group_organizer" ? "/group-booking" : "/resident")}
                >
                  Return to dashboard
                </Button>
                {!currentUser ? (
                  <Button variant="outline" className="w-full" onClick={() => navigate(buildPublicPath("/properties"))}>
                    Back to site
                  </Button>
                ) : null}
                {createdPaymentId && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={async () => {
                      const result = await PaymentService.downloadReceiptPdf(createdPaymentId);
                      triggerDownload(result.data.filename, result.data.content, result.data.mimeType);
                      toast.success("Receipt downloaded.");
                    }}
                  >
                    Download receipt
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
